"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, CatmullRomCurve3, Color, InstancedMesh, Object3D, SRGBColorSpace, Vector3, type Mesh, type MeshBasicMaterial, type Sprite, type SpriteMaterial } from "three";
import { getPhase, type Phase } from "../protocol";
import { AVATAR_POS, COLORS, PARTY_COLOR, RELAY_POS, easeInOutCubic, smoothstep, type Anchors } from "./theme";

const TRAIL = 34;
const PULSES = 4;
const tmp = new Object3D();
const tmpColor = new Color();
const bgColor = new Color(COLORS.bg);

function stepColor(phase: Phase): string {
  switch (phase.kind) {
    case "lock":
      return PARTY_COLOR[phase.sender];
    case "claim":
      return PARTY_COLOR[phase.receiver];
    case "verify":
      return COLORS.relay;
    default:
      return COLORS.proof;
  }
}

function stepPoints(phase: Phase, anchors: Anchors, out: Vector3[]) {
  const { sender, receiver } = phase;
  const av = (p: typeof sender) => AVATAR_POS[p];
  const pts: Vector3[] = [];
  switch (phase.kind) {
    case "lock":
      pts.push(av(sender), anchors.nearBlock[sender]);
      break;
    case "proof":
      pts.push(anchors.nearBlock[sender], RELAY_POS);
      break;
    case "verify":
      pts.push(RELAY_POS, anchors.nearBlock[receiver]);
      break;
    case "claim":
      pts.push(anchors.nearBlock[receiver], av(receiver));
      break;
    case "ack":
      pts.push(av(receiver), RELAY_POS, av(sender));
      break;
  }
  // arc the path toward the camera so it reads in 3D
  out.length = 0;
  pts.forEach((p, i) => {
    out.push(p.clone());
    const next = pts[i + 1];
    if (next) out.push(p.clone().lerp(next, 0.5).add(new Vector3(0, 0, 1.1)));
  });
}

function createGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

interface PacketProps {
  anchors: Anchors;
  frozen: boolean;
}

/** A glowing packet with a bead trail, plus expanding pulse rings at each hand-off. */
export function Packet({ anchors, frozen }: PacketProps) {
  const head = useRef<Mesh>(null);
  const glow = useRef<Sprite>(null);
  const glowTexture = useMemo(() => createGlowTexture(), []);
  const trail = useRef<InstancedMesh>(null);
  const pulses = useRef<(Mesh | null)[]>([]);
  const history = useRef<Vector3[]>(Array.from({ length: TRAIL }, () => new Vector3()));
  const lastSeq = useRef(-1);
  const pulseStart = useRef<number[]>(Array(PULSES).fill(-10));
  const pulseNext = useRef(0);
  const points = useRef<Vector3[]>([]);
  const curve = useRef<CatmullRomCurve3 | null>(null);
  const invalidate = useThree((s) => s.invalidate);

  const pulseColors = useMemo(() => Array.from({ length: PULSES }, () => new Color(COLORS.proof)), []);

  useEffect(() => {
    if (frozen) invalidate();
    return () => glowTexture.dispose();
  }, [frozen, invalidate, glowTexture]);

  useFrame((state) => {
    const now = frozen ? 4200 : Date.now();
    const phase = getPhase(now);
    const t = state.clock.elapsedTime;

    if (phase.seq !== lastSeq.current) {
      lastSeq.current = phase.seq;
      const fire = (pos: Vector3, color: string) => {
        const k = pulseNext.current++ % PULSES;
        pulseStart.current[k] = t;
        pulses.current[k]?.position.copy(pos);
        pulseColors[k].set(color);
      };
      stepPoints(phase, anchors, points.current);
      fire(points.current[0], stepColor(phase));
    }

    // Recompute the path every frame: blocks move, so endpoints drift.
    stepPoints(phase, anchors, points.current);
    if (!curve.current || curve.current.points.length !== points.current.length) {
      curve.current = new CatmullRomCurve3(points.current, false, "catmullrom", 0.4);
    } else {
      curve.current.points = points.current;
    }
    const p = easeInOutCubic(Math.min(1, phase.progress * 1.05));
    const pos = curve.current.getPoint(Math.min(p, 1));
    const visible = smoothstep(Math.min(phase.progress / 0.08, (1 - phase.progress) / 0.12));
    const color = stepColor(phase);

    // arrival pulse at the end of the step
    if (phase.progress > 0.93 && pulseStart.current[(pulseNext.current + PULSES - 1) % PULSES] < t - 0.5) {
      const k = pulseNext.current++ % PULSES;
      pulseStart.current[k] = t;
      pulses.current[k]?.position.copy(pos);
      pulseColors[k].set(color);
    }

    if (head.current) {
      head.current.position.copy(pos);
      head.current.scale.setScalar(Math.max(0.0001, 0.3 * visible));
      head.current.rotation.set(t * 3, t * 2, 0);
      (head.current.material as MeshBasicMaterial).color.set(color);
    }
    if (glow.current) {
      glow.current.position.copy(pos);
      glow.current.scale.setScalar(Math.max(0.0001, 1.5 * visible * (0.9 + 0.1 * Math.sin(t * 9))));
      (glow.current.material as SpriteMaterial).color.set(color);
    }

    const h = history.current;
    for (let i = TRAIL - 1; i > 0; i--) h[i].copy(h[i - 1]);
    h[0].copy(pos);
    if (trail.current) {
      tmpColor.set(color);
      for (let i = 0; i < TRAIL; i++) {
        const f = 1 - i / TRAIL;
        tmp.position.copy(h[i]);
        tmp.scale.setScalar(Math.max(0.0001, 0.16 * f * f * visible));
        tmp.updateMatrix();
        trail.current.setMatrixAt(i, tmp.matrix);
        trail.current.setColorAt(i, tmpColor.clone().lerp(bgColor, 1 - f * 0.9));
      }
      trail.current.instanceMatrix.needsUpdate = true;
      if (trail.current.instanceColor) trail.current.instanceColor.needsUpdate = true;
    }

    for (let k = 0; k < PULSES; k++) {
      const m = pulses.current[k];
      if (!m) continue;
      const age = t - pulseStart.current[k];
      const a = age >= 0 && age < 1.1 ? age / 1.1 : -1;
      m.visible = a >= 0;
      if (a >= 0) {
        m.scale.setScalar(0.3 + a * 2.1);
        const mat = m.material as MeshBasicMaterial;
        mat.opacity = (1 - a) * 0.85;
        mat.color.copy(pulseColors[k]);
      }
    }
  });

  return (
    <group>
      <sprite ref={glow} renderOrder={7}>
        <spriteMaterial map={glowTexture} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </sprite>
      <mesh ref={head}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
      <instancedMesh ref={trail} args={[undefined, undefined, TRAIL]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {Array.from({ length: PULSES }, (_, k) => (
        <mesh key={k} ref={(m) => void (pulses.current[k] = m)} visible={false} renderOrder={6}>
          <ringGeometry args={[0.85, 1, 48]} />
          <meshBasicMaterial transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
