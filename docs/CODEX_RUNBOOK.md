# CODEX_RUNBOOK.md
# Codex作業ルール

---

# 1. 必ず最初に確認

```powershell
git status
git diff
git branch --show-current
```

既存変更を把握する。

---

# 2. 読むファイル

最低：

```text
GAME_SPEC.md
docs/TECH_DESIGN.md
docs/IMPLEMENTATION_PHASES.md
docs/ACCEPTANCE_TESTS.md
CONTRIBUTING.md
```

---

# 3. 1回に1Phase

一度にPhase 0～5を全部実装しない。

ユーザーまたは担当者が明示的に複数Phaseを依頼しない限り、
現在Phaseのみ。

---

# 4. スコープ外実装禁止

例：

Phase 2で、

- BGM
- Final Model
- Boss
- Mobile

を追加しない。

---

# 5. 破壊的Git操作禁止

禁止：

```text
git reset --hard
git clean -fd
git checkout -- .
```

共同開発者の変更を破棄しない。

---

# 6. Package追加

新Packageが必要なら理由を説明。

Three.js/Vitest以外の大型依存は原則追加しない。

---

# 7. 毎Phase Verify

```powershell
npm run typecheck
npm test
npm run build
```

---

# 8. Browser Check

可能な範囲でdev serverを起動。

Visual確認が必要で自身で完了できない場合：

```text
MANUAL CHECK REQUIRED:
- ...
```

と具体的に報告。

---

# 9. 報告フォーマット

```text
STATE: EXECUTED
PHASE: X

実装内容:
-

変更ファイル:
-

typecheck:
-

test:
-

build:
-

手動確認:
-

パフォーマンス:
-

既知の問題:
-

次Phase:
-
```

---

# 10. Prototype最終Phase

Phase 5終了時：

`docs/ACCEPTANCE_TESTS.md` を確認。

Critical Failureがあれば：

```text
STATE: REVISE
```

修正後再確認。

すべてOK：

```text
STATE: PROTOTYPE_COMPLETE
```

---

# 11. コード品質

- TypeScript strict
- `any`濫用しない
- 巨大Classを避ける
- LogicとRenderer分離
- balance値をconfigへ
- hot pathでallocationを減らす
- 意味のない抽象化は作らない

---

# 12. 最重要判断基準

迷った場合：

```text
遊べる
>
安定
>
爽快
>
性能
>
見た目
>
将来拡張
```

プロトタイプ完成を遅らせる過剰設計をしない。
