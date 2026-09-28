import { BUDDHA_SKILL, CLEAR_KILLS, COMBAT_CONFIG, ENEMY_CONFIG, NORMAL_ATTACKS, PLAYER_CONFIG, SPAWN_CONFIG, SPATIAL_CELL_SIZE, STAGE_BOUND, STRONG_ATTACK } from '../config/balance';
import { ComboSystem } from '../combat/ComboSystem';
import { damageHp, inAttackArc } from '../combat/DamageSystem';
import { ObjectPool } from '../core/ObjectPool';
import { SpatialHashGrid } from '../core/SpatialHashGrid';
import type { GameResult, GameState } from './GameState';

export interface SessionInput { moveX: number; moveZ: number; attack: boolean; strong: boolean; skill: boolean; dodge: boolean }
export type AttackKind = 'normal' | 'strong' | 'skill';
export interface PlayerData {
  x: number; z: number; rotation: number; hp: number; power: number;
  moving: boolean; dodging: boolean; hurt: boolean; dead: boolean;
  attackProgress: number; attackKind: AttackKind | null; attackStep: number;
}
export interface EnemyData {
  id: number; x: number; z: number; rotation: number; hp: number;
  state: 'inactive' | 'chase' | 'windup' | 'knockback' | 'dead';
  timer: number; flash: number; speed: number; cooldown: number; vx: number; vz: number;
}
export interface GameEvent { kind: 'slash' | 'strong' | 'skill' | 'hit' | 'death' | 'playerHit'; x: number; z: number; rotation?: number }

const clampPosition = (value: number): number => Math.max(-STAGE_BOUND, Math.min(STAGE_BOUND, value));
const initialPlayer = (): PlayerData => ({
  x: 0, z: 0, rotation: Math.PI, hp: PLAYER_CONFIG.maxHp, power: 0,
  moving: false, dodging: false, hurt: false, dead: false,
  attackProgress: 0, attackKind: null, attackStep: 0,
});

/** Browser-independent battle simulation. Input actions are presses, not held keys. */
export class GameSession {
  state: GameState = 'title';
  result: GameResult = null;
  readonly player = initialPlayer();
  readonly enemies: readonly EnemyData[];
  readonly events: GameEvent[] = [];
  kills = 0;
  elapsed = 0;
  attackInstanceId = 0;
  private readonly pool: ObjectPool<EnemyData>;
  private readonly grid = new SpatialHashGrid(SPATIAL_CELL_SIZE);
  private readonly nearby: number[] = [];
  private readonly hitEnemies = new Set<number>();
  private readonly comboSystem = new ComboSystem();
  private readonly attackers = new Set<number>();
  private spawnTimer = 0;
  private hitInvincible = 0;
  private dodgeTimer = 0;
  private dodgeCooldown = 0;
  private dodgeX = 0;
  private dodgeZ = 0;
  private strongCooldown = 0;
  private attackTime = 0;
  private attackEventSent = false;
  private attackBuffer = 0;
  private chainTimer = 0;
  private nextStep = 0;

  constructor(private readonly random: () => number = Math.random) {
    this.pool = new ObjectPool(SPAWN_CONFIG.maxEnemies, (id) => ({
      id, x: 0, z: 0, rotation: 0, hp: 0, state: 'inactive', timer: 0,
      flash: 0, speed: 0, cooldown: 0, vx: 0, vz: 0,
    }));
    this.enemies = this.pool.items;
  }

  get combo(): number { return this.comboSystem.value; }
  get comboRemaining(): number { return this.comboSystem.timeRemaining; }
  get maxCombo(): number { return this.comboSystem.max; }
  get activeEnemies(): number { return this.enemies.reduce((sum, enemy) => sum + Number(enemy.state !== 'inactive' && enemy.state !== 'dead'), 0); }
  get attackSlots(): number { return this.attackers.size; }

  start(): void {
    this.reset();
    this.state = 'playing';
    for (let index = 0; index < SPAWN_CONFIG.initialEnemies; index++) this.spawnEnemy();
  }

  pause(): void { if (this.state === 'playing') this.state = 'paused'; }
  resume(): void { if (this.state === 'paused') this.state = 'playing'; }
  returnToTitle(): void { this.reset(); this.state = 'title'; }

