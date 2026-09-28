# 仏像無双（仮）プロトタイプ仕様一式

このリポジトリは、ブラウザで動作する「仏像 vs 落武者」の無双風3Dアクションゲームを、
**最低限遊べるプロトタイプまで完成させること**を目的とした仕様パッケージです。

## 現在の実装：Phase 0

Vite / TypeScript strict / Three.js / Vitestの開発基盤を実装済みです。
起動すると金色の立方体が回転する3D描画確認画面を表示します。
Player / Enemy / Combatは未実装です。

## 開発環境と起動

Node.js 22.12以上（推奨：Node.js 24 LTS）とnpmを用意してください。
リポジトリのルートで実行します。

```powershell
npm install
npm run dev
```

ターミナルに表示されたURL（通常は `http://127.0.0.1:5173`）をChrome / Edgeで開きます。
「3D描画が起動しました」と金色の立方体が表示されれば起動成功です。
サーバーは `Ctrl+C` で停止できます。

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

ビルド結果は `dist/` に出力されます。`npm run preview` で本番ビルドをローカル確認できます。
再現可能な依存インストールには、コミット済みの `package-lock.json` と `npm ci` を使用してください。
WebGLが利用できない場合は、画面に起動失敗メッセージを表示します。

### Phase 0の構成

- `src/main.ts`：起動、エラー表示、開発時の再読み込み時の後片付け
- `src/game/Game.ts`：Scene / Camera / Light / 確認用Meshとリサイズ処理
- `src/game/GameLoop.ts`：単一の描画ループ、1/60秒の固定更新、最大delta 0.1秒
- `src/config/graphics.ts`：描画・ループ設定（PixelRatio上限1.5）
- `src/style.css`：Canvasと最小限の案内表示
- `tests/GameLoop.test.ts`：多重起動防止、固定更新、長時間停止、停止・再開のテスト

非表示タブではループを停止し、表示時に時刻をリセットして再開します。
他の基本ディレクトリは、各Phaseの実装用に確保しています。

## 最初に読む順番

1. `GAME_SPEC.md`
2. `docs/TECH_DESIGN.md`
3. `docs/IMPLEMENTATION_PHASES.md`
4. `docs/ACCEPTANCE_TESTS.md`
5. `docs/CODEX_RUNBOOK.md`
6. `CONTRIBUTING.md`

Codexに最初に渡す指示は `CODEX_START.md` にあります。

## 今回のゴール

完成版ではありません。

プロトタイプでは次ができれば完成です。

- タイトル画面からゲーム開始
- 仏像キャラクターをWASDで操作
- 落武者が多数出現してプレイヤーへ接近
- Jで通常攻撃
- Kで強攻撃
- Lで仏技
- Spaceで回避
- 複数の敵が同時に吹き飛ぶ
- HP / 仏力 / COMBO / 撃破数を表示
- 一定数撃破でステージクリア
- HP 0でゲームオーバー
- 再挑戦可能
- Chrome / Edgeで動作
- npm build / test / typecheck成功

## プロトタイプでは後回し

- 完成版3Dモデル
- モーションキャプチャ品質のアニメーション
- BGM
- 効果音
- ボイス
- 豪華なUI
- 複数ステージ
- ボス
- レベルアップ
- スキルツリー
- 装備
- ストーリー
- スマホ対応
- オンライン

現在のキャラクター画像はデザイン参考資料です。
プロトタイプではThree.jsのGeometryを組み合わせた簡易3Dキャラクターを使用します。

## 技術

- Vite
- TypeScript
- Three.js
- Vitest
- HTML
- CSS

React / Vue / Unity WebGL / 重量級物理エンジンは使いません。

## GitHubへ登録

空のGitHubリポジトリを作成後、PowerShellで：

```powershell
git init
git add .
git commit -m "仏像無双プロトタイプの仕様一式を追加"
git branch -M main
git remote add origin <GitHubリポジトリURL>
git push -u origin main
```

共同開発ルールは `CONTRIBUTING.md` を参照してください。
