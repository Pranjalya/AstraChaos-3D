'use client';

import React from 'react';

interface BodiesProps {
  posA: Float32Array;
  posB: Float32Array;
  masses: number[];
  bodyColors: [string, string, string];
  sizeScale: number;
  showA: boolean;
  showB: boolean;
}

export const Bodies: React.FC<BodiesProps> = ({
  posA,
  posB,
  masses,
  bodyColors,
  sizeScale,
  showA,
  showB,
}) => {
  return (
    <group>
      {/* Universe A (Control - Solid Glowing Bodies) */}
      {showA &&
        [0, 1, 2].map((idx) => {
          const x = posA[idx * 3];
          const y = posA[idx * 3 + 1];
          const z = posA[idx * 3 + 2];
          const mass = masses[idx] || 1.0;
          const radius = Math.max(0.08, Math.min(1.2, Math.cbrt(mass) * 0.18 * sizeScale));
          const color = bodyColors[idx] || '#00f3ff';

          return (
            <group key={`body-a-${idx}`} position={[x, y, z]}>
              {/* Inner Core */}
              <mesh>
                <sphereGeometry args={[radius, 32, 32]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={1.3}
                  roughness={0.1}
                  metalness={0.8}
                />
              </mesh>
              {/* Outer Glow Aura */}
              <mesh scale={1.35}>
                <sphereGeometry args={[radius, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} wireframe />
              </mesh>
              <pointLight color={color} intensity={2} distance={4} />
            </group>
          );
        })}

      {/* Universe B (Perturbed - Ghost Wireframe Haloed Bodies) */}
      {showB &&
        [0, 1, 2].map((idx) => {
          const x = posB[idx * 3];
          const y = posB[idx * 3 + 1];
          const z = posB[idx * 3 + 2];
          const mass = masses[idx] || 1.0;
          const radius = Math.max(0.08, Math.min(1.2, Math.cbrt(mass) * 0.18 * sizeScale));
          const color = bodyColors[idx] || '#ff007f';

          return (
            <group key={`body-b-${idx}`} position={[x, y, z]}>
              {/* Inner Sphere */}
              <mesh>
                <sphereGeometry args={[radius * 0.95, 32, 32]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={0.9}
                  roughness={0.3}
                  metalness={0.5}
                  wireframe
                />
              </mesh>
              {/* Universe B Ghost Double Halo */}
              <mesh scale={1.5}>
                <sphereGeometry args={[radius, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.4} />
              </mesh>
              <pointLight color={color} intensity={1.5} distance={3.5} />
            </group>
          );
        })}
    </group>
  );
};
