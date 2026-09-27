# 仏像無双（仮）プロトタイプ仕様一式

このリポジトリは、ブラウザで動作する「仏像 vs 落武者」の無双風3Dアクションゲームを、
**最低限遊べるプロトタイプまで完成させること**を目的とした仕様パッケージです。

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
