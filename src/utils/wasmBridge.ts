export interface PhysicsSolver {
  isWasm: boolean;
  step(dt: number, subSteps: number): void;
  getPositionsA(): Float32Array;
  getPositionsB(): Float32Array;
  getVelocitiesA(): Float32Array;
  getDivergence(bodyIdx: number): number;
  getMaxDivergence(): number;
  getElapsedTime(): number;
  setMasses(masses: number[]): void;
  reset(masses: number[], posA: number[], velA: number[], perturbation: number): void;
}

class TSRK4PhysicsEngine implements PhysicsSolver {
  isWasm = false;
  private masses: number[];
  private posA: Float64Array;
  private velA: Float64Array;
  private posB: Float64Array;
  private velB: Float64Array;
  private gConst: number;
  private softeningSq: number;
  private elapsedTime: number = 0;

  constructor(
    masses: number[],
    posA: number[],
    velA: number[],
    perturbation: number,
    gConst: number,
    softening: number
  ) {
    this.masses = [...masses];
    this.posA = new Float64Array(9);
    this.velA = new Float64Array(9);
    this.posB = new Float64Array(9);
    this.velB = new Float64Array(9);
    this.gConst = gConst;
    this.softeningSq = softening * softening;

    for (let i = 0; i < 9; i++) {
      this.posA[i] = posA[i] || 0;
      this.velA[i] = velA[i] || 0;
      this.posB[i] = posA[i] || 0;
      this.velB[i] = velA[i] || 0;
    }
    // Apply initial microscopic perturbation to Body 0's x coordinate in Universe B
    this.posB[0] += perturbation;
  }

  setMasses(masses: number[]): void {
    this.masses = [...masses];
  }

  private computeAccelerations(pos: Float64Array, outAcc: Float64Array) {
    outAcc.fill(0);
    for (let i = 0; i < 3; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      for (let j = 0; j < 3; j++) {
        if (i === j) continue;
        const jx = j * 3, jy = j * 3 + 1, jz = j * 3 + 2;
        const dx = pos[jx] - pos[ix];
        const dy = pos[jy] - pos[iy];
        const dz = pos[jz] - pos[iz];
        const distSq = dx * dx + dy * dy + dz * dz + this.softeningSq;
        const distCube = distSq * Math.sqrt(distSq);
        if (distCube > 1e-12) {
          const factor = (this.gConst * this.masses[j]) / distCube;
          outAcc[ix] += dx * factor;
          outAcc[iy] += dy * factor;
          outAcc[iz] += dz * factor;
        }
      }
    }
  }

  private rk4StepState(pos: Float64Array, vel: Float64Array, dt: number) {
    const k1Pos = new Float64Array(9);
    const k1Vel = new Float64Array(9);
    const k2Pos = new Float64Array(9);
    const k2Vel = new Float64Array(9);
    const k3Pos = new Float64Array(9);
    const k3Vel = new Float64Array(9);
    const k4Pos = new Float64Array(9);
    const k4Vel = new Float64Array(9);

    const tempPos = new Float64Array(9);
    const tempVel = new Float64Array(9);
    const acc = new Float64Array(9);

    // k1
    this.computeAccelerations(pos, acc);
    for (let i = 0; i < 9; i++) {
      k1Pos[i] = vel[i];
      k1Vel[i] = acc[i];
      tempPos[i] = pos[i] + k1Pos[i] * dt * 0.5;
      tempVel[i] = vel[i] + k1Vel[i] * dt * 0.5;
    }

    // k2
    this.computeAccelerations(tempPos, acc);
    for (let i = 0; i < 9; i++) {
      k2Pos[i] = tempVel[i];
      k2Vel[i] = acc[i];
      tempPos[i] = pos[i] + k2Pos[i] * dt * 0.5;
      tempVel[i] = vel[i] + k2Vel[i] * dt * 0.5;
    }

    // k3
    this.computeAccelerations(tempPos, acc);
    for (let i = 0; i < 9; i++) {
      k3Pos[i] = tempVel[i];
      k3Vel[i] = acc[i];
      tempPos[i] = pos[i] + k3Pos[i] * dt;
      tempVel[i] = vel[i] + k3Vel[i] * dt;
    }

    // k4
    this.computeAccelerations(tempPos, acc);
    for (let i = 0; i < 9; i++) {
      k4Pos[i] = tempVel[i];
      k4Vel[i] = acc[i];
    }

    // Combine
    for (let i = 0; i < 9; i++) {
      pos[i] += (dt / 6) * (k1Pos[i] + 2 * k2Pos[i] + 2 * k3Pos[i] + k4Pos[i]);
      vel[i] += (dt / 6) * (k1Vel[i] + 2 * k2Vel[i] + 2 * k3Vel[i] + k4Vel[i]);
    }
  }

