'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3D } from '@/types/physics';

interface Probe3DProps {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  active: boolean;
  plannedTrajectory: Vector3D[];
  probeHistory: THREE.Vector3[];
}

export const Probe3D: React.FC<Probe3DProps> = ({
  position,
  velocity,
  active,
  plannedTrajectory,
  probeHistory
}) => {
  const probeMeshRef = useRef<THREE.Group>(null);
  const plumeRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (probeMeshRef.current && active) {
      probeMeshRef.current.position.copy(position);

      // Orient probe along velocity vector
      if (velocity.lengthSq() > 1e-6) {
        const target = position.clone().add(velocity);
        probeMeshRef.current.lookAt(target);
      }

      // Pulse thruster plume light
      if (plumeRef.current) {
        const s = 1 + Math.sin(state.clock.getElapsedTime() * 15) * 0.25;
        plumeRef.current.scale.set(s, s, s * 1.5);
      }
    }
  });

  if (!active) return null;

  // Create trajectory curve geometry
  const plannedPoints = plannedTrajectory.map((p) => new THREE.Vector3(p.x, p.y, p.z));

  return (
    <group>
      {/* 3D Probe Satellite Mesh */}
      <group ref={probeMeshRef} position={position}>
        {/* Central Core Satellite Chassis */}
        <mesh castShadow>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color="#00f3ff"
            metalness={0.9}
            roughness={0.1}
            emissive="#0077aa"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Solar Panels (Left & Right Wings) */}
        <mesh position={[-0.4, 0, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.18]} />
          <meshStandardMaterial color="#0055ff" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.4, 0, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.18]} />
          <meshStandardMaterial color="#0055ff" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* High Gain Communication Antenna Dish */}
        <mesh position={[0, 0.22, 0]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.02, 0.06, 16]} />
          <meshStandardMaterial color="#ffffff" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Ion Thruster Plume Effect */}
        <mesh ref={plumeRef} position={[0, 0, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.08, 0.25, 12]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.85} />
        </mesh>

        {/* Point Light Glow */}
        <pointLight color="#00f3ff" intensity={1.5} distance={1.2} />
      </group>

      {/* Planned RL Trajectory Overlay Line */}
      {plannedPoints.length > 1 && (
        <line>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(plannedPoints.flatMap((p) => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineDashedMaterial
            color="#00ffaa"
            dashSize={0.2}
            gapSize={0.1}
            linewidth={2}
            transparent
            opacity={0.75}
          />
        </line>
      )}

      {/* Real-time Probe Flight Trail */}
      {probeHistory.length > 1 && (
        <line>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(probeHistory.flatMap((p) => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00f3ff" linewidth={2.5} transparent opacity={0.9} />
        </line>
      )}
    </group>
  );
};
