'use client';

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { CameraTargetMode } from '@/types/physics';

interface CameraControllerProps {
  mode: CameraTargetMode;
  posA: Float32Array;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

export const CameraController: React.FC<CameraControllerProps> = ({ mode, posA, controlsRef }) => {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!controlsRef.current || mode === 'free') return;

    const targetPos = new THREE.Vector3();

    if (mode === 'body0') {
      targetPos.set(posA[0], posA[1], posA[2]);
    } else if (mode === 'body1') {
      targetPos.set(posA[3], posA[4], posA[5]);
    } else if (mode === 'body2') {
      targetPos.set(posA[6], posA[7], posA[8]);
    } else if (mode === 'com') {
      targetPos.set(
        (posA[0] + posA[3] + posA[6]) / 3,
        (posA[1] + posA[4] + posA[7]) / 3,
        (posA[2] + posA[5] + posA[8]) / 3
      );
    }

    // Smooth lerp to target
    const lerpFactor = Math.min(1.0, delta * 5.0);
    currentTarget.current.lerp(targetPos, lerpFactor);

    // Shift camera along with target movement
    const diff = targetPos.clone().sub(controlsRef.current.target);
    camera.position.add(diff.multiplyScalar(lerpFactor));
    controlsRef.current.target.copy(currentTarget.current);
    controlsRef.current.update();
  });

  return null;
};
