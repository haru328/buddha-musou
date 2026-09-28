import { AdditiveBlending, BoxGeometry, CircleGeometry, Color, ConeGeometry, CylinderGeometry, DataTexture, DoubleSide, Group, InstancedMesh, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, OctahedronGeometry, PlaneGeometry, RepeatWrapping, RGBAFormat, RingGeometry, SphereGeometry, TorusGeometry } from 'three';
import type { BufferGeometry, Material } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { disposeScene } from '../utils/disposeScene';

/** An open courtyard: every substantial prop stays outside the combat bounds. */
export class Stage extends Group {
  private readonly flames: InstancedMesh;
  private readonly embers: InstancedMesh;
  private readonly animated = new Object3D();
  private readonly stoneTexture: DataTexture;
  private readonly smokeTexture: DataTexture;
  private readonly smoke: InstancedMesh;
  private readonly fireSites = [[-25, -24], [25, -20], [-29, 10], [29, 5], [-17, -32], [18, -33]];

  constructor() {
    super();
    const pixels = new Uint8Array(256 * 256 * 4);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const grain = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const random = grain - Math.floor(grain);
      const vein = Math.abs(Math.sin(x * 0.041 + Math.sin(y * 0.048) * 1.7));
      const value = Math.round(135 + random * 67 - (vein < 0.055 ? 62 : 0) - (random < 0.08 ? 38 : 0));
      const index = (y * 256 + x) * 4;
      pixels[index] = value; pixels[index + 1] = value; pixels[index + 2] = value; pixels[index + 3] = 255;
    }
    this.stoneTexture = new DataTexture(pixels, 256, 256, RGBAFormat);
    this.stoneTexture.wrapS = this.stoneTexture.wrapT = RepeatWrapping;
    this.stoneTexture.magFilter = LinearFilter; this.stoneTexture.minFilter = LinearMipmapLinearFilter;
    this.stoneTexture.generateMipmaps = true; this.stoneTexture.needsUpdate = true;
    const stone = new MeshStandardMaterial({ color: 0x665f53, roughness: 0.94, map: this.stoneTexture, bumpMap: this.stoneTexture, bumpScale: 0.07 });
    const darkStone = new MeshStandardMaterial({ color: 0x252329, roughness: 0.93 });
    const wood = new MeshStandardMaterial({ color: 0x771f13, roughness: 0.82 });
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
      tiles.setColorAt(n, new Color().setHSL(0.09, 0.1 + (n % 3) * 0.035, 0.68 + Math.sin(n * 39.7) * 0.17));
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
    // Tiered tiled roofs, red colonnades and eave brackets form a complete burning temple.
    const makeHall = (x: number, z: number, width: number, depth: number, stories: number): void => {
      addBox(x, 0.3, z, width + 2, 0.6, depth + 2, darkStone);
      for (let level = 0; level < stories; level++) {
        const y = level * 4.4;
        const w = width * (1 - level * 0.15);
        addBox(x, y + 2, z, w * 0.85, 3.6, depth * 0.8, wood);
        for (const sign of [-1, 1]) for (let n = -2; n <= 2; n++) {
          addBox(x + n * w / 5, y + 2.1, z + sign * depth * 0.45, 0.35, 4, 0.4, wood);
          addBox(x + n * w / 5, y + 3.65, z + sign * depth * 0.45, 0.9, 0.25, 1.1, bronze);
        }
        for (let tier = 0; tier < 3; tier++) {
          const section = new Mesh(new ConeGeometry(1, 1, 4), darkStone);
          section.rotation.y = Math.PI / 4;
          section.scale.set((w + 3 - tier * 1.8) / Math.SQRT2, 1.9 - tier * 0.3, (depth + 3 - tier * 1.2) / Math.SQRT2);
          section.position.set(x, y + 4.1 + tier * 0.48, z); this.add(section);
        }
        addBox(x, y + 5.5, z, w * 0.9, 0.12, 0.25, bronze);
        for (const sign of [-1, 1]) {
          const finial = new Mesh(new ConeGeometry(0.19, 0.95, 6), bronze);
          finial.position.set(x + sign * w * 0.5, y + 5.45, z); finial.rotation.z = sign * -0.45; this.add(finial);
        }
      }
    };
    makeHall(0, -39, 22, 10, 2);
    makeHall(-35, -24, 11, 13, 3);
    makeHall(35, -25, 11, 13, 3);
    makeHall(-36, 10, 10, 18, 1);
    makeHall(36, 10, 10, 18, 1);
    const banner = new MeshStandardMaterial({ color: 0x9e160d, roughness: 0.9 });
    for (const side of [-1, 1]) for (const z of [-29, -13, 8, 26]) {
      const x = side * 28.8;
      addBox(x, 3.4, z, 0.12, 6.8, 0.12, bronze);
      addBox(x + side * 0.75, 6.4, z, 1.7, 0.12, 0.12, bronze);
      addBox(x + side * 0.75, 4.9, z, 1.4, 2.8, 0.035, banner);
      addBox(x + side * 0.75, 4.9, z + 0.03, 0.13, 1.9, 0.03, bronze);
      addBox(x + side * 0.75, 5.1, z + 0.03, 0.7, 0.14, 0.03, bronze);
      // Uneven cloth tails provide a war-torn edge.
      for (let n = 0; n < 4; n++) addBox(x + side * (0.21 + n * 0.35), 3.3 - (n % 2) * 0.18, z, 0.28, 0.6, 0.035, banner);
    }
    // Charred timbers and collapsed masonry stay toward the perimeter.
    for (let n = 0; n < 42; n++) {
      const side = n % 2 ? 1 : -1;
      const rubble = addBox(side * (27 + n % 6), 0.25, -31 + ((n * 13) % 64), 0.4 + n % 3, 0.5, 0.6, n % 3 ? darkStone : wood);
      rubble.rotation.y = n * 2.17; rubble.rotation.z = (n % 3) * 0.08;
    }
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
    const flameGeometry = new SphereGeometry(1, 7, 6);
    const flameVertices = flameGeometry.getAttribute('position');
    for (let index = 0; index < flameVertices.count; index++) {
      const y = flameVertices.getY(index);
      const taper = Math.max(0.08, 0.7 - y * 0.55);
      flameVertices.setXYZ(index, flameVertices.getX(index) * taper + y * y * 0.22, y, flameVertices.getZ(index) * taper);
    }
    flameGeometry.computeVertexNormals();
    this.flames = new InstancedMesh(flameGeometry, new MeshBasicMaterial({ color: 0xff7514, transparent: true, opacity: 0.42, depthWrite: false, blending: AdditiveBlending, toneMapped: false }), 54);
    this.flames.frustumCulled = false;
    this.embers = new InstancedMesh(new OctahedronGeometry(1, 0), new MeshBasicMaterial({ color: 0xffb23e, toneMapped: false }), 150);
    this.embers.frustumCulled = false;
    const smokePixels = new Uint8Array(64 * 64 * 4);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const radius = Math.hypot((x - 31.5) / 32, (y - 31.5) / 32);
      const noise = 0.7 + 0.15 * Math.sin(x * 0.34 + Math.sin(y * 0.23) * 3) + 0.15 * Math.cos(y * 0.51 + x * 0.19);
      const index = (y * 64 + x) * 4;
      smokePixels[index] = smokePixels[index + 1] = smokePixels[index + 2] = 255;
      smokePixels[index + 3] = Math.round(Math.pow(Math.max(0, 1 - radius), 1.6) * noise * 210);
    }
    this.smokeTexture = new DataTexture(smokePixels, 64, 64);
    this.smokeTexture.magFilter = LinearFilter; this.smokeTexture.needsUpdate = true;
    this.smoke = new InstancedMesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: 0x716565, map: this.smokeTexture, transparent: true, opacity: 0.5, depthWrite: false, side: DoubleSide }), 48);
    this.smoke.frustumCulled = false;
    this.add(this.flames, this.embers, this.smoke);
    this.update(0, 0);
  }

  update(_dt: number, time: number): void {
    for (let i = 0; i < this.flames.count; i++) {
      const site = this.fireSites[i % this.fireSites.length];
      const phase = time * (1.6 + (i % 4) * 0.15) + i * 2.4;
      const height = 1.4 + (Math.sin(phase * 3) + 1) * 0.8 + (i % 3) * 0.6;
      this.animated.position.set(site[0] + Math.sin(i * 43) * 1.4, height * 0.4 + (i % 3) * 0.25, site[1] + Math.cos(i * 17) * 1.3);
      this.animated.scale.set(0.4 + (i % 3) * 0.17, height, 0.4 + (i % 2) * 0.2);
      this.animated.rotation.set(Math.sin(phase) * 0.1, phase * 0.25, Math.cos(phase) * 0.18);
      this.animated.updateMatrix(); this.flames.setMatrixAt(i, this.animated.matrix);
    }
    this.flames.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < this.embers.count; i++) {
      const site = this.fireSites[i % this.fireSites.length];
      const cycle = (time * (0.4 + (i % 5) * 0.08) + i * 0.731) % 1;
      this.animated.position.set(site[0] + Math.sin(i * 23 + cycle * 4) * 3 + cycle * 3, 0.7 + cycle * 9, site[1] + Math.cos(i * 15) * 3);
      this.animated.scale.setScalar(0.035 + (1 - cycle) * (i % 3) * 0.025);
      this.animated.rotation.set(time + i, i, time * 2);
      this.animated.updateMatrix(); this.embers.setMatrixAt(i, this.animated.matrix);
    }
    this.embers.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < this.smoke.count; i++) {
      const site = this.fireSites[i % this.fireSites.length];
      const rise = (time * 0.025 + i * 0.137) % 1;
      const size = 3 + rise * 10;
      this.animated.position.set(site[0] + Math.sin(i * 1.7 + rise * 3) * 2 + rise * 4, 2 + rise * 19, site[1] - 2);
      this.animated.rotation.set(0, 0, Math.sin(i * 4) * 2 + rise * 0.3);
      this.animated.scale.set(size, size * 1.2, 1);
      this.animated.updateMatrix(); this.smoke.setMatrixAt(i, this.animated.matrix);
    }
    this.smoke.instanceMatrix.needsUpdate = true;
  }

  dispose(): void { this.stoneTexture.dispose(); this.smokeTexture.dispose(); disposeScene(this); }
}
