import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/game/GameSession';
import type { EnemyData, SessionInput } from '../src/game/GameSession';
import { ENEMY_CONFIG, PLAYER_CONFIG, SPAWN_CONFIG, STAGE_BOUND } from '../src/config/balance';

const idle: SessionInput = { moveX: 0, moveZ: 0, attack: false, strong: false, skill: false, dodge: false };
const tick = (game: GameSession, input: Partial<SessionInput> = {}) => game.update(1 / 60, { ...idle, ...input });
const run = (game: GameSession, seconds: number, input: Partial<SessionInput> = {}) => {
  for (let i = 0; i < Math.round(seconds * 60); i++) tick(game, input);
};
function makeGame(): GameSession {
  let seed = 98765;
  const game = new GameSession(() => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; });
  game.start();
  return game;
}
function parkEnemies(game: GameSession): void {
  for (const enemy of game.enemies) {
    if (enemy.state === 'inactive') continue;
    enemy.x = 25; enemy.z = 25; enemy.speed = 0; enemy.cooldown = 100;
  }
}
function place(enemy: EnemyData, x: number, z: number): void {
  Object.assign(enemy, { x, z, speed: 0, cooldown: 100, vx: 0, vz: 0, state: 'chase', hp: 100 });
}

describe('game flow and movement', () => {
  it('starts at title and pauses all simulation and actions', () => {
    const game = new GameSession();
    tick(game, { attack: true });
    expect(game.state).toBe('title'); expect(game.elapsed).toBe(0);
    game.start(); game.pause();
    const snapshot = JSON.stringify(game.enemies);
    run(game, 1, { moveX: 1, attack: true });
    expect(game.player.x).toBe(0); expect(game.elapsed).toBe(0);
    expect(JSON.stringify(game.enemies)).toBe(snapshot);
    game.resume(); tick(game, { moveX: 1 });
    expect(game.elapsed).toBeGreaterThan(0); expect(game.player.x).toBeGreaterThan(0);
  });
  it('normalizes diagonal movement and clamps the arena boundary', () => {
    const straight = makeGame(); const diagonal = makeGame();
    run(straight, 1, { moveX: 1 }); run(diagonal, 1, { moveX: 1, moveZ: -1 });
    expect(straight.player.x).toBeCloseTo(8);
    expect(Math.hypot(diagonal.player.x, diagonal.player.z)).toBeCloseTo(8);
    run(straight, 10, { moveX: 1 });
    expect(straight.player.x).toBe(STAGE_BOUND);
  });
  it('dashes in input direction or facing and observes cooldown', () => {
    const game = makeGame(); parkEnemies(game);
    tick(game, { dodge: true }); run(game, 17 / 60);
    expect(game.player.z).toBeCloseTo(-4.8);
    tick(game, { dodge: true }); expect(game.player.dodging).toBe(false);
    run(game, 0.3); tick(game, { dodge: true, moveX: 1 });
    expect(game.player.dodging).toBe(true); expect(game.player.x).toBeGreaterThan(0);
  });
});