  step(dt: number, subSteps: number) {
    const subDt = dt / subSteps;
    for (let s = 0; s < subSteps; s++) {
      this.rk4StepState(this.posA, this.velA, subDt);
      this.rk4StepState(this.posB, this.velB, subDt);
    }
    this.elapsedTime += dt;
  }

  getPositionsA(): Float32Array {
    return new Float32Array(this.posA);
  }

  getPositionsB(): Float32Array {
    return new Float32Array(this.posB);
  }

  getVelocitiesA(): Float32Array {
    return new Float32Array(this.velA);
  }

  getDivergence(bodyIdx: number): number {
    const i = bodyIdx * 3;
    const dx = this.posA[i] - this.posB[i];
    const dy = this.posA[i + 1] - this.posB[i + 1];
    const dz = this.posA[i + 2] - this.posB[i + 2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  getMaxDivergence(): number {
    let max = 0;
    for (let b = 0; b < 3; b++) {
      const d = this.getDivergence(b);
      if (d > max) max = d;
    }
    return max;
  }

  getElapsedTime(): number {
    return this.elapsedTime;
  }

  reset(masses: number[], posA: number[], velA: number[], perturbation: number) {
    this.masses = [...masses];
    for (let i = 0; i < 9; i++) {
      this.posA[i] = posA[i] || 0;
      this.velA[i] = velA[i] || 0;
      this.posB[i] = posA[i] || 0;
      this.velB[i] = velA[i] || 0;
    }
    this.posB[0] += perturbation;
    this.elapsedTime = 0;
  }
}

class WasmPhysicsWrapper implements PhysicsSolver {
  isWasm = true;
  private engine: any;

  constructor(engine: any) {
    this.engine = engine;
  }

  step(dt: number, subSteps: number): void {
    this.engine.step(dt, subSteps);
  }

  getPositionsA(): Float32Array {
    return new Float32Array(this.engine.get_positions_a());
  }

  getPositionsB(): Float32Array {
    return new Float32Array(this.engine.get_positions_b());
  }

  getVelocitiesA(): Float32Array {
    return new Float32Array(this.engine.get_velocities_a());
  }

  getDivergence(bodyIdx: number): number {
    return this.engine.get_divergence(bodyIdx);
  }

  getMaxDivergence(): number {
    return this.engine.get_max_divergence();
  }

  getElapsedTime(): number {
    return this.engine.get_elapsed_time();
  }

  setMasses(masses: number[]): void {
    if (this.engine.set_masses) {
      this.engine.set_masses(new Float64Array(masses));
    }
  }

  reset(masses: number[], posA: number[], velA: number[], perturbation: number): void {
    this.engine.reset(masses, posA, velA, perturbation);
  }
}

export async function createPhysicsEngine(
  masses: number[],
  posA: number[],
  velA: number[],
  perturbation: number,
  gConst: number,
  softening: number
): Promise<PhysicsSolver> {
  try {
    if (typeof window !== 'undefined') {
      const wasmModule = await import(/* webpackIgnore: true */ '/wasm/wasm_physics.js');
      await wasmModule.default('/wasm/wasm_physics_bg.wasm');
      const engine = new wasmModule.PhysicsEngine(
        new Float64Array(masses),
        new Float64Array(posA),
        new Float64Array(velA),
        perturbation,
        gConst,
        softening
      );
      console.log('✅ Loaded WASM Physics Engine');
      return new WasmPhysicsWrapper(engine);
    }
  } catch (err) {
    console.warn('WASM initialization skipped/failed, using fallback TS RK4 solver:', err);
  }

  console.log('⚡ Running TypeScript RK4 Physics Engine');
  return new TSRK4PhysicsEngine(masses, posA, velA, perturbation, gConst, softening);
}
