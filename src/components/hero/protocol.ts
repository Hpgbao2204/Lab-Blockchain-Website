/**
 * The cross-chain story told by the hero: Alice and Bob live on different chains
 * and a relay carries proofs between them (HTLC-style lock -> proof -> verify ->
 * claim -> ack). The 3D scene and the DOM event log derive their state from the
 * same wall-clock function so they stay in sync without sharing React state.
 */

export type Party = "alice" | "bob";
export type StepKind = "lock" | "proof" | "verify" | "claim" | "ack";

export const STEP_MS = 1900;
export const STEP_KINDS: StepKind[] = ["lock", "proof", "verify", "claim", "ack"];
export const DIRECTION_MS = STEP_MS * STEP_KINDS.length;
export const CYCLE_MS = DIRECTION_MS * 2;

export interface Phase {
  /** 0 = Alice -> Bob, 1 = Bob -> Alice */
  direction: 0 | 1;
  sender: Party;
  receiver: Party;
  step: number;
  kind: StepKind;
  /** progress through the current step, 0..1 */
  progress: number;
  /** monotonically increasing step counter, handy as a React key / change detector */
  seq: number;
}

export function getPhase(ms: number): Phase {
  const t = ((ms % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
  const direction = t < DIRECTION_MS ? 0 : 1;
  const local = t - direction * DIRECTION_MS;
  const step = Math.min(STEP_KINDS.length - 1, Math.floor(local / STEP_MS));
  const progress = (local - step * STEP_MS) / STEP_MS;
  return {
    direction,
    sender: direction === 0 ? "alice" : "bob",
    receiver: direction === 0 ? "bob" : "alice",
    step,
    kind: STEP_KINDS[step],
    progress,
    seq: Math.floor(ms / STEP_MS),
  };
}

const name = (p: Party) => (p === "alice" ? "Alice" : "Bob");
const chain = (p: Party) => (p === "alice" ? "Chain A" : "Chain B");

export function describeStep(kind: StepKind, sender: Party, receiver: Party): { tag: string; text: string } {
  switch (kind) {
    case "lock":
      return { tag: "lock", text: `${name(sender)} khoá 1.0 ◆ trên ${chain(sender)} · H(s)` };
    case "proof":
      return { tag: "proof", text: `${chain(sender)} → Relay · Merkle proof π` };
    case "verify":
      return { tag: "verify", text: `Relay xác minh π ✓ → gửi sang ${chain(receiver)}` };
    case "claim":
      return { tag: "claim", text: `${name(receiver)} nhận 1.0 ◆ trên ${chain(receiver)} · lộ s` };
    case "ack":
      return { tag: "ack", text: `ack(s) → ${chain(sender)} · ${name(sender)} được giải phóng` };
  }
}