describe('spawning and AI', () => {
  it('starts twenty at safe ring distances and ramps to fifty without exceeding the pool', () => {
    const game = makeGame();
    expect(game.activeEnemies).toBe(20);
    for (const enemy of game.enemies.filter(e => e.state !== 'inactive')) {
      expect(Math.hypot(enemy.x, enemy.z)).toBeGreaterThanOrEqual(14);
      expect(Math.hypot(enemy.x, enemy.z)).toBeLessThanOrEqual(28);
    }
    run(game, 6);
    expect(game.activeEnemies).toBe(50);
    run(game, 10);
    expect(game.activeEnemies).toBe(50);
    expect(game.enemies).toHaveLength(SPAWN_CONFIG.maxEnemies);
  });
  it('spawns inside the arena and safe ring even when the player is in a corner', () => {
    const game = makeGame();
    game.player.x = STAGE_BOUND; game.player.z = STAGE_BOUND;
    run(game, 1);
    for (const enemy of game.enemies.slice(20, 25)) {
      expect(Math.abs(enemy.x)).toBeLessThanOrEqual(STAGE_BOUND);
      expect(Math.abs(enemy.z)).toBeLessThanOrEqual(STAGE_BOUND);
      expect(Math.hypot(enemy.x - game.player.x, enemy.z - game.player.z)).toBeGreaterThanOrEqual(14 - 1e-6);
    }
  });
  it('separates initially coincident enemies and pursues the player', () => {
    const game = makeGame(); parkEnemies(game);
    const a = game.enemies[0]; const b = game.enemies[1];
    place(a, 10, 0); place(b, 10, 0); a.speed = b.speed = 3;
    run(game, 0.5);
    expect(a.x).toBeLessThan(10);
    expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(0.1);
  });
  it('limits simultaneous attackers and damage through hit invulnerability', () => {
    const game = makeGame(); parkEnemies(game);
    for (let i = 0; i < 10; i++) {
      place(game.enemies[i], Math.sin(i) * 1.4, Math.cos(i) * 1.4);
      game.enemies[i].cooldown = 0;
    }
    tick(game); expect(game.attackSlots).toBe(6);
    run(game, ENEMY_CONFIG.windup);
    expect(game.player.hp).toBe(PLAYER_CONFIG.maxHp - ENEMY_CONFIG.attackDamage);
    expect(game.events.filter(event => event.kind === 'playerHit')).toHaveLength(1);
  });
  it('dodge invulnerability avoids a telegraphed hit', () => {
    const game = makeGame(); parkEnemies(game);
    game.player.z = -STAGE_BOUND;
    place(game.enemies[0], 0, -STAGE_BOUND + 1.5); game.enemies[0].cooldown = 0;
    tick(game); run(game, 0.2); tick(game, { dodge: true, moveZ: -1 }); run(game, 0.2);
    expect(game.player.hp).toBe(PLAYER_CONFIG.maxHp);
  });
});

describe('player combat', () => {
  it('hits each forward enemy once, excludes rear enemies, and adds hit power', () => {
    const game = makeGame(); parkEnemies(game);
    place(game.enemies[0], -0.5, -2); place(game.enemies[1], 0.5, -2); place(game.enemies[2], 0, 2);
    tick(game, { attack: true }); run(game, 0.4);
    expect(game.enemies[0].hp).toBe(60); expect(game.enemies[1].hp).toBe(60);
    expect(game.enemies[2].hp).toBe(100);
    expect(game.combo).toBe(2); expect(game.player.power).toBe(4);
    expect(game.events.filter(event => event.kind === 'slash')).toHaveLength(1);
  });
  it('buffers three attack stages, then returns to stage one', () => {
    const game = makeGame(); parkEnemies(game);
    tick(game, { attack: true }); run(game, 0.25); tick(game, { attack: true }); run(game, 0.2);
    expect(game.player.attackKind).toBe('normal'); expect(game.player.attackStep).toBe(1);
    run(game, 0.25); tick(game, { attack: true }); run(game, 0.25);
    expect(game.player.attackStep).toBe(2);
    run(game, 0.35); tick(game, { attack: true }); run(game, 0.25);
    expect(game.player.attackStep).toBe(0); expect(game.attackInstanceId).toBe(4);
  });
  it('strong attacks kill a ring, reward hit plus kill, and honor cooldown', () => {
    const game = makeGame(); parkEnemies(game);
    for (let i = 0; i < 10; i++) place(game.enemies[i], Math.sin(i) * 4, Math.cos(i) * 4);
    tick(game, { strong: true }); run(game, 0.7);
    expect(game.kills).toBe(10); expect(game.combo).toBe(10); expect(game.player.power).toBe(50);
    expect(game.enemies.slice(0, 10).every(enemy => enemy.state === 'dead')).toBe(true);
    tick(game, { strong: true }); expect(game.player.attackKind).toBeNull();
    run(game, 0.5); tick(game, { strong: true }); expect(game.player.attackKind).toBe('strong');
  });
  it('requires a full meter for skill, hits a broad ring and leaves power at zero', () => {
    const game = makeGame(); parkEnemies(game);
    game.player.power = 99; tick(game, { skill: true });
    expect(game.player.attackKind).toBeNull();
    game.player.power = 100;
    for (let i = 0; i < 10; i++) place(game.enemies[i], Math.sin(i) * 10, Math.cos(i) * 10);
    tick(game, { skill: true }); run(game, 0.4);
    expect(game.kills).toBe(10); expect(game.player.power).toBe(0);
    expect(game.events.filter(event => event.kind === 'skill')).toHaveLength(1);
  });
  it('clamps earned power, recycles death slots, and resets combo after inactivity', () => {
    const game = makeGame(); parkEnemies(game);
    const references = [...game.enemies];
    game.player.power = 99; place(game.enemies[0], 0, -2);
    tick(game, { strong: true }); run(game, 4);
    expect(game.player.power).toBe(100); expect(game.combo).toBe(0); expect(game.maxCombo).toBe(1);
    expect(game.enemies[0].state).toBe('chase');
    expect(game.enemies.every((enemy, index) => enemy === references[index])).toBe(true);
  });
});

