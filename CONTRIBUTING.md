# CONTRIBUTING

## GitHub共同開発方針

`main` は常に動作確認済みの状態を維持します。原則として `main` へ直接pushせず、機能ブランチ + Pull Requestで統合します。

## ブランチ

- `feature/<内容>`：新機能
- `fix/<内容>`：不具合修正
- `docs/<内容>`：文書のみ

例：

```text
feature/player-controller
feature/enemy-ai
fix/combo-reset
```

## 作業開始

```powershell
git switch main
git pull
git switch -c feature/作業名
```

## コミット

コミットメッセージは日本語を基本とします。

```text
Phase 1: プレイヤー移動を実装
落武者の追跡AIを追加
強攻撃のノックバックを修正
```

無関係な変更を1コミットへ混ぜないでください。

## Pull Request

PRへ以下を記載します。

- 実装内容
- 主な変更ファイル
- 動作確認内容
- `npm run typecheck` 結果
- `npm test` 結果
- `npm run build` 結果
- 既知の問題
- 見た目変更時のスクリーンショット

## Codex利用時

作業開始前に必ず：

```text
git status
git diff
```

を確認します。

禁止：

```text
git reset --hard
git clean -fd
```

共同開発者の未コミット変更や無関係な変更を破棄・revertしないこと。

## Phase運用

`GAME_SPEC.md` のPhase単位で作業します。

1. 現状確認
2. 実装
3. typecheck
4. test
5. build
6. 動作確認
7. コミット
8. Pull Request

## 大容量アセット

GLB、FBX、高解像度テクスチャ、WAV等が増えた場合はGit LFSを検討します。現時点のコンセプト画像3点は通常のGit管理で構いません。
