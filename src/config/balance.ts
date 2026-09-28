export const PLAYER_CONFIG = {
  maxHp: 1000, moveSpeed: 8, rotationSpeed: 12,
  dodgeSpeed: 16, dodgeDuration: 0.3, dodgeInvincibleDuration: 0.25,
  dodgeCooldown: 0.5, hitInvincibleDuration: 0.35, buddhistPowerMax: 100,
} as const;

export const NORMAL_ATTACKS = [
  { damage: 40, radius: 3, arcDeg: 110, knockback: 3, duration: 0.45 },
  { damage: 55, radius: 3.5, arcDeg: 130, knockback: 4, duration: 0.48 },
  { damage: 80, radius: 4.5, arcDeg: 170, knockback: 8, duration: 0.6 },
] as const;
export const STRONG_ATTACK = { damage: 120, radius: 6, knockback: 12, cooldown: 1.2, duration: 0.65 } as const;
export const BUDDHA_SKILL = { damage: 300, radius: 12, knockback: 20, powerCost: 100, duration: 1.05 } as const;
export const ENEMY_CONFIG = {
  maxHp: 100, moveSpeedMin: 2.2, moveSpeedMax: 3.2,
  attackDamage: 15, attackDistance: 1.8, attackIntervalMin: 1.5, attackIntervalMax: 2.5,
  separationRadius: 1.2, separationStrength: 2.8, windup: 0.35,
  maxAttackers: 6, knockbackDuration: 0.45, knockbackDrag: 4, deathDuration: 0.8,
} as const;
export const SPAWN_CONFIG = {
  initialEnemies: 20, targetEnemies: 50, maxEnemies: 60,
  minSpawnDistance: 14, maxSpawnDistance: 28, spawnBatch: 5, interval: 1,
} as const;
export const COMBAT_CONFIG = {
  inputBuffer: 0.25, chainWindow: 0.55, hitStart: 0.22, hitEnd: 0.6,
  comboTimeout: 3, hitPower: 2, killPower: 3, attackMoveFactor: 0.25,
} as const;
export const STAGE_BOUND = 33;
export const CLEAR_KILLS = 100;
export const SPATIAL_CELL_SIZE = 4;
