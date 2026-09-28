import { CircleGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry } from 'three';
import { disposeScene } from '../utils/disposeScene';

export interface PlayerPose {
  x: number; z: number; rotation: number; moving: boolean; attackProgress: number;
  attackKind: 'normal' | 'strong' | 'skill' | null; attackStep: number;
  dodging: boolean; hurt: boolean; dead: boolean;
}

export class PlayerRenderer extends Group {
  private readonly body = new Group();
  private readonly rightArm = new Group();
  private readonly leftArm = new Group();
  private readonly legs: Mesh[] = [];
  private readonly halo: Mesh;
  private readonly gold = new MeshStandardMaterial({ color: 0xe3ba62, metalness: 0.72, roughness: 0.34, emissive: 0x5f360b, emissiveIntensity: 0.22 });
  private time = 0;

  constructor() {
    super();
    const bronze = new MeshStandardMaterial({ color: 0x886034, metalness: 0.65, roughness: 0.5 });
    const red = new MeshStandardMaterial({ color: 0x802e25, roughness: 0.85 });
    const dark = new MeshStandardMaterial({ color: 0x49372a, metalness: 0.4, roughness: 0.65 });
    const light = new MeshBasicMaterial({ color: 0xffd876 });
    const sphere = new SphereGeometry(1, 16, 12);
    const addSphere = (root: Group, x: number, y: number, z: number, sx: number, sy: number, sz: number, material: MeshStandardMaterial | MeshBasicMaterial = this.gold): Mesh => {
      const mesh = new Mesh(sphere, material); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); root.add(mesh); return mesh;
    };
    const shadow = new Mesh(new CircleGeometry(0.85, 32), new MeshBasicMaterial({ color: 0x101916, transparent: true, opacity: 0.4, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.025; this.add(shadow, this.body);
    const robe = new Mesh(new CylinderGeometry(0.5, 0.7, 1.25, 12), bronze);
    robe.position.y = 0.97; this.body.add(robe);
    addSphere(this.body, 0, 1.68, 0, 0.68, 0.68, 0.39);
    addSphere(this.body, 0, 2.43, 0, 0.4, 0.49, 0.36);
    addSphere(this.body, 0, 2.87, -0.04, 0.35, 0.22, 0.3, dark);
    addSphere(this.body, 0, 3.05, -0.04, 0.16, 0.2, 0.15, dark);
    for (const side of [-1, 1]) {
      addSphere(this.body, side * 0.4, 2.35, 0, 0.09, 0.26, 0.11);
      // Closed eyes and long earlobes keep the silhouette recognizably Buddha-like.
      addSphere(this.body, side * 0.14, 2.5, 0.33, 0.09, 0.018, 0.018, dark);
      const leg = addSphere(this.body, side * 0.27, 0.32, 0.1, 0.21, 0.36, 0.27); this.legs.push(leg);
    }
    addSphere(this.body, 0, 2.37, 0.365, 0.065, 0.11, 0.065);
    addSphere(this.body, 0, 2.64, 0.34, 0.035, 0.035, 0.025, light);
    const sash = new Mesh(new CylinderGeometry(0.57, 0.61, 0.32, 16), red);
    sash.position.set(0, 1.73, 0); sash.rotation.z = -0.48; sash.scale.z = 0.73; this.body.add(sash);
    const drape = addSphere(this.body, -0.43, 1.1, 0.36, 0.16, 0.66, 0.055, red); drape.rotation.z = -0.15;
    const beads = new TorusGeometry(0.32, 0.055, 6, 18);
    const necklace = new Mesh(beads, bronze); necklace.position.set(0, 1.94, 0.34); this.body.add(necklace);
    this.halo = new Mesh(new TorusGeometry(0.78, 0.045, 8, 64), light);
    this.halo.position.set(0, 2.52, -0.43); this.body.add(this.halo);
    const haloOuter = new Mesh(new TorusGeometry(0.9, 0.015, 6, 64), this.gold);
    haloOuter.position.copy(this.halo.position); this.body.add(haloOuter);
    this.rightArm.position.set(-0.65, 1.93, 0); this.leftArm.position.set(0.65, 1.93, 0);
    this.body.add(this.rightArm, this.leftArm);
    addSphere(this.rightArm, -0.09, -0.36, 0.15, 0.17, 0.47, 0.19);
    addSphere(this.leftArm, 0.08, -0.28, 0.12, 0.18, 0.4, 0.18);
    addSphere(this.leftArm, 0.09, -0.42, 0.34, 0.14, 0.16, 0.14);
    const staff = new Mesh(new CylinderGeometry(0.045, 0.06, 3.1, 8), bronze);
    staff.position.set(-0.22, -0.15, 0.28); this.rightArm.add(staff);
    const crown = new Mesh(new TorusGeometry(0.23, 0.045, 8, 24), this.gold);
    crown.position.set(-0.22, 1.57, 0.28); this.rightArm.add(crown);
    for (const side of [-1, 1]) {
      const ring = new Mesh(new TorusGeometry(0.09, 0.02, 6, 16), this.gold);
      ring.position.set(-0.22 + side * 0.18, 1.43, 0.28); this.rightArm.add(ring);
    }
  }

  update(dt: number, pose: PlayerPose): void {
    this.time += dt;
    this.position.set(pose.x, 0, pose.z); this.rotation.y = pose.rotation;
    const stride = pose.moving ? Math.sin(this.time * 14) : 0;
    this.body.position.y = pose.dodging ? 0.1 : Math.abs(stride) * 0.055;
    this.body.rotation.set(pose.dead ? -1.3 : pose.dodging ? 0.4 : 0, 0, pose.hurt ? Math.sin(this.time * 65) * 0.035 : 0);
    this.legs[0].rotation.x = stride * 0.45; this.legs[1].rotation.x = -stride * 0.45;
    this.rightArm.rotation.set(stride * 0.1, 0, -0.08);
    this.leftArm.rotation.set(-stride * 0.2, 0, 0.1);
    if (pose.attackKind) {
      const progress = Math.max(0, Math.min(1, pose.attackProgress));
      const swing = Math.sin(progress * Math.PI);
      if (pose.attackKind === 'skill') {
        this.rightArm.rotation.z = -1.9 * swing; this.leftArm.rotation.z = 1.5 * swing;
        this.body.position.y += swing * 0.4;
      } else {
        const direction = pose.attackStep % 2 === 0 ? 1 : -1;
        this.body.rotation.y = direction * Math.sin(progress * Math.PI * 2) * (pose.attackKind === 'strong' ? 1.2 : 0.45);
        this.rightArm.rotation.set(-1.25 * swing, direction * (progress - 0.5) * 3.5 * swing, -0.9 * swing);
      }
    }
    this.gold.emissiveIntensity = pose.hurt ? 1.2 : pose.attackKind === 'skill' ? 0.85 : 0.22;
    this.halo.scale.setScalar(1 + Math.sin(this.time * 2) * 0.025);
  }

  reset(): void { this.time = 0; this.body.rotation.set(0, 0, 0); this.body.position.y = 0; }
  dispose(): void { disposeScene(this); }
}
