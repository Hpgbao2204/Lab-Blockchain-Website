"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { CanvasTexture, Color, Mesh, ShaderMaterial, SRGBColorSpace, Texture, Vector2, type Group } from "three";
import { pioneers, type Pioneer } from "@/data/pioneers";
import { COLORS, clamp01 } from "./theme";

const TINTS: Record<Pioneer["tint"], string> = { blue: COLORS.chainA, violet: COLORS.relay, amber: COLORS.chainB };

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Duotone portrait: luminance maps between a dark ink-tinted colour and pale paper.
// `uFocus` blends back toward the real photo for the spotlighted portrait.
const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uImgAspect;
  uniform float uPlaneAspect;
  uniform vec3 uDark;
  uniform vec3 uLight;
  uniform float uOpacity;
  uniform float uFocus;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    float ar = uImgAspect / uPlaneAspect;
    if (ar > 1.0) uv.x = (uv.x - 0.5) / ar + 0.5;
    else uv.y = (uv.y - 0.5) * ar + 0.5 + 0.10 * (1.0 - ar);
    vec3 rgb = texture2D(uMap, uv).rgb;
    float lum = dot(rgb, vec3(0.299, 0.587, 0.114));
    lum = smoothstep(0.04, 0.96, lum);
    vec3 duo = mix(uDark, uLight, lum);
    vec3 col = mix(duo, rgb, uFocus * 0.85);
    float e = smoothstep(0.0, 0.10, vUv.x) * smoothstep(0.0, 0.10, 1.0 - vUv.x)
            * smoothstep(0.0, 0.07, vUv.y) * smoothstep(0.0, 0.07, 1.0 - vUv.y);
    gl_FragColor = vec4(col, uOpacity * e);
    #include <colorspace_fragment>
  }
`;

function makeSilhouette(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 420;
  c.height = 540;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#c9d6ff");
  grad.addColorStop(1, "#5e78d6");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#0b1437";
  g.beginPath();
  g.arc(210, 210, 92, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(210, 560, 190, 210, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#eef2f9";
  g.font = '700 120px "Bricolage Grotesque Variable", system-ui, sans-serif';
  g.textAlign = "center";
  g.fillText("?", 210, 252);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

interface Layout {
  x: number;
  y: number;
  z: number;
  h: number;
  rot: number;
}

const WRAP = 19;
function layout(i: number, n: number): Layout {
  const x = -WRAP + (i * 2 * WRAP) / n;
  return {
    x,
    y: Math.sin(i * 1.9) * 3.4 + (i % 2 === 0 ? 0.7 : -0.7),
    z: -8.5 - (i % 3) * 2.6,
    h: 4.6 + (i % 3) * 0.7,
    rot: Math.sin(i * 2.3) * 0.06,
  };
}

interface PortraitWallProps {
  pointer: React.RefObject<Vector2>;
  frozen: boolean;
  onSpotlight: (id: string) => void;
}

export function PortraitWall({ pointer, frozen, onSpotlight }: PortraitWallProps) {
  const items = useMemo(() => pioneers, []);
  const urls = useMemo(() => items.filter((p) => p.image).map((p) => p.image as string), [items]);
  const loaded = useTexture(urls, (t) => {
    // Custom shader uniforms are not colour-managed automatically by R3F.
    (Array.isArray(t) ? t : [t]).forEach((x) => (x.colorSpace = SRGBColorSpace));
  });
  const textures = useMemo(() => (Array.isArray(loaded) ? loaded : [loaded]) as Texture[], [loaded]);

  const silhouette = useMemo(() => makeSilhouette(), []);
  useEffect(() => () => silhouette.dispose(), [silhouette]);

  const entries = useMemo(() => {
    let photoIndex = 0;
    return items.map((p, i) => {
      const tex = p.image ? textures[photoIndex++] : silhouette;
      const img = tex.image as { width: number; height: number };
      const l = layout(i, items.length);
      const planeAspect = 0.78;
      const tint = new Color(TINTS[p.tint]);
      const mat = new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: tex },
          uImgAspect: { value: img.width / img.height },
          uPlaneAspect: { value: planeAspect },
          uDark: { value: new Color(COLORS.ink).lerp(tint, 0.42) },
          uLight: { value: new Color("#f3f6ff").lerp(tint, 0.1) },
          uOpacity: { value: 0.6 },
          uFocus: { value: 0 },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
      });
      return { p, l, mat, planeAspect };
    });
  }, [items, textures, silhouette]);

  useEffect(() => () => entries.forEach((e) => e.mat.dispose()), [entries]);

  const meshes = useRef<(Mesh | null)[]>([]);
  const wall = useRef<Group>(null);
  const spot = useRef({ index: -1, since: -10 });

  useFrame((state) => {
    const t = frozen ? 0 : state.clock.elapsedTime;

    // pick the next portrait that is currently on screen
    if (!frozen && t - spot.current.since > 4.2) {
      for (let tries = 1; tries <= entries.length; tries++) {
        const idx = (spot.current.index + tries) % entries.length;
        const m = meshes.current[idx];
        if (m && Math.abs(m.position.x) < 9 && entries[idx].l.z > -12) {
          spot.current = { index: idx, since: t };
          onSpotlight(entries[idx].p.id);
          break;
        }
      }
    }

    const px = pointer.current?.x ?? 0;
    const py = pointer.current?.y ?? 0;
    if (wall.current) {
      wall.current.position.x += (px * -0.6 - wall.current.position.x) * 0.05;
      wall.current.position.y += (py * -0.35 - wall.current.position.y) * 0.05;
    }

    entries.forEach((e, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const depth = -e.l.z; // farther = slower drift
      const drift = t * (frozen ? 0 : 2.6 / depth);
      let x = e.l.x - drift;
      x = ((((x + WRAP) % (2 * WRAP)) + 2 * WRAP) % (2 * WRAP)) - WRAP;
      const focus = spot.current.index === i ? clamp01((t - spot.current.since) / 0.8) : 0;
      const prev = e.mat.uniforms.uFocus.value as number;
      e.mat.uniforms.uFocus.value = prev + (focus - prev) * 0.08;
      const fade = 1 - clamp01((depth - 8.5) / 9) * 0.45;
      e.mat.uniforms.uOpacity.value = (0.5 + 0.35 * (e.mat.uniforms.uFocus.value as number)) * fade;
      m.position.set(x + px * (depth * -0.035), e.l.y + Math.sin(t * 0.5 + i) * 0.14 + py * (depth * -0.02), e.l.z + (e.mat.uniforms.uFocus.value as number) * 1.6);
      m.rotation.z = e.l.rot;
    });
  });

  return (
    <group ref={wall}>
      {entries.map((e, i) => (
        <mesh key={e.p.id} ref={(m) => void (meshes.current[i] = m)} material={e.mat} renderOrder={-1}>
          <planeGeometry args={[e.l.h * e.planeAspect, e.l.h]} />
        </mesh>
      ))}
    </group>
  );
}
