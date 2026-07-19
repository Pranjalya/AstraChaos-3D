export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BodyData {
  id: number;
  name: string;
  mass: number;
  color: string;
  radius: number;
  pos: Vector3D;
  vel: Vector3D;
}

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  gConst: number;
  softening: number;
  defaultDt: number;
  defaultSubSteps: number;
  masses: [number, number, number];
  posA: [Vector3D, Vector3D, Vector3D];
  velA: [Vector3D, Vector3D, Vector3D];
  bodyColors?: [string, string, string];
}

export type CameraTargetMode = 'free' | 'body0' | 'body1' | 'body2' | 'com';

export interface DivergencePoint {
  time: number;
  divergence: number;
  logDivergence: number;
}