  private reset(): void {
    Object.assign(this.player, initialPlayer());
    this.result = null;
    this.kills = 0;
    this.elapsed = 0;
    this.attackInstanceId = 0;
    this.events.length = 0;
    this.pool.reset();
    this.grid.clear();
    this.attackers.clear();
    this.hitEnemies.clear();
    this.comboSystem.reset();
    this.spawnTimer = 0;
    this.hitInvincible = 0;
    this.dodgeTimer = 0;
    this.dodgeCooldown = 0;
    this.dodgeX = 0;
    this.dodgeZ = 0;
    this.strongCooldown = 0;
    this.attackTime = 0;
    this.attackBuffer = 0;
    this.chainTimer = 0;
    this.nextStep = 0;
    this.attackEventSent = false;
    for (const enemy of this.enemies) {
      enemy.state = 'inactive'; enemy.hp = 0; enemy.timer = 0; enemy.flash = 0;
      enemy.vx = 0; enemy.vz = 0; enemy.cooldown = 0;
    }
  }

  update(dt: number, input: SessionInput): void {
    if (this.state !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    // GameLoop supplies fixed steps; bound unexpected direct callers as well.
    dt = Math.min(dt, 0.1);
    this.elapsed += dt;
    this.comboSystem.update(dt);
    this.updatePlayer(dt, input);
    this.syncGrid();
    this.updateEnemies(dt);
    this.resolveAttack();
    if (this.player.hp <= 0) { this.finish('over'); return; }
    if (this.kills >= CLEAR_KILLS) { this.finish('clear'); return; }
    this.spawnTimer += dt;
    if (this.spawnTimer + 1e-9 >= SPAWN_CONFIG.interval) {
      this.spawnTimer -= SPAWN_CONFIG.interval;
      const count = Math.min(SPAWN_CONFIG.spawnBatch, SPAWN_CONFIG.targetEnemies - this.activeEnemies);
      for (let index = 0; index < count; index++) this.spawnEnemy();
    }
  }

  private finish(result: Exclude<GameResult, null>): void {
    this.result = result;
    this.state = 'result';
    this.player.dead = result === 'over';
    this.player.moving = false;
    this.player.dodging = false;
    this.player.attackKind = null;
    this.attackers.clear();
  }

  private updatePlayer(dt: number, input: SessionInput): void {
    const player = this.player;
    this.hitInvincible = Math.max(0, this.hitInvincible - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.strongCooldown = Math.max(0, this.strongCooldown - dt);
    this.attackBuffer = Math.max(0, this.attackBuffer - dt);
    this.chainTimer = Math.max(0, this.chainTimer - dt);
    player.hurt = this.hitInvincible > 0;
    const length = Math.hypot(input.moveX, input.moveZ);
    const mx = length > 0 ? input.moveX / Math.max(1, length) : 0;
    const mz = length > 0 ? input.moveZ / Math.max(1, length) : 0;
    if (input.attack) this.attackBuffer = COMBAT_CONFIG.inputBuffer;

    if (input.dodge && this.dodgeCooldown <= 1e-9 && player.attackKind !== 'skill') {
      this.dodgeTimer = PLAYER_CONFIG.dodgeDuration;
      this.dodgeCooldown = PLAYER_CONFIG.dodgeCooldown;
      this.dodgeX = length > 0 ? mx : Math.sin(player.rotation);
      this.dodgeZ = length > 0 ? mz : Math.cos(player.rotation);
      player.rotation = Math.atan2(this.dodgeX, this.dodgeZ);
      player.attackKind = null;
      this.attackBuffer = 0;
      this.chainTimer = 0;
    }

    player.dodging = this.dodgeTimer > 1e-9;
    player.moving = length > 0;
    if (player.dodging) {
      const travelTime = Math.min(dt, this.dodgeTimer);
      player.x = clampPosition(player.x + this.dodgeX * PLAYER_CONFIG.dodgeSpeed * travelTime);
      player.z = clampPosition(player.z + this.dodgeZ * PLAYER_CONFIG.dodgeSpeed * travelTime);
      this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
      player.attackProgress = 0;
      return;
    }

    if (!player.attackKind) {
      if (length > 0) {
        const target = Math.atan2(mx, mz);
        const delta = Math.atan2(Math.sin(target - player.rotation), Math.cos(target - player.rotation));
        player.rotation += delta * Math.min(1, PLAYER_CONFIG.rotationSpeed * dt);
      }
      if (input.skill && player.power >= BUDDHA_SKILL.powerCost) this.beginAttack('skill');
      else if (input.strong && this.strongCooldown <= 1e-9) this.beginAttack('strong');
      else if (this.attackBuffer > 0) this.beginAttack('normal');
    }
    const moveSpeed = PLAYER_CONFIG.moveSpeed * (player.attackKind ? COMBAT_CONFIG.attackMoveFactor : 1);
    player.x = clampPosition(player.x + mx * moveSpeed * dt);
    player.z = clampPosition(player.z + mz * moveSpeed * dt);

    if (player.attackKind) {
      this.attackTime += dt;
      player.attackProgress = Math.min(1, this.attackTime / this.attackDefinition().duration);
      if (player.attackProgress >= 1 - 1e-9) {
        const wasNormal = player.attackKind === 'normal';
        this.nextStep = wasNormal ? (player.attackStep + 1) % NORMAL_ATTACKS.length : 0;
        this.chainTimer = wasNormal ? COMBAT_CONFIG.chainWindow : 0;
        player.attackKind = null;
        player.attackProgress = 0;
        if (wasNormal && this.attackBuffer > 0) this.beginAttack('normal');
      }
    }
  }

  private beginAttack(kind: AttackKind): void {
    this.player.attackKind = kind;
    this.player.attackStep = kind === 'normal' && this.chainTimer > 0 ? this.nextStep : 0;
    this.player.attackProgress = 0;
    this.attackTime = 0;
    this.attackBuffer = 0;
    this.hitEnemies.clear();
    this.attackEventSent = false;
    this.attackInstanceId++;
    if (kind === 'strong') this.strongCooldown = STRONG_ATTACK.cooldown;
    if (kind === 'skill') this.player.power = 0;
  }

  private attackDefinition() {
    if (this.player.attackKind === 'skill') return { ...BUDDHA_SKILL, arcDeg: 360 };
    if (this.player.attackKind === 'strong') return { ...STRONG_ATTACK, arcDeg: 360 };
    return NORMAL_ATTACKS[this.player.attackStep];
  }

  private syncGrid(): void {
    for (const enemy of this.enemies) {
      if (enemy.state === 'inactive' || enemy.state === 'dead') this.grid.remove(enemy.id);
      else this.grid.update(enemy.id, enemy.x, enemy.z);
    }
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (enemy.state === 'inactive') continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      if (enemy.state === 'dead' || enemy.state === 'knockback') {
        enemy.timer -= dt;
        enemy.x = clampPosition(enemy.x + enemy.vx * dt);
        enemy.z = clampPosition(enemy.z + enemy.vz * dt);
        const drag = Math.exp(-ENEMY_CONFIG.knockbackDrag * dt);
        enemy.vx *= drag; enemy.vz *= drag;
        if (enemy.timer <= 1e-9) {
          if (enemy.state === 'dead') { enemy.state = 'inactive'; this.pool.release(enemy); }
          else { enemy.state = 'chase'; enemy.vx = 0; enemy.vz = 0; }
        }
        if (enemy.state !== 'dead' && enemy.state !== 'inactive') this.grid.update(enemy.id, enemy.x, enemy.z);
        continue;
      }
      const dx = this.player.x - enemy.x;
      const dz = this.player.z - enemy.z;
      const distance = Math.hypot(dx, dz);
      enemy.rotation = Math.atan2(dx, dz);
      if (enemy.state === 'windup') {
        enemy.timer -= dt;
        if (enemy.timer <= 1e-9) {
          if (distance <= ENEMY_CONFIG.attackDistance) this.hitPlayer();
          enemy.state = 'chase';
          enemy.cooldown = this.between(ENEMY_CONFIG.attackIntervalMin, ENEMY_CONFIG.attackIntervalMax);
          this.attackers.delete(enemy.id);
        }
        continue;
      }
      if (distance <= ENEMY_CONFIG.attackDistance && enemy.cooldown <= 1e-9 && this.attackers.size < ENEMY_CONFIG.maxAttackers) {
        enemy.state = 'windup'; enemy.timer = ENEMY_CONFIG.windup;
        this.attackers.add(enemy.id);
        continue;
      }
      let vx = distance > ENEMY_CONFIG.attackDistance * 0.8 ? dx / Math.max(distance, 0.001) * enemy.speed : 0;
      let vz = distance > ENEMY_CONFIG.attackDistance * 0.8 ? dz / Math.max(distance, 0.001) * enemy.speed : 0;
      this.grid.queryRadius(enemy.x, enemy.z, ENEMY_CONFIG.separationRadius, this.nearby);
      for (const id of this.nearby) {
        if (id === enemy.id) continue;
        const other = this.enemies[id];
        let sx = enemy.x - other.x; let sz = enemy.z - other.z;
        let separation = Math.hypot(sx, sz);
        if (separation < 0.001) {
          const angle = (enemy.id + other.id) * 2.39996;
          const sign = enemy.id < other.id ? 1 : -1;
          sx = Math.sin(angle) * sign; sz = Math.cos(angle) * sign; separation = 1;
        }
        const strength = (1 - Math.min(separation, ENEMY_CONFIG.separationRadius) / ENEMY_CONFIG.separationRadius) * ENEMY_CONFIG.separationStrength;
        vx += sx / separation * strength; vz += sz / separation * strength;
      }
      const speed = Math.hypot(vx, vz);
      const limit = speed > enemy.speed * 1.5 ? enemy.speed * 1.5 / speed : 1;
      enemy.x = clampPosition(enemy.x + vx * limit * dt);
      enemy.z = clampPosition(enemy.z + vz * limit * dt);
      this.grid.update(enemy.id, enemy.x, enemy.z);
    }
  }

  private hitPlayer(): void {
    const dodgeAge = PLAYER_CONFIG.dodgeDuration - this.dodgeTimer;
    const invincible = this.hitInvincible > 1e-9 || (this.player.dodging && dodgeAge <= PLAYER_CONFIG.dodgeInvincibleDuration + 1e-9);
    if (invincible || this.player.hp <= 0) return;
    this.player.hp = damageHp(this.player.hp, ENEMY_CONFIG.attackDamage);
    this.hitInvincible = PLAYER_CONFIG.hitInvincibleDuration;
    this.player.hurt = true;
    this.events.push({ kind: 'playerHit', x: this.player.x, z: this.player.z });
  }

  private resolveAttack(): void {
    const player = this.player;
    if (!player.attackKind || player.hp <= 0 || player.attackProgress < COMBAT_CONFIG.hitStart || player.attackProgress > COMBAT_CONFIG.hitEnd) return;
    const attack = this.attackDefinition();
    if (!this.attackEventSent) {
      this.events.push({ kind: player.attackKind === 'normal' ? 'slash' : player.attackKind, x: player.x, z: player.z, rotation: player.rotation });
      this.attackEventSent = true;
    }
    this.grid.queryRadius(player.x, player.z, attack.radius, this.nearby);
    for (const id of this.nearby) {
      const enemy = this.enemies[id];
      if (this.hitEnemies.has(id) || enemy.hp <= 0) continue;
      const dx = enemy.x - player.x; const dz = enemy.z - player.z;
      if (!inAttackArc(dx, dz, player.rotation, attack.arcDeg)) continue;
      this.hitEnemies.add(id);
      enemy.hp = damageHp(enemy.hp, attack.damage);
      enemy.flash = 0.16;
      const distance = Math.hypot(dx, dz);
      enemy.vx = (distance > 0.001 ? dx / distance : Math.sin(player.rotation)) * attack.knockback;
      enemy.vz = (distance > 0.001 ? dz / distance : Math.cos(player.rotation)) * attack.knockback;
      this.attackers.delete(id);
      this.comboSystem.hit();
      this.events.push({ kind: 'hit', x: enemy.x, z: enemy.z });
      if (enemy.hp === 0) {
        enemy.state = 'dead'; enemy.timer = ENEMY_CONFIG.deathDuration;
        this.grid.remove(id);
        this.kills++;
        this.events.push({ kind: 'death', x: enemy.x, z: enemy.z });
      } else {
        enemy.state = 'knockback'; enemy.timer = ENEMY_CONFIG.knockbackDuration;
      }
      // A skill spends the whole meter and does not immediately refill itself.
      if (player.attackKind !== 'skill') player.power = Math.min(PLAYER_CONFIG.buddhistPowerMax, player.power + COMBAT_CONFIG.hitPower + (enemy.hp === 0 ? COMBAT_CONFIG.killPower : 0));
    }
  }

  private spawnEnemy(): void {
    const enemy = this.pool.acquire();
    if (!enemy) return;
    let x = 0; let z = 0; let valid = false;
    // Try a ring around the hero without clamping it into an invalid near spawn.
    for (let attempt = 0; attempt < 24; attempt++) {
      const angle = this.random() * Math.PI * 2 + attempt * 2.39996;
      const distance = this.between(SPAWN_CONFIG.minSpawnDistance, SPAWN_CONFIG.maxSpawnDistance);
      x = this.player.x + Math.sin(angle) * distance;
      z = this.player.z + Math.cos(angle) * distance;
      if (Math.abs(x) <= STAGE_BOUND && Math.abs(z) <= STAGE_BOUND) { valid = true; break; }
    }
    if (!valid) {
      const angle = Math.atan2(-this.player.x, -this.player.z);
      x = this.player.x + Math.sin(angle) * SPAWN_CONFIG.minSpawnDistance;
      z = this.player.z + Math.cos(angle) * SPAWN_CONFIG.minSpawnDistance;
    }
    Object.assign(enemy, {
      x, z, rotation: Math.atan2(this.player.x - x, this.player.z - z), hp: ENEMY_CONFIG.maxHp,
      state: 'chase', timer: 0, flash: 0, vx: 0, vz: 0,
      speed: this.between(ENEMY_CONFIG.moveSpeedMin, ENEMY_CONFIG.moveSpeedMax),
      cooldown: this.between(0.3, ENEMY_CONFIG.attackIntervalMin),
    });
    this.grid.insert(enemy.id, x, z);
  }

  private between(min: number, max: number): number { return min + this.random() * (max - min); }
}
