"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace } from "three";
import { COLORS } from "./theme";

interface LabelProps {
  text: string;
  dot: string;
  position: [number, number, number];
}

const H = 64;
const DPR = 2;


function paintLabel(texture: CanvasTexture, text: string, dot: string) {
  const canvas = texture.image as HTMLCanvasElement;
  const g = canvas.getContext("2d");
  if (!g) return;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width / DPR;
  g.shadowColor = "rgba(11,20,55,0.28)";
  g.shadowBlur = 10;
  g.shadowOffsetY = 4;
  g.fillStyle = "rgba(255,255,255,0.94)";
  g.beginPath();
  g.roundRect(6, 6, w - 12, H - 16, (H - 16) / 2);
  g.fill();
  g.shadowColor = "transparent";
  g.fillStyle = dot;
  g.beginPath();
  g.arc(30, H / 2 - 2, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = COLORS.ink;
  g.font = '600 26px "JetBrains Mono", ui-monospace, monospace';
  g.textBaseline = "middle";
  g.fillText(text, 48, H / 2 - 1);
  texture.needsUpdate = true;
}

/** A pill-shaped billboard label drawn on a canvas (keeps the scene free of DOM overlays). */
export function Label({ text, dot, position }: LabelProps) {
  const invalidate = useThree((s) => s.invalidate);
  const { texture, aspect } = useMemo(() => {
    const canvas = document.createElement("canvas");
    // Monospace: width is predictable (0.6em per glyph at 26px), independent of font load timing.
    const w = Math.ceil(text.length * 15.8) + 80;
    canvas.width = w * DPR;
    canvas.height = H * DPR;
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    return { texture: tex, aspect: w / H };
  }, [text]);

  useEffect(() => {
    const draw = () => {
      paintLabel(texture, text, dot);
      invalidate();
    };
    draw();
    void document.fonts?.ready.then(draw);
    return () => texture.dispose();
  }, [texture, text, dot, invalidate]);

  const height = 0.46;
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={10}>
      <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}
