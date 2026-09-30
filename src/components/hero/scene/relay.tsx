"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { getPhase } from "../protocol";
import { COLORS, RELAY_POS, LANE_Y } from "./theme";
import { Label } from "./label";

/** The relay between the two chains: spins up while it verifies a proof. */
export function Relay({ frozen }: { frozen: boolean }) {
  const root = useRef<Group>(null);
  const ringA = useRef<Mesh>(null);
  const ringB = useRef<Mesh>(null);
  const core = useRef<Mesh>(null);
  const speed = useRef(1);

  useFrame((state, dt) => {
    const t = frozen ? 2 : state.clock.elapsedTime;
    const phase = getPhase(frozen ? 4200 : Date.now());
    const busy = phase.kind === "verify" || (phase.kind === "proof" && phase.progress > 0.7);
    speed.current += ((busy ? 4 : 1) - speed.current) * Math.min(1, dt * 3);
    const a = t * speed.current;
    if (ringA.current) ringA.current.rotation.set(a * 0.8, a * 0.5, 0);
    if (ringB.current) ringB.current.rotation.set(Math.PI / 2 + a * 0.4, -a * 0.7, 0);
    if (core.current) {
      core.current.rotation.set(a * 0.6, a, 0);
      (core.current.material as MeshStandardMaterial).emissiveIntensity = busy ? 2.2 : 0.9;
    }
    if (root.current) root.current.position.y = RELAY_POS.y + Math.sin(t * 1.1) * 0.08;
  });

  return (
    <group ref={root} position={RELAY_POS.toArray()}>
      <mesh ref={core}>
        <octahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial color={COLORS.relay} emissive={COLORS.relay} emissiveIntensity={0.9} roughness={0.25} />
      </mesh>
      <mesh ref={ringA}>
        <torusGeometry args={[0.66, 0.025, 10, 72]} />
        <meshStandardMaterial color={COLORS.relay} emissive={COLORS.relay} emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={ringB}>
        <torusGeometry args={[0.85, 0.018, 10, 72]} />
        <meshStandardMaterial color={COLORS.ink} roughness={0.4} />
      </mesh>
      {/* vertical guide connecting the two lanes */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[0.03, Math.abs(LANE_Y.alice - LANE_Y.bob) - 1.3, 0.03]} />
        <meshBasicMaterial color={COLORS.relay} transparent opacity={0.28} />
      </mesh>
      <Label text="Relay" dot={COLORS.relay} position={[0, -1.2, 0]} />
    </group>
  );
}
