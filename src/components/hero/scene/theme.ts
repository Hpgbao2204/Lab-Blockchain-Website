import { Vector3 } from "three";
import type { Party } from "../protocol";

export const COLORS = {
  bg: "#eef2f9",
  ink: "#0b1437",
  chainA: "#2b6bff",
  chainB: "#ff8a1f",
  relay: "#7b4dff",
  proof: "#0fc7a0",
  glass: "#f3f6ff",
} as const;

export const PARTY_COLOR: Record<Party, string> = { alice: COLORS.chainA, bob: COLORS.chainB };

export const LANE_Y = { alice: 1.5, bob: -1.5 } as const;
export const AVATAR_POS = {
  alice: new Vector3(-3.7, 3.45, 0.4),
  bob: new Vector3(3.7, -3.45, 0.4),
} as const;
export const RELAY_POS = new Vector3(0, 0, 0.3);

/** Live positions (in world-group space) that packets and pulses read each frame. */
export interface Anchors {
  /** block in each party's chain that is currently closest to that party's avatar */
  nearBlock: Record<Party, Vector3>;
}

export function createAnchors(): Anchors {
  return {
    nearBlock: {
      alice: new Vector3(AVATAR_POS.alice.x, LANE_Y.alice, 0),
      bob: new Vector3(AVATAR_POS.bob.x, LANE_Y.bob, 0),
    },
  };
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
