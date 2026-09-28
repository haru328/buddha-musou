import { BoxGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, Group, InstancedMesh, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, RingGeometry, TorusGeometry } from 'three';
import type { BufferGeometry, Material } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { disposeScene } from '../utils/disposeScene';

/** An open courtyard: every substantial prop stays outside the combat bounds. */
export class Stage extends Group {
  constructor() {
    super();
    const stone = new MeshStandardMaterial({ color: 0x56645c, roughness: 0.97 });
    const darkStone = new MeshStandardMaterial({ color: 0x323f3c, roughness: 1 });
    const wood = new MeshStandardMaterial({ color: 0x652f29, roughness: 0.9 });
    const bronze = new MeshStandardMaterial({ color: 0x947546, metalness: 0.5, roughness: 0.65 });
    const glow = new MeshBasicMaterial({ color: 0xffcb7c });
    const box = new BoxGeometry(1, 1, 1);
    const addBox = (x: number, y: number, z: number, sx: number, sy: number, sz: number, material = stone): Mesh => {
      const mesh = new Mesh(box, material);
      mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); this.add(mesh); return mesh;
    };
    addBox(0, -0.35, 0, 70, 0.65, 70, darkStone);
    // Slightly varied stone courses create texture without an external image.
    const tiles = new InstancedMesh(box, stone, 400);
    const dummy = new Object3D();
    for (let row = 0; row < 20; row++) for (let col = 0; col < 20; col++) {
      const n = row * 20 + col;
      dummy.position.set((col - 9.5) * 3.5, -0.065, (row - 9.5) * 3.5);
      dummy.scale.set(3.45, 0.1, 3.45); dummy.updateMatrix(); tiles.setMatrixAt(n, dummy.matrix);
    }
    this.add(tiles);
    const sealMaterial = new MeshBasicMaterial({ color: 0x8e8157, transparent: true, opacity: 0.34, depthWrite: false });
    for (const radius of [5.6, 6, 12, 25, 33.5]) {
      const seal = new Mesh(new RingGeometry(radius - 0.035, radius + 0.035, 96), sealMaterial);
      seal.rotation.x = -Math.PI / 2; seal.position.y = 0.008; this.add(seal);
    }
    const disk = new Mesh(new CircleGeometry(1.7, 8), new MeshBasicMaterial({ color: 0x8e8157, transparent: true, opacity: 0.18, depthWrite: false }));
    disk.rotation.x = -Math.PI / 2; disk.position.y = 0.01; this.add(disk);
    for (let n = -4; n <= 4; n++) {
      for (const side of [-1, 1]) {
        for (const axis of [0, 1]) {
          const x = axis ? side * 34.2 : n * 8;
          const z = axis ? n * 8 : side * 34.2;
          if (axis === 0 && side === -1 && Math.abs(n) < 1) continue;
          const height = 2.8 + ((n + 5) % 3) * 0.5;
          addBox(x, 0.25, z, 1.7, 0.5, 1.7);
          addBox(x, height / 2, z, 0.9, height, 0.9);
          addBox(x, height, z, 1.4, 0.3, 1.4, darkStone);
        }
      }
    }
    // Torii and a distant roof establish the temple silhouette.
    for (const x of [-5.2, 5.2]) {
      addBox(x, 4.1, -35, 0.75, 8.2, 0.8, wood);
      addBox(x, 0.4, -35, 1.15, 0.8, 1.15, darkStone);
    }
    addBox(0, 6.3, -35, 12.2, 0.5, 0.65, wood);
    addBox(0, 8, -35, 14, 0.7, 1.25, darkStone);
    addBox(0, 7.55, -35, 13.2, 0.35, 0.9, wood);
    addBox(0, 7, -34.8, 1.1, 1.4, 0.3, bronze);
    addBox(0, 2, -45, 16, 4, 8, darkStone);
    const roof = new Mesh(new ConeGeometry(12, 4, 4), darkStone);
    roof.rotation.y = Math.PI / 4; roof.scale.z = 0.65; roof.position.set(0, 6, -45); this.add(roof);
    // Stone lanterns are decorative, with emissive windows rather than per-prop lights.
    for (const x of [-31, 31]) for (const z of [-27, -12, 12, 27]) {
      addBox(x, 0.15, z, 1.7, 0.3, 1.7);
      addBox(x, 1.05, z, 0.55, 1.8, 0.55);
      addBox(x, 1.9, z, 1.3, 0.2, 1.3);
      const window = new Mesh(box, glow); window.position.set(x, 2.25, z); window.scale.set(0.65, 0.6, 0.65); this.add(window);
      const top = new Mesh(new ConeGeometry(1.15, 0.65, 4), darkStone); top.rotation.y = Math.PI / 4; top.position.set(x, 2.9, z); this.add(top);
    }
    // Low outer curb marks the traversable boundary without filling the arena.
    for (const sign of [-1, 1]) {
      addBox(sign * 34.8, 0.12, 0, 0.35, 0.3, 70);
      addBox(0, 0.12, sign * 34.8, 70, 0.3, 0.35);
    }
    const boundary = new Mesh(new TorusGeometry(0.9, 0.05, 6, 32), bronze);
    boundary.position.set(0, 7, -34.55); this.add(boundary);
    // Tall fragments beyond the court disappear naturally into scene fog.
    const columnGeometry = new CylinderGeometry(0.5, 0.8, 1, 6);
    for (let n = 0; n < 20; n++) {
      const angle = n * Math.PI * 2 / 20;
      const height = 4 + (n % 4) * 2;
      const column = new Mesh(columnGeometry, darkStone);
      column.position.set(Math.cos(angle) * 44, height / 2, Math.sin(angle) * 44);
      column.scale.y = height; column.rotation.z = Math.sin(n * 4) * 0.12; this.add(column);
    }
    // Static props collapse to one draw call per material, keeping the crowd cheap.
    const batches = new Map<Material, BufferGeometry[]>();
    const retired = new Set<BufferGeometry>();
    for (const child of [...this.children]) {
      if (!(child instanceof Mesh) || child instanceof InstancedMesh || Array.isArray(child.material)) continue;
      child.updateMatrix();
      const geometry = child.geometry.clone().applyMatrix4(child.matrix);
      const batch = batches.get(child.material) ?? [];
      batch.push(geometry); batches.set(child.material, batch);
      if (child.geometry !== box) retired.add(child.geometry);
      this.remove(child);
    }
    for (const [material, geometries] of batches) {
      const merged = mergeGeometries(geometries);
      if (merged) this.add(new Mesh(merged, material));
      geometries.forEach((geometry) => geometry.dispose());
    }
    retired.forEach((geometry) => geometry.dispose());
  }

  dispose(): void { disposeScene(this); }
}
