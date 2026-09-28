import { PerspectiveCamera, Vector3 } from 'three';
import { GRAPHICS_CONFIG } from '../config/graphics';

export class ThirdPersonCamera extends PerspectiveCamera {
  private readonly anchor = new Vector3();
  private strength = 0;
  private elapsed = 0;
  private impulse = 0;

  constructor() {
    super(GRAPHICS_CONFIG.camera.fov, 1, GRAPHICS_CONFIG.camera.near, GRAPHICS_CONFIG.camera.far);
    this.follow(0, 0, 0, true);
  }

  follow(x: number, z: number, dt: number, snap = false): void {
    const blend = snap ? 1 : 1 - Math.exp(-7 * dt);
    this.anchor.x += (x - this.anchor.x) * blend;
    this.anchor.z += (z - this.anchor.z) * blend;
    this.elapsed += dt;
    if (snap) { this.strength = 0; this.impulse = 0; }
    this.strength = Math.max(0, this.strength - dt * 2);
    this.impulse *= Math.exp(-5 * dt);
    const fov = GRAPHICS_CONFIG.camera.fov + this.impulse * 7;
    if (Math.abs(this.fov - fov) > 0.01) { this.fov = fov; this.updateProjectionMatrix(); }
    this.position.set(this.anchor.x + Math.sin(this.elapsed * 71) * this.strength,
      6.4 + Math.sin(this.elapsed * 93) * this.strength * 0.5, this.anchor.z + 10.2 + this.impulse * 0.7);
    this.lookAt(this.anchor.x, 1.8, this.anchor.z);
  }

  shake(amount: number): void { this.strength = Math.min(0.35, Math.max(this.strength, amount)); }
  impact(amount: number): void { this.impulse = Math.max(this.impulse, amount); this.shake(amount * 0.28); }
}
