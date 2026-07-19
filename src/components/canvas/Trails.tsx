'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface TrailsProps {
  historyA: THREE.Vector3[][];
  historyB: THREE.Vector3[][];
  bodyColors: [string, string, string];
  showA: boolean;
  showB: boolean;
  maxPoints: number;
}

export const Trails: React.FC<TrailsProps> = ({
  historyA,
  historyB,
  bodyColors,
  showA,
  showB,
}) => {
  return (
    <group>
      {/* Universe A Trails (Solid Body Colors) */}
      {showA &&
        historyA.map((points, bodyIdx) => {
          if (points.length < 2) return null;
          const curvePoints = points.map((p) => [p.x, p.y, p.z] as [number, number, number]);
          const color = bodyColors[bodyIdx] || '#00f3ff';
          return (
            <TrailLine
              key={`trail-a-${bodyIdx}`}
              points={curvePoints}
              color={color}
              opacity={0.9}
            />
          );
        })}

      {/* Universe B Trails (Translucent Ghost Body Colors) */}
      {showB &&
        historyB.map((points, bodyIdx) => {
          if (points.length < 2) return null;
          const curvePoints = points.map((p) => [p.x, p.y, p.z] as [number, number, number]);
          const color = bodyColors[bodyIdx] || '#ff007f';
          return (
            <TrailLine
              key={`trail-b-${bodyIdx}`}
              points={curvePoints}
              color={color}
              opacity={0.5}
            />
          );
        })}
    </group>
  );
};

interface TrailLineProps {
  points: [number, number, number][];
  color: string;
  opacity: number;
}

const TrailLine: React.FC<TrailLineProps> = ({ points, color, opacity }) => {
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i][0];
      positions[i * 3 + 1] = points[i][1];
      positions[i * 3 + 2] = points[i][2];
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [points]);

  return (
    <primitive
      object={
        new THREE.Line(
          lineGeometry,
          new THREE.LineBasicMaterial({
            color,
            linewidth: 2,
            transparent: true,
            opacity,
          })
        )
      }
    />
  );
};
