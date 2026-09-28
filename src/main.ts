import './style.css';
import { Game } from './game/Game';

const root = document.querySelector<HTMLElement>('#game-root');
const status = document.querySelector<HTMLElement>('#boot-status');
if (!root || !status) throw new Error('起動に必要な画面要素がありません。');

let game: Game | undefined;
try {
  game = new Game(root);
  game.start();
  status.textContent = '3D描画が起動しました';
} catch (error) {
  game?.dispose();
  status.setAttribute('role', 'alert');
  status.textContent = '3D画面を起動できませんでした。Chrome / EdgeのWebGL設定を確認し、再読み込みしてください。';
  console.error('3D画面の起動に失敗しました。', error);
}

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => game?.dispose());
}
