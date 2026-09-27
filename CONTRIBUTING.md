# CONTRIBUTING.md
# GitHub共同開発ルール

## Branch

`main` は動作確認済みのみ。

作業：

```text
feature/phase-1-player
feature/phase-2-enemy
feature/combat
fix/knockback
```

## 作業開始

```powershell
git switch main
git pull
git switch -c feature/作業名
```

## Commit

日本語。

例：

```text
Phase 2: 落武者の追跡AIを実装
強攻撃の吹き飛ばしを修正
```

## Pull Request

PRへ最低：

- 実装内容
- 変更ファイル
- typecheck
- test
- build
- 手動確認
- 既知問題

## main直接push

原則避ける。

## Conflict

相手の変更を勝手に捨てない。

## Codex

作業開始前：

```text
git status
git diff
git branch --show-current
```

## Prototype中

仕様外の機能追加を避ける。

ゲームが最後まで動くことを優先。
