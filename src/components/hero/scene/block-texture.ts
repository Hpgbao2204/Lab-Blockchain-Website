import { CanvasTexture, SRGBColorSpace } from "three";
import { COLORS } from "./theme";

const SIZE = 256;

/** Deterministic fake hash so every height has a stable, plausible-looking digest. */
export function fakeHash(height: number): string {
  let h = (height * 2654435761) >>> 0;
  let out = "";
  for (let i = 0; i < 8; i++) {
    h = (Math.imul(h ^ (h >>> 15), 2246822519) + 3266489917) >>> 0;
    out += (h & 0xf).toString(16);
  }
  return out;
}

export function createBlockTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function drawBlockTexture(texture: CanvasTexture, height: number, accent: string) {
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = accent;
  ctx.font = '600 22px "JetBrains Mono", ui-monospace, monospace';
  ctx.textBaseline = "top";
  ctx.fillText("BLOCK", 22, 22);
  ctx.fillStyle = COLORS.ink;
  ctx.font = '800 46px "Unbounded", system-ui, sans-serif';
  ctx.fillText(`#${height}`, 20, 82);
  ctx.globalAlpha = 0.6;
  ctx.font = '500 21px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(`0x${fakeHash(height)}`, 22, 196);
  ctx.globalAlpha = 1;
  texture.needsUpdate = true;
}
