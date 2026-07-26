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
  setProbe?(pos: number[], vel: number[], active: boolean): void;
  applyProbeImpulse?(dvX: number, dvY: number, dvZ: number): void;
  getProbePosition?(): Float32Array;
  getProbeVelocity?(): Float32Array;
  isProbeActive?(): boolean;
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

  // Probe (4th body state)
  private probePos: Float64Array = new Float64Array(3);
  private probeVel: Float64Array = new Float64Array(3);
  private probeActive: boolean = false;

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

  setProbe(pos: number[], vel: number[], active: boolean): void {
    this.probePos[0] = pos[0] || 0;
    this.probePos[1] = pos[1] || 0;
    this.probePos[2] = pos[2] || 0;
    this.probeVel[0] = vel[0] || 0;
    this.probeVel[1] = vel[1] || 0;
    this.probeVel[2] = vel[2] || 0;
    this.probeActive = active;
  }

  applyProbeImpulse(dvX: number, dvY: number, dvZ: number): void {
    if (this.probeActive) {
      this.probeVel[0] += dvX;
      this.probeVel[1] += dvY;
      this.probeVel[2] += dvZ;
    }
  }

  getProbePosition(): Float32Array {
    return new Float32Array(this.probePos);
  }

  getProbeVelocity(): Float32Array {
    return new Float32Array(this.probeVel);
  }

  isProbeActive(): boolean {
    return this.probeActive;
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

  private computeProbeAcceleration(bodiesPos: Float64Array, pPos: Float64Array, outAcc: Float64Array) {
    outAcc.fill(0);
    if (!this.probeActive) return;
    for (let j = 0; j < 3; j++) {
      const jx = j * 3, jy = j * 3 + 1, jz = j * 3 + 2;
      const dx = bodiesPos[jx] - pPos[0];
      const dy = bodiesPos[jy] - pPos[1];
      const dz = bodiesPos[jz] - pPos[2];
      const distSq = dx * dx + dy * dy + dz * dz + this.softeningSq;
      const distCube = distSq * Math.sqrt(distSq);
      if (distCube > 1e-12) {
        const factor = (this.gConst * this.masses[j]) / distCube;
        outAcc[0] += dx * factor;
        outAcc[1] += dy * factor;
        outAcc[2] += dz * factor;
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

  private rk4StepProbe(bodiesPos: Float64Array, dt: number) {
    if (!this.probeActive) return;
    const pAcc = new Float64Array(3);

    // Simple RK2/Euler step for zero-mass probe for efficiency
    this.computeProbeAcceleration(bodiesPos, this.probePos, pAcc);
    this.probeVel[0] += pAcc[0] * dt;
    this.probeVel[1] += pAcc[1] * dt;
    this.probeVel[2] += pAcc[2] * dt;

    this.probePos[0] += this.probeVel[0] * dt;
    this.probePos[1] += this.probeVel[1] * dt;
    this.probePos[2] += this.probeVel[2] * dt;
  }

  step(dt: number, subSteps: number) {
    const subDt = dt / subSteps;
    for (let s = 0; s < subSteps; s++) {
      this.rk4StepState(this.posA, this.velA, subDt);
      this.rk4StepState(this.posB, this.velB, subDt);
      this.rk4StepProbe(this.posA, subDt);
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

  setProbe(pos: number[], vel: number[], active: boolean): void {
    if (this.engine.set_probe) {
      this.engine.set_probe(new Float64Array(pos), new Float64Array(vel), active);
    }
  }

  applyProbeImpulse(dvX: number, dvY: number, dvZ: number): void {
    if (this.engine.apply_probe_impulse) {
      this.engine.apply_probe_impulse(dvX, dvY, dvZ);
    }
  }

  getProbePosition(): Float32Array {
    if (this.engine.get_probe_position) {
      return new Float32Array(this.engine.get_probe_position());
    }
    return new Float32Array(3);
  }

  getProbeVelocity(): Float32Array {
    if (this.engine.get_probe_velocity) {
      return new Float32Array(this.engine.get_probe_velocity());
    }
    return new Float32Array(3);
  }

  isProbeActive(): boolean {
    if (this.engine.is_probe_active) {
      return this.engine.is_probe_active();
    }
    return false;
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
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/AstraChaos-3D' : '');
      const wasmJsUrl = `${basePath}/wasm/wasm_physics.js`;
      const wasmBgUrl = `${basePath}/wasm/wasm_physics_bg.wasm`;

      const wasmModule = await import(/* webpackIgnore: true */ wasmJsUrl);
      await wasmModule.default(wasmBgUrl);
      const engine = new wasmModule.PhysicsEngine(
        new Float64Array(masses),
        new Float64Array(posA),
        new Float64Array(velA),
        perturbation,
        gConst,
        softening
      );
      console.log('✅ Loaded WASM Physics Engine from', wasmBgUrl);
      return new WasmPhysicsWrapper(engine);
    }
  } catch (err) {
    console.warn('WASM initialization skipped/failed, using fallback TS RK4 solver:', err);
  }

  console.log('⚡ Running TypeScript RK4 Physics Engine');
  return new TSRK4PhysicsEngine(masses, posA, velA, perturbation, gConst, softening);
}

