"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BoxGeometry, EdgesGeometry, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, type CanvasTexture, type Group, type Mesh } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Party } from "../protocol";
import { COLORS, LANE_Y, PARTY_COLOR, AVATAR_POS, clamp01, easeInOutCubic, smoothstep, type Anchors } from "./theme";
import { createBlockTexture, drawBlockTexture } from "./block-texture";

const COUNT = 10;
const HALF = COUNT / 2;
const SPACING = 1.95;
const SIZE = 1.1;
const SHIFT_SECONDS = 1.1;

interface Slot {
  group: Group;
  core: Mesh;
  texture: CanvasTexture;
  height: number;
  wraps: number;
}

interface ChainLaneProps {
  party: Party;
  /** seconds between new blocks */
  blockTime: number;
  baseHeight: number;
  anchors: Anchors;
  frozen: boolean;
  /** decorative background lane: no labels, no anchors, more transparent */
  ghost?: { y: number; z: number; scale: number };
}

export function ChainLane({ party, blockTime, baseHeight, anchors, frozen, ghost }: ChainLaneProps) {
  const accent = PARTY_COLOR[party];
  const y = ghost ? ghost.y : LANE_Y[party];
  const invalidate = useThree((s) => s.invalidate);
  const slots = useRef<Slot[]>([]);
  const groupRefs = useRef<(Group | null)[]>([]);
  const coreRefs = useRef<(Mesh | null)[]>([]);
  const faceRefs = useRef<(Mesh | null)[]>([]);

  const { boxGeo, coreGeo, edgesGeo, glassMat, coreMat, barMat } = useMemo(() => {
    const box = new RoundedBoxGeometry(SIZE, SIZE, SIZE, 5, 0.14);
    const core = new RoundedBoxGeometry(SIZE * 0.6, SIZE * 0.6, SIZE * 0.6, 3, 0.08);
    const edges = new EdgesGeometry(new BoxGeometry(SIZE, SIZE, SIZE));
    return {
      boxGeo: box,
      coreGeo: core,
      edgesGeo: edges,
      glassMat: new MeshPhysicalMaterial({
        color: COLORS.glass,
        roughness: 0.1,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: ghost ? 0.28 : 0.72,
        envMapIntensity: 1.1,
      }),
      coreMat: new MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.9, roughness: 0.35, transparent: !!ghost, opacity: ghost ? 0.3 : 1 }),
      barMat: new MeshStandardMaterial({ color: accent, roughness: 0.5, transparent: !!ghost, opacity: ghost ? 0.3 : 1 }),
    };
  }, [accent, ghost]);

  // Build one texture per slot once, and redraw it when the slot's block height changes.
  useEffect(() => {
    const list: Slot[] = [];
    for (let i = 0; i < COUNT; i++) {
      const group = groupRefs.current[i];
      const core = coreRefs.current[i];
      if (!group || !core) continue;
      const texture = createBlockTexture();
      list.push({ group, core, texture, height: baseHeight + i, wraps: 0 });
      const face = faceRefs.current[i]?.material;
      if (face instanceof MeshBasicMaterial) {
        face.map = texture;
        face.needsUpdate = true;
      }
    }
    slots.current = list;
    const redrawAll = () => {
      list.forEach((s) => drawBlockTexture(s.texture, s.height, accent));
      invalidate();
    };
    redrawAll();
    // Web fonts may land after first paint; redraw once they are ready.
    void document.fonts?.ready.then(redrawAll);
    return () => list.forEach((s) => s.texture.dispose());
  }, [accent, baseHeight, invalidate]);

  useFrame((state) => {
    const t = frozen ? 7.3 : state.clock.elapsedTime;
    const k = Math.floor(t / blockTime);
    const frac = clamp01((t - k * blockTime) / SHIFT_SECONDS);
    const offset = k + easeInOutCubic(frac);
    const avatarX = AVATAR_POS[party].x;
    let nearest = Infinity;

    slots.current.forEach((slot, i) => {
      const u = i - offset + HALF;
      const w = Math.floor(u / COUNT);
      const pos = u - w * COUNT - HALF;
      const x = pos * SPACING;
      const edge = Math.min(pos + HALF - 0.4, HALF - 0.4 - pos);
      const s = smoothstep(edge / 1.4);
      slot.group.position.x = x;
      slot.group.scale.setScalar(Math.max(s, 0.0001));
      slot.group.visible = s > 0.002;
      slot.core.rotation.y = t * 0.6 + i;
      (slot.core.material as MeshStandardMaterial).emissiveIntensity = 0.75 + 0.35 * Math.sin(t * 2 + i * 1.7);

      if (w !== slot.wraps) {
        slot.wraps = w;
        slot.height = baseHeight + i - w * COUNT;
        drawBlockTexture(slot.texture, slot.height, accent);
      }
      const dist = Math.abs(x - avatarX);
      if (!ghost && s > 0.5 && dist < nearest) {
        nearest = dist;
        anchors.nearBlock[party].set(x, y, 0);
      }
    });
  });

  return (
    <group position={[0, y, ghost ? ghost.z : 0]} scale={ghost ? ghost.scale : 1}>
      {Array.from({ length: COUNT }, (_, i) => (
        <group key={i} ref={(g) => void (groupRefs.current[i] = g)}>
          <mesh geometry={boxGeo} material={glassMat} renderOrder={2} />
          <mesh ref={(m) => void (coreRefs.current[i] = m)} geometry={coreGeo} material={coreMat} renderOrder={1} />
          <lineSegments geometry={edgesGeo} renderOrder={3}>
            <lineBasicMaterial color={COLORS.ink} transparent opacity={ghost ? 0.2 : 0.55} />
          </lineSegments>
          <mesh ref={(m) => void (faceRefs.current[i] = m)} position={[0, 0, SIZE / 2 + 0.012]} renderOrder={4} visible={!ghost}>
            <planeGeometry args={[SIZE * 0.94, SIZE * 0.94]} />
            <meshBasicMaterial transparent toneMapped={false} depthWrite={false} />
          </mesh>
          {/* link to the next block */}
          <mesh position={[SPACING / 2, 0, 0]} material={barMat}>
            <boxGeometry args={[SPACING - SIZE + 0.05, 0.07, 0.07]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
