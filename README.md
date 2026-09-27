# 仏像無双（仮）

ブラウザで動作する、仏像が大量の落武者をなぎ倒す3D群集アクションゲームです。

## コンセプト

- プレイヤー：仏像戦士
- 敵：落武者
- ジャンル：無双風3D群集アクション
- 対象：PCブラウザ
- 技術方針：Vite + TypeScript + Three.js
- MVP：100体前後の敵と同時戦闘し、300体撃破でステージクリア

## 重要ファイル

- `GAME_SPEC.md` — Codex実装用の基本仕様・詳細設計
- `CODEX_START.md` — Codexへ最初に渡す指示
- `CONTRIBUTING.md` — GitHub共同開発ルール
- `docs/ASSET_GUIDE.md` — アセット運用ルール
- `public/assets/concept/` — コンセプト画像3点

## コンセプトアセット

- `buddha-musou-gameplay-concept.png` — ゲーム画面イメージ
- `buddha-hero-sheet.png` — 仏像戦士設定資料
- `ochimusha-enemy-sheet.png` — 落武者設定資料

現在の画像は3Dモデルではなく**デザイン資料**です。MVPではThree.jsのGeometryによる簡易モデルでゲーム性を完成させ、後からGLBへ置換できる構造にします。

## GitHubへ最初にアップする手順

GitHub側では、READMEや.gitignoreを自動生成せず**空のリポジトリ**を作成するのが簡単です。

PowerShell：

```powershell
cd C:\任意の場所\buddha-musou

git init
git add .
git commit -m "初期仕様書とコンセプトアセットを追加"
git branch -M main
git remote add origin <GitHubリポジトリURL>
git push -u origin main
```

## 開発開始

Codexにはまず `GAME_SPEC.md` と `CONTRIBUTING.md` を読ませ、`CODEX_START.md` の指示で**Phase 0のみ**実行させてください。

## ライセンス

現時点では未決定です。公開リポジトリにする場合は、コード・生成アセットを含めたライセンス方針を共同開発者間で決定してから `LICENSE` を追加してください。