describe('result and restart', () => {
  it('supports an unmodified full battle to clear, retry, defeat and title', () => {
    const game = makeGame();
    // Repeated button presses only: no HP, spawn, kill or cooldown overrides.
    for (let frame = 0; frame < 180 * 60 && game.state === 'playing'; frame++) {
      const press = frame % 12 === 0;
      tick(game, { strong: press, skill: press });
      game.events.length = 0;
    }
    expect(game.result).toBe('clear');
    expect(game.kills).toBeGreaterThanOrEqual(100);
    expect(game.maxCombo).toBeGreaterThan(5);
    expect(game.player.hp).toBeGreaterThan(0);
    game.start();
    for (let frame = 0; frame < 180 * 60 && game.state === 'playing'; frame++) {
      tick(game);
      game.events.length = 0;
    }
    expect(game.result).toBe('over');
    expect(game.player.hp).toBe(0);
    game.returnToTitle();
    expect(game.state).toBe('title');
  });
  it('ends at the hundredth kill and freezes the result', () => {
    const game = makeGame(); parkEnemies(game);
    game.kills = 99; place(game.enemies[0], 0, -2);
    tick(game, { strong: true }); run(game, 0.5);
    expect(game.state).toBe('result'); expect(game.result).toBe('clear'); expect(game.kills).toBe(100);
    const time = game.elapsed; run(game, 1); expect(game.elapsed).toBe(time);
  });
  it('ends at zero HP and fully resets battle state, objects and timers on retry', () => {
    const game = makeGame(); parkEnemies(game);
    game.player.hp = 15; game.player.power = 72; game.kills = 42;
    place(game.enemies[0], 0, -1); game.enemies[0].cooldown = 0;
    run(game, 0.4);
    expect(game.state).toBe('result'); expect(game.result).toBe('over'); expect(game.player.dead).toBe(true);
    const references = [...game.enemies];
    game.start();
    expect(game.state).toBe('playing'); expect(game.result).toBeNull();
    expect(game.player.hp).toBe(1000); expect(game.player.power).toBe(0);
    expect(game.player.x).toBe(0); expect(game.player.z).toBe(0); expect(game.player.dead).toBe(false);
    expect(game.kills).toBe(0); expect(game.elapsed).toBe(0); expect(game.maxCombo).toBe(0);
    expect(game.attackSlots).toBe(0); expect(game.events).toHaveLength(0); expect(game.activeEnemies).toBe(20);
    expect(game.enemies.every((enemy, index) => enemy === references[index])).toBe(true);
    game.returnToTitle(); expect(game.state).toBe('title'); expect(game.activeEnemies).toBe(0);
  });
});
