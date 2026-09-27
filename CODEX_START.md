# Codex 初回実装指示

`GAME_SPEC.md` と `CONTRIBUTING.md` を最初に全文確認してください。

## GOAL

`GAME_SPEC.md` に記載された「仏像無双（仮）」を実装する。今回は **Phase 0のみ** 実施する。Phase 1以降のゲーム本体はまだ実装しない。

## 開始前

必ず以下を確認する。

```text
git status
git diff
```

既存の未コミット変更や共同開発者の変更を破棄しない。

## Phase 0 TASK

1. workspaceを確認する。
2. 既存ファイルを確認する。
3. Vite + TypeScript + Three.jsの基盤を作る。
4. Vitestをセットアップする。
5. TypeScript strictを有効にする。
6. `npm run typecheck` を追加する。
7. `npm test` を追加する。
8. `npm run build` を成功させる。
9. 必要なPhase 0ファイルのみ作る。
10. READMEへ実際の起動方法を反映する。
11. Phase 1以降は実装しない。

## CONSTRAINTS

- React/Vueを使用しない。
- 重量級物理エンジンを追加しない。
- 不要な依存を追加しない。
- Windows 11 / PowerShellで扱えること。
- `git reset --hard` 等の破壊的操作禁止。
- 無関係な変更をrevertしない。
- コミットメッセージは日本語。

## VERIFY

```text
npm run typecheck
npm test
npm run build
```

すべて成功させる。

## REPORT FORMAT

```text
STATE:
PHASE:

実装内容:
-

変更ファイル:
-

テスト:
-

Build:
-

動作確認:
-

既知の問題:
-

次Phase:
-
```
