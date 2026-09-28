import { Color, DirectionalLight, Fog, HemisphereLight, Scene, WebGLRenderer } from 'three';
import { GRAPHICS_CONFIG } from '../config/graphics';
import { InputManager } from '../core/InputManager';
import { Stage } from '../world/Stage';
import { PlayerRenderer } from '../player/PlayerRenderer';
import { EnemyRenderer } from '../enemy/EnemyRenderer';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { EffectManager } from '../effects/EffectManager';
import { GameUI } from '../ui/GameUI';
import type { PerformanceStats } from '../ui/GameUI';
import { GameSession } from './GameSession';
import { GameLoop } from './GameLoop';

/** 入力・純粋な戦闘ロジック・描画を接続する。 */
export class Game {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new ThirdPersonCamera();
  private readonly session = new GameSession();
  private readonly stage = new Stage();
  private readonly hero = new PlayerRenderer();
  private readonly enemies = new EnemyRenderer();
  private readonly effects = new EffectManager();
  private readonly input: InputManager;
  private readonly ui: GameUI;
  private readonly loop: GameLoop;
  private readonly command = { moveX: 0, moveZ: 0, attack: false, strong: false, skill: false, dodge: false };
  private readonly stats: PerformanceStats = { fps: 0, drawCalls: 0, triangles: 0, geometries: 0 };
  private uiTimer = 0;
  private frames = 0;
  private statsTime = performance.now();
  private disposed = false;
  private visualTime = 0;

  constructor(private readonly root: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.domElement.setAttribute('aria-label', '仏像と落武者が戦う荒廃した寺院');
    this.renderer.domElement.setAttribute('role', 'img');
    this.scene.background = new Color(GRAPHICS_CONFIG.background);
    this.scene.fog = new Fog(GRAPHICS_CONFIG.background, GRAPHICS_CONFIG.fogNear, GRAPHICS_CONFIG.fogFar);
    const sunlight = new DirectionalLight(0xffdfaa, 3);
    sunlight.position.set(-12, 22, 10);
    this.scene.add(new HemisphereLight(0xd7e8df, 0x30392a, 2), sunlight, this.stage, this.hero, this.enemies, this.effects);
    this.camera.follow(0, 0, 0, true);
    this.input = new InputManager(() => this.session.state === 'playing');
    const uiRoot = root.querySelector<HTMLElement>('#ui-root');
    if (!uiRoot) throw new Error('UIの表示領域がありません。');
    this.ui = new GameUI(uiRoot, {
      start: this.newBattle,
      pause: () => this.pause(),
      resume: () => this.resume(),
      title: () => this.returnToTitle(),
    });
    this.loop = new GameLoop(this.update, this.render);
    root.prepend(this.renderer.domElement);
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.updateVisuals(0);
    this.ui.update(this.session, this.stats);
  }

  start(): void {
    if (this.disposed) return;
    this.render();
    if (!document.hidden) this.loop.start();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.loop.stop();
    this.input.dispose();
    this.ui.dispose();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.stage.dispose();
    this.hero.dispose();
    this.enemies.dispose();
    this.effects.dispose();
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private readonly newBattle = (): void => {
    this.session.start();
    this.resetVisuals();
    this.ui.update(this.session, this.stats);
  };

  private resetVisuals(): void {
    this.input.clear();
    this.effects.reset();
    this.hero.reset();
    this.visualTime = 0;
    this.camera.follow(this.session.player.x, this.session.player.z, 0, true);
    this.updateVisuals(0);
  }

  private pause(): void {
    this.session.pause();
    this.input.clear();
    this.ui.update(this.session, this.stats);
  }

  private resume(): void {
    this.session.resume();
    this.input.clear();
    this.ui.update(this.session, this.stats);
  }

  private returnToTitle(): void {
    this.session.returnToTitle();
    this.resetVisuals();
    this.ui.update(this.session, this.stats);
  }

  private readonly update = (dt: number): void => {
    if (this.input.consume('F3')) this.ui.toggleDebug();
    if (this.input.consume('Escape')) {
      if (this.session.state === 'playing') this.pause();
      else if (this.session.state === 'paused') this.resume();
    }
    if (this.input.consume('Enter') && (this.session.state === 'title' || this.session.state === 'result')) this.newBattle();
    this.command.moveX = Number(this.input.isDown('KeyD', 'ArrowRight')) - Number(this.input.isDown('KeyA', 'ArrowLeft'));
    this.command.moveZ = Number(this.input.isDown('KeyS', 'ArrowDown')) - Number(this.input.isDown('KeyW', 'ArrowUp'));
    this.command.attack = this.input.consume('KeyJ');
    this.command.strong = this.input.consume('KeyK');
    this.command.skill = this.input.consume('KeyL');
    this.command.dodge = this.input.consume('Space');
    this.session.update(dt, this.command);
    this.input.endFrame();

    for (const event of this.session.events) {
      if (event.kind === 'playerHit') this.camera.shake(0.12);
      else this.effects.emit(event.kind, event.x, event.z, event.rotation);
      if (event.kind === 'strong') this.camera.shake(0.15);
      if (event.kind === 'skill') this.camera.shake(0.3);
    }
    this.session.events.length = 0;
    if (this.session.state !== 'paused') {
      this.visualTime += dt;
      this.updateVisuals(dt);
    }
    this.uiTimer += dt;
    if (this.uiTimer >= 0.1) {
      this.uiTimer = 0;
      this.ui.update(this.session, this.stats);
    }
  };

  private updateVisuals(dt: number): void {
    this.hero.update(dt, this.session.player);
    this.enemies.update(this.session.enemies, this.visualTime);
    this.effects.update(dt);
    if (this.session.state === 'title') {
      this.hero.rotation.y = 0.4;
      this.camera.position.set(6, 4.5, 9);
      this.camera.lookAt(-2.5, 1.7, 0);
    } else {
      this.camera.follow(this.session.player.x, this.session.player.z, dt);
    }
  }

  private readonly render = (): void => {
    this.renderer.render(this.scene, this.camera);
    this.frames++;
    const now = performance.now();
    if (now - this.statsTime >= 1000) {
      this.stats.fps = Math.round(this.frames * 1000 / (now - this.statsTime));
      this.stats.drawCalls = this.renderer.info.render.calls;
      this.stats.triangles = this.renderer.info.render.triangles;
      this.stats.geometries = this.renderer.info.memory.geometries;
      this.frames = 0;
      this.statsTime = now;
    }
  };

  private readonly resize = (): void => {
    const width = Math.max(this.root.clientWidth, 1);
    const height = Math.max(this.root.clientHeight, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GRAPHICS_CONFIG.maxPixelRatio));
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  private readonly onBlur = (): void => {
    if (this.session.state === 'playing') this.pause();
  };

  private readonly onVisibilityChange = (): void => {
    this.input.clear();
    if (document.hidden) {
      this.onBlur();
      this.loop.stop();
    } else {
      this.frames = 0;
      this.statsTime = performance.now();
      this.loop.start();
    }
  };
}
