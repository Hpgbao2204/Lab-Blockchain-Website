"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import type { Party } from "../protocol";
import { getPhase } from "../protocol";
import { AVATAR_POS, COLORS, PARTY_COLOR } from "./theme";
import { Label } from "./label";

interface AvatarProps {
  party: Party;
  label: string;
  frozen: boolean;
}

/** Alice / Bob: a small capsule character that glows while it is sending or receiving. */
export function Avatar({ party, label, frozen }: AvatarProps) {
  const color = PARTY_COLOR[party];
  const root = useRef<Group>(null);
  const halo = useRef<Mesh>(null);
  const body = useRef<Mesh>(null);
  const base = AVATAR_POS[party];

  useFrame((state) => {
    const t = frozen ? 3 : state.clock.elapsedTime;
    const phase = getPhase(frozen ? 4200 : Date.now());
    const involved =
      (phase.kind === "lock" && phase.sender === party) ||
      (phase.kind === "claim" && phase.receiver === party) ||
      (phase.kind === "ack" && phase.progress > 0.6 && phase.sender === party);
    if (root.current) {
      root.current.position.set(base.x, base.y + Math.sin(t * 1.4 + (party === "bob" ? 2 : 0)) * 0.09, base.z);
      root.current.rotation.y = Math.sin(t * 0.7) * 0.25 + (party === "alice" ? 0.35 : -0.35);
    }
    if (halo.current) {
      const target = involved ? 1 : 0.35;
      const s = halo.current.scale.x + (target * 1.25 - halo.current.scale.x) * 0.08;
      halo.current.scale.setScalar(Math.max(s, 0.4));
      halo.current.rotation.z = t * (involved ? 2.2 : 0.6);
      (halo.current.material as MeshStandardMaterial).emissiveIntensity = involved ? 1.6 : 0.5;
    }
    if (body.current) (body.current.material as MeshStandardMaterial).emissiveIntensity = involved ? 0.35 : 0.05;
  });

  return (
    <group ref={root} position={base.toArray()} scale={1.3}>
      {/* body */}
      <mesh ref={body} position={[0, -0.25, 0]}>
        <capsuleGeometry args={[0.34, 0.5, 8, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.05} roughness={0.45} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.3, 28, 28]} />
        <meshStandardMaterial color="#fdfbff" roughness={0.4} />
      </mesh>
      {/* eyes */}
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.54, 0.26]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color={COLORS.ink} />
        </mesh>
      ))}
      {/* halo ring */}
      <mesh ref={halo} position={[0, 0.5, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[0.48, 0.022, 10, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* pedestal */}
      <mesh position={[0, -0.92, 0]}>
        <cylinderGeometry args={[0.5, 0.56, 0.08, 40]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <Label text={label} dot={color} position={[0, party === "alice" ? 1.3 : -1.55, 0]} />
    </group>
  );
}
