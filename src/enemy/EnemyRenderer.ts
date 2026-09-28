import { BoxGeometry, CircleGeometry, Color, ConeGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, MeshBasicMaterial, MeshStandardMaterial, Object3D, SphereGeometry, TorusGeometry } from 'three';
import type { BufferGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { disposeScene } from '../utils/disposeScene';
import { ENEMY_CONFIG, SPAWN_CONFIG } from '../config/balance';

export interface EnemyPose {
  id: number; x: number; z: number; rotation: number; hp: number;
  state: 'inactive' | 'chase' | 'windup' | 'knockback' | 'dead'; timer: number; flash: number;
  y?: number; spin?: number;
}

export class EnemyRenderer extends Group {
  private readonly pieces: { mesh: InstancedMesh; local: Matrix4; animate: 'body' | 'weapon' | 'shadow' }[] = [];
  private readonly rootTransform = new Object3D();
  private readonly temp = new Matrix4();
  private readonly weapon = new Object3D();
  private readonly color = new Color();
  private readonly capacity = SPAWN_CONFIG.maxEnemies;

  constructor() {
    super();
    const armor = new MeshStandardMaterial({ color: 0x1e2228, metalness: 0.65, roughness: 0.4 });
    const rust = new MeshStandardMaterial({ color: 0x951b14, metalness: 0.4, roughness: 0.5 });
    const skin = new MeshStandardMaterial({ color: 0xa08b71, roughness: 0.9 });
    const blade = new MeshStandardMaterial({ color: 0xb5bdb5, metalness: 0.65, roughness: 0.32 });
    const horn = new MeshStandardMaterial({ color: 0x997b45, metalness: 0.45, roughness: 0.6 });
    const local = new Object3D();
    const add = (geometry: BufferGeometry, material: MeshStandardMaterial | MeshBasicMaterial,
      x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, animate: 'body' | 'weapon' | 'shadow' = 'body', rz = 0): void => {
      const mesh = new InstancedMesh(geometry, material, this.capacity);
      mesh.frustumCulled = false;
      local.position.set(x, y, z); local.scale.set(sx, sy, sz); local.rotation.set(animate === 'shadow' ? -Math.PI / 2 : 0, 0, rz); local.updateMatrix();
      this.pieces.push({ mesh, local: local.matrix.clone(), animate }); this.add(mesh);
      for (let i = 0; i < this.capacity; i++) { mesh.setMatrixAt(i, new Matrix4().makeScale(0, 0, 0)); mesh.setColorAt(i, this.color.set(0xffffff)); }
    };
    const box = new BoxGeometry(1, 1, 1);
    add(new CylinderGeometry(0.38, 0.46, 0.85, 8), armor, 0, 1.04, 0);
    for (let layer = 0; layer < 4; layer++) {
      add(box, layer % 2 ? rust : armor, 0, 0.72 + layer * 0.17, 0.22, 0.83 - layer * 0.045, 0.14, 0.28);
      add(box, horn, 0, 0.69 + layer * 0.17, 0.367, 0.7 - layer * 0.03, 0.025, 0.025);
    }
    for (const side of [-1, 1]) {
      add(box, rust, side * 0.24, 0.6, 0.2, 0.4, 0.45, 0.31, 'body', side * 0.17);
      add(box, armor, side * 0.53, 1.1, 0.01, 0.2, 0.6, 0.25, 'body', side * 0.15);
    }
    add(new SphereGeometry(0.25, 8, 6), skin, 0, 1.66, 0.025);
    add(new SphereGeometry(0.32, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), armor, 0, 1.78, 0);
    add(new ConeGeometry(0.39, 0.18, 10), armor, 0, 1.8, 0);
    add(box, rust, 0, 1.57, 0.23, 0.4, 0.16, 0.1);
    add(box, armor, 0, 1.7, 0.26, 0.36, 0.045, 0.08);
    add(new TorusGeometry(0.23, 0.028, 5, 16, Math.PI), horn, 0, 2.02, 0.23);
    for (const sign of [-1, 1]) {
      for (let layer = 0; layer < 3; layer++) add(box, layer % 2 ? armor : rust, sign * (0.48 + layer * 0.04), 1.43 - layer * 0.12, 0, 0.35, 0.1, 0.57, 'body', sign * 0.2);
      add(box, armor, sign * 0.2, 0.29, 0, 0.23, 0.58, 0.28);
      add(box, rust, sign * 0.2, 0.25, 0.17, 0.2, 0.32, 0.07);
      add(box, armor, sign * 0.2, 0.07, 0.11, 0.28, 0.13, 0.42);
      add(new ConeGeometry(0.055, 0.38, 5), horn, sign * 0.25, 2.05, 0.14, 1, 1, 1, 'body', sign * -0.6);
    }
    add(box, blade, -0.64, 1.09, 0.58, 0.07, 1.65, 0.11, 'weapon', -0.22);
    add(box, horn, -0.5, 0.57, 0.58, 0.35, 0.06, 0.13, 'weapon', -0.22);
    add(new CircleGeometry(0.62, 16), new MeshBasicMaterial({ color: 0x071712, transparent: true, opacity: 0.32, depthWrite: false }), 0, 0.025, 0, 1, 1, 1, 'shadow');
    const originals = [...this.pieces];
    this.pieces.length = 0;
    const retired = new Set<BufferGeometry>();
    for (const piece of originals) {
      if (piece.animate !== 'body') { this.pieces.push(piece); continue; }
      if (this.pieces.some((merged) => merged.animate === 'body' && merged.mesh.material === piece.mesh.material)) continue;
      const source = originals.filter((candidate) => candidate.animate === 'body' && candidate.mesh.material === piece.mesh.material);
      const transformed = source.map((part) => part.mesh.geometry.clone().applyMatrix4(part.local));
      const geometry = mergeGeometries(transformed);
      if (geometry) {
        const mesh = new InstancedMesh(geometry, piece.mesh.material, this.capacity); mesh.frustumCulled = false;
        this.pieces.push({ mesh, local: new Matrix4(), animate: 'body' }); this.add(mesh);
      }
      transformed.forEach((item) => item.dispose());
      for (const part of source) { retired.add(part.mesh.geometry); part.mesh.dispose(); this.remove(part.mesh); }
    }
    for (const geometry of retired) if (!this.pieces.some((piece) => piece.mesh.geometry === geometry)) geometry.dispose();
  }

  update(enemies: ReadonlyArray<EnemyPose>, time: number): void {
    for (let i = 0; i < this.capacity; i++) {
      const enemy = enemies[i];
      const active = enemy && enemy.state !== 'inactive';
      const scale = !active ? 0 : enemy.state === 'dead' ? Math.max(0, Math.min(1, enemy.timer / Math.min(0.45, ENEMY_CONFIG.deathDuration))) : 1;
      this.color.set(!active || enemy.flash <= 0 ? 0xffffff : 0xffdfa0);
      if (active && enemy.state === 'windup') this.color.set(0xff9e79);
      for (const piece of this.pieces) {
        if (active) {
          const airborne = enemy.state === 'dead' || enemy.state === 'knockback';
          this.rootTransform.position.set(enemy.x, piece.animate === 'shadow' ? 0 : airborne ? enemy.y ?? 0 : Math.abs(Math.sin(time * 11 + enemy.id)) * 0.075, enemy.z);
          this.rootTransform.rotation.set(piece.animate === 'shadow' ? 0 : airborne ? enemy.spin ?? -0.35 : 0.08, enemy.rotation, piece.animate !== 'shadow' && airborne ? (enemy.spin ?? 0) * 0.35 : 0);
        }
        this.rootTransform.scale.setScalar(scale);
        this.rootTransform.updateMatrix();
        this.temp.copy(this.rootTransform.matrix);
        if (active && piece.animate === 'weapon' && enemy.state === 'windup') {
          this.weapon.rotation.x = -1.65 * Math.max(0, Math.min(1, enemy.timer / ENEMY_CONFIG.windup)); this.weapon.updateMatrix(); this.temp.multiply(this.weapon.matrix);
        }
        this.temp.multiply(piece.local); piece.mesh.setMatrixAt(i, this.temp);
        if (piece.animate !== 'shadow') piece.mesh.setColorAt(i, this.color);
      }
    }
    for (const piece of this.pieces) {
      piece.mesh.instanceMatrix.needsUpdate = true;
      if (piece.mesh.instanceColor) piece.mesh.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void { disposeScene(this); }
}
