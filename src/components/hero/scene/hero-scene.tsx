"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { Vector2, type Group } from "three";
import { Avatar } from "./avatar";
import { ChainLane } from "./chain-lane";
import { Packet } from "./packet";
import { PortraitWall } from "./portrait-wall";
import { Relay } from "./relay";
import { COLORS, createAnchors } from "./theme";

interface HeroSceneProps {
  frozen: boolean;
  active: boolean;
  onSpotlight: (id: string) => void;
  onReady: () => void;
}

function World({ frozen, pointer }: { frozen: boolean; pointer: React.RefObject<Vector2> }) {
  const group = useRef<Group>(null);
  const anchors = useMemo(() => createAnchors(), []);
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;

  // Desktop: chains sit in the right-hand two thirds. Narrow screens: scaled down under the headline.
  const wide = aspect >= 1.35;
  const scale = wide ? Math.min(0.78, 0.5 + aspect * 0.1) : Math.min(0.85, Math.max(0.4, aspect * 0.95));
  const basePos: [number, number, number] = wide ? [3.7, -0.5, 0] : [0.3, -2.3, 0];

  useFrame(() => {
    if (!group.current) return;
    const g = group.current;
    g.rotation.y += ((-0.3 + pointer.current.x * 0.12) - g.rotation.y) * 0.05;
    g.rotation.x += ((0.06 - pointer.current.y * 0.06) - g.rotation.x) * 0.05;
  });

  return (
    <group ref={group} position={basePos} scale={scale} rotation={[0.06, -0.3, 0]}>
      <ChainLane party="alice" blockTime={7.4} baseHeight={4410} anchors={anchors} frozen={frozen} ghost={{ y: 5.4, z: -9, scale: 1.25 }} />
      <ChainLane party="bob" blockTime={9.1} baseHeight={770} anchors={anchors} frozen={frozen} ghost={{ y: -5.6, z: -9, scale: 1.25 }} />
      <Sparkles count={frozen ? 0 : 70} scale={[18, 10, 7]} size={3.2} speed={0.25} opacity={0.55} color={COLORS.chainA} />
      <ChainLane party="alice" blockTime={4.2} baseHeight={18420} anchors={anchors} frozen={frozen} />
      <ChainLane party="bob" blockTime={6.3} baseHeight={9730} anchors={anchors} frozen={frozen} />
      <Relay frozen={frozen} />
      <Avatar party="alice" label="Alice · Chain A" frozen={frozen} />
      <Avatar party="bob" label="Bob · Chain B" frozen={frozen} />
      <Packet anchors={anchors} frozen={frozen} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 8, 7]} intensity={1.5} />
      <directionalLight position={[-6, -3, 4]} intensity={0.5} color="#b9c8ff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 6]} scale={[14, 4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[-8, 1, 3]} scale={[4, 8, 1]} color="#cfdcff" />
        <Lightformer form="rect" intensity={1.0} position={[8, -1, 3]} scale={[4, 8, 1]} color="#ffe2c4" />
        <Lightformer form="ring" intensity={1.2} position={[0, -6, 4]} scale={8} color="#ffffff" />
      </Environment>
    </>
  );
}

export default function HeroScene({ frozen, active, onSpotlight, onReady }: HeroSceneProps) {
  const pointer = useRef(new Vector2(0, 0));

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.4, 14.5], fov: 38, near: 0.1, far: 80 }}
      frameloop={frozen ? "demand" : active ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(COLORS.bg, 1);
        requestAnimationFrame(onReady);
      }}
      aria-hidden
    >
      <Lights />
      <Suspense fallback={null}>
        <PortraitWall pointer={pointer} frozen={frozen} onSpotlight={onSpotlight} />
      </Suspense>
      <World frozen={frozen} pointer={pointer} />
    </Canvas>
  );
}
