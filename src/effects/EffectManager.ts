import { AdditiveBlending, DoubleSide, Group, Mesh, MeshBasicMaterial, RingGeometry, SphereGeometry } from 'three';

type EffectKind = 'slash' | 'strong' | 'skill' | 'hit' | 'death';
interface EffectSlot {
  mesh: Mesh<RingGeometry | SphereGeometry, MeshBasicMaterial>;
  kind: EffectKind; age: number; duration: number; active: boolean; angle: number;
}

/** A bounded pool also keeps a mass hit from allocating dozens of render resources. */
export class EffectManager extends Group {
  private readonly slots: EffectSlot[] = [];
  private readonly ringGeometry = new RingGeometry(0.92, 1, 64);
  private readonly slashGeometry = new RingGeometry(0.8, 1, 40, 1, -Math.PI * 0.34, Math.PI * 0.68);
  private readonly flashGeometry = new SphereGeometry(1, 6, 4);
  private readonly attackSlots = 8;
  private attackCursor = 0;
  private impactCursor = 0;

  constructor() {
    super();
    for (let i = 0; i < 72; i++) {
      const material = new MeshBasicMaterial({ color: 0xffd57b, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide, blending: AdditiveBlending });
      const mesh = new Mesh(this.ringGeometry, material);
      mesh.visible = false; mesh.frustumCulled = false; this.add(mesh);
      this.slots.push({ mesh, kind: 'hit', age: 0, duration: 0, active: false, angle: 0 });
    }
  }

  emit(kind: EffectKind, x: number, z: number, rotation = 0): void {
    // Mass hit/death flashes must never evict the attack that produced them.
    const attack = kind === 'slash' || kind === 'strong' || kind === 'skill';
    const start = attack ? 0 : this.attackSlots;
    const end = attack ? this.attackSlots : this.slots.length;
    let slot: EffectSlot | undefined;
    for (let index = start; index < end; index++) {
      if (!this.slots[index].active) { slot = this.slots[index]; break; }
    }
    if (!slot) {
      const cursor = attack ? this.attackCursor++ : this.impactCursor++;
      slot = this.slots[start + cursor % (end - start)];
    }
    slot.active = true; slot.kind = kind; slot.age = 0; slot.angle = rotation;
    slot.duration = kind === 'skill' ? 0.8 : kind === 'death' ? 0.55 : kind === 'hit' ? 0.2 : 0.32;
    slot.mesh.geometry = kind === 'hit' || kind === 'death' ? this.flashGeometry : kind === 'slash' ? this.slashGeometry : this.ringGeometry;
    slot.mesh.position.set(x, kind === 'hit' || kind === 'death' ? 1.1 : kind === 'slash' ? 1 : 0.09, z);
    slot.mesh.rotation.set(-Math.PI / 2, 0, rotation - Math.PI / 2);
    slot.mesh.material.color.set(kind === 'death' ? 0xd9a85e : kind === 'skill' ? 0xffe9af : 0xffcd65);
    slot.mesh.material.opacity = 0.95;
    slot.mesh.scale.setScalar(kind === 'slash' ? 2.5 : kind === 'hit' ? 0.2 : 0.1);
    slot.mesh.visible = true;
  }

  update(dt: number): void {
    for (const slot of this.slots) {
      if (!slot.active) continue;
      slot.age += dt;
      const progress = slot.age / slot.duration;
      if (progress >= 1) { slot.active = false; slot.mesh.visible = false; continue; }
      slot.mesh.material.opacity = (1 - progress) * (slot.kind === 'death' ? 0.55 : 0.95);
      if (slot.kind === 'slash') {
        slot.mesh.scale.setScalar(2.5 + progress * 1.5);
        slot.mesh.rotation.z = slot.angle - Math.PI / 2 - 0.5 + progress;
      } else if (slot.kind === 'strong' || slot.kind === 'skill') {
        const radius = slot.kind === 'skill' ? 12 : 6;
        slot.mesh.scale.setScalar(0.8 + Math.sin(progress * Math.PI / 2) * radius);
        slot.mesh.position.y = 0.09 + Math.sin(progress * Math.PI) * (slot.kind === 'skill' ? 0.5 : 0.15);
      } else {
        const size = slot.kind === 'hit' ? 0.12 + Math.sin(progress * Math.PI) * 0.35 : 0.2 + progress * 0.6;
        slot.mesh.scale.set(size, size * (slot.kind === 'death' ? 2 : 0.6), size);
        slot.mesh.position.y += dt * (slot.kind === 'death' ? 2.6 : 0.7);
        slot.mesh.rotation.z += dt * 6;
      }
    }
  }

  reset(): void {
    this.attackCursor = 0; this.impactCursor = 0;
    for (const slot of this.slots) { slot.active = false; slot.mesh.visible = false; }
  }
  dispose(): void {
    // A geometry may be unused by all slots at the instant of disposal.
    this.ringGeometry.dispose(); this.slashGeometry.dispose(); this.flashGeometry.dispose();
    for (const slot of this.slots) slot.mesh.material.dispose();
    this.clear();
  }
}
