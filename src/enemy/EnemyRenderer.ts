import { BoxGeometry, CircleGeometry, Color, ConeGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, MeshBasicMaterial, MeshStandardMaterial, Object3D, SphereGeometry } from 'three';
import { disposeScene } from '../utils/disposeScene';

export interface EnemyPose {
  id: number; x: number; z: number; rotation: number; hp: number;
  state: 'inactive' | 'chase' | 'windup' | 'knockback' | 'dead'; timer: number; flash: number;
}

export class EnemyRenderer extends Group {
  private readonly pieces: { mesh: InstancedMesh; local: Matrix4; animate: 'body' | 'weapon' | 'shadow' }[] = [];
  private readonly rootTransform = new Object3D();
  private readonly temp = new Matrix4();
  private readonly weapon = new Object3D();
  private readonly color = new Color();
  private readonly capacity = 60;

  constructor() {
    super();
    const armor = new MeshStandardMaterial({ color: 0x303d42, metalness: 0.5, roughness: 0.63 });
    const rust = new MeshStandardMaterial({ color: 0x632e2c, metalness: 0.3, roughness: 0.8 });
    const skin = new MeshStandardMaterial({ color: 0x867b64, roughness: 0.9 });
    const blade = new MeshStandardMaterial({ color: 0xb5bdb5, metalness: 0.65, roughness: 0.32 });
    const horn = new MeshStandardMaterial({ color: 0x997b45, metalness: 0.45, roughness: 0.6 });
    const local = new Object3D();
    const add = (geometry: BoxGeometry | CylinderGeometry | ConeGeometry | SphereGeometry | CircleGeometry, material: MeshStandardMaterial | MeshBasicMaterial,
      x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, animate: 'body' | 'weapon' | 'shadow' = 'body', rz = 0): void => {
      const mesh = new InstancedMesh(geometry, material, this.capacity);
      mesh.frustumCulled = false;
      local.position.set(x, y, z); local.scale.set(sx, sy, sz); local.rotation.set(animate === 'shadow' ? -Math.PI / 2 : 0, 0, rz); local.updateMatrix();
      this.pieces.push({ mesh, local: local.matrix.clone(), animate }); this.add(mesh);
      for (let i = 0; i < this.capacity; i++) { mesh.setMatrixAt(i, new Matrix4().makeScale(0, 0, 0)); mesh.setColorAt(i, this.color.set(0xffffff)); }
    };
    const box = new BoxGeometry(1, 1, 1);
    add(new CylinderGeometry(0.35, 0.46, 0.85, 6), armor, 0, 1.04, 0);
    add(box, rust, 0, 0.67, 0, 0.87, 0.25, 0.6);
    add(new SphereGeometry(0.25, 8, 6), skin, 0, 1.66, 0.025);
    add(new ConeGeometry(0.42, 0.38, 8), armor, 0, 1.92, 0);
    for (const sign of [-1, 1]) {
      add(box, rust, sign * 0.48, 1.37, 0, 0.35, 0.24, 0.57, 'body', sign * 0.12);
      add(box, armor, sign * 0.2, 0.29, 0, 0.23, 0.58, 0.28);
      add(new ConeGeometry(0.055, 0.38, 5), horn, sign * 0.25, 2.05, 0.14, 1, 1, 1, 'body', sign * -0.6);
    }
    add(box, blade, -0.64, 0.98, 0.58, 0.065, 1.25, 0.1, 'weapon', -0.22);
    add(box, horn, -0.5, 0.57, 0.58, 0.35, 0.06, 0.13, 'weapon', -0.22);
    add(new CircleGeometry(0.62, 16), new MeshBasicMaterial({ color: 0x071712, transparent: true, opacity: 0.32, depthWrite: false }), 0, 0.025, 0, 1, 1, 1, 'shadow');
  }

  update(enemies: ReadonlyArray<EnemyPose>, time: number): void {
    for (let i = 0; i < this.capacity; i++) {
      const enemy = enemies[i];
      const active = enemy && enemy.state !== 'inactive';
      const scale = !active ? 0 : enemy.state === 'dead' ? Math.max(0, Math.min(1, enemy.timer / 0.8)) : 1;
      this.color.set(!active || enemy.flash <= 0 ? 0xffffff : 0xffdfa0);
      if (active && enemy.state === 'windup') this.color.set(0xff9e79);
      for (const piece of this.pieces) {
        if (active) {
          const airborne = enemy.state === 'dead' || enemy.state === 'knockback';
          this.rootTransform.position.set(enemy.x, piece.animate === 'shadow' ? 0 : airborne ? Math.sin(Math.min(1, enemy.timer / 0.8) * Math.PI) * 1.15 : Math.abs(Math.sin(time * 9 + enemy.id)) * 0.035, enemy.z);
          this.rootTransform.rotation.set(piece.animate === 'shadow' ? 0 : enemy.state === 'dead' ? (1 - scale) * 1.4 : airborne ? -0.35 : 0, enemy.rotation, 0);
        }
        this.rootTransform.scale.setScalar(scale);
        this.rootTransform.updateMatrix();
        this.temp.copy(this.rootTransform.matrix);
        if (active && piece.animate === 'weapon' && enemy.state === 'windup') {
          this.weapon.rotation.x = -1.15 * Math.max(0, Math.min(1, enemy.timer / 0.35)); this.weapon.updateMatrix(); this.temp.multiply(this.weapon.matrix);
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
