import {
  BoxGeometry,
  Color,
  DirectionalLight,
  GridHelper,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { GRAPHICS_CONFIG } from '../config/graphics';
import { GameLoop } from './GameLoop';

/** Phase 0では描画の起動と後片付けだけを担当する。 */
export class Game {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(
    GRAPHICS_CONFIG.camera.fov, 1,
    GRAPHICS_CONFIG.camera.near, GRAPHICS_CONFIG.camera.far,
  );
  private readonly preview = new Mesh(
    new BoxGeometry(2, 2, 2),
    new MeshStandardMaterial({ color: 0xd4a653, metalness: 0.45, roughness: 0.4 }),
  );
  private readonly grid = new GridHelper(20, 20, 0x716247, 0x343d3d);
  private readonly loop: GameLoop;
  private disposed = false;

  constructor(private readonly root: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.domElement.setAttribute('aria-label', '金色の立方体が回転する3D描画確認画面');
    this.renderer.domElement.setAttribute('role', 'img');
    this.scene.background = new Color(GRAPHICS_CONFIG.background);
    this.camera.position.set(6, 5, 9);
    this.camera.lookAt(0, 1, 0);
    this.preview.position.y = 1.5;

    const sunlight = new DirectionalLight(0xffe4b5, 3);
    sunlight.position.set(4, 8, 5);
    this.scene.add(new HemisphereLight(0xe2eeff, 0x4f4638, 2), sunlight, this.grid, this.preview);
    this.loop = new GameLoop(
      (dt) => { this.preview.rotation.y += GRAPHICS_CONFIG.previewRotationSpeed * dt; },
      () => { this.renderer.render(this.scene, this.camera); },
    );
    this.root.prepend(this.renderer.domElement);
    this.resize();
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  start(): void {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
    this.onVisibilityChange();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.loop.stop();
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.preview.geometry.dispose();
    this.preview.material.dispose();
    this.grid.dispose();
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private readonly resize = (): void => {
    const width = Math.max(this.root.clientWidth, 1);
    const height = Math.max(this.root.clientHeight, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GRAPHICS_CONFIG.maxPixelRatio));
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.loop.stop();
    else this.loop.start();
  };
}
