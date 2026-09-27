# CODEX_START.md
# Codex 初回指示

以下の仕様を読んでください。

- `GAME_SPEC.md`
- `docs/TECH_DESIGN.md`
- `docs/IMPLEMENTATION_PHASES.md`
- `docs/ACCEPTANCE_TESTS.md`
- `docs/CODEX_RUNBOOK.md`
- `CONTRIBUTING.md`

このプロジェクトのゴールは、
**仏像無双（仮）の最低限遊べるブラウザプロトタイプをPhase 0～5で完成させること**です。

完成版Asset、BGM、SE、Boss等は今回のスコープ外です。

まず今回は **Phase 0のみ** 実施してください。

開始前：

```text
git status
git diff
git branch --show-current
```

を確認してください。

Phase 0:

- Vite
- TypeScript
- Three.js
- Vitest
- TypeScript strict
- 基本ディレクトリ
- Three.js Canvas起動
- npm scripts
- READMEの起動手順確認

Phase 1以降のPlayer/Enemy/Combatはまだ実装しないでください。

終了時：

```powershell
npm run typecheck
npm test
npm run build
```

を実行してください。

コミットメッセージは日本語。

報告：

```text
STATE: EXECUTED
PHASE: 0

実装内容:
変更ファイル:
typecheck:
test:
build:
手動確認:
既知の問題:
次Phase:
```
