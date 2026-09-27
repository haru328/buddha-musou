# IMPLEMENTATION_PHASES.md
# Codex実装フェーズ

一度に全機能を作らない。

各Phaseで必ず：

```text
Inspect
→ Implement
→ Typecheck
→ Test
→ Build
→ Browser Check
→ Commit
```

---

# Phase 0 — プロジェクト基盤

## 実装

- Vite
- TypeScript
- Three.js
- Vitest
- strict
- `src/`基本構成
- `index.html`
- `main.ts`
- 最低限Scene表示
- npm scripts

## 成功条件

```powershell
npm install
npm run typecheck
npm test
npm run build
```

成功。

`npm run dev` でブラウザにCanvasが表示。

## このPhaseで作らない

- Player gameplay
- Enemy
- Combat

## Commit例

```text
Phase 0: Three.jsプロジェクト基盤を構築
```

---

# Phase 1 — PlayerとCamera

## 実装

- Ground
- Procedural Buddha
- Halo
- Staff
- WASD
- Camera-relative movement
- rotation
- stage boundary
- ThirdPersonCamera
- resize
- InputManager

## テスト

最低：

- Player boundary helper
- GameState

## 手動確認

- W/S/A/D全方向
- Arrow keys
- Playerが場外へ出ない
- Cameraが安定追従
- resize OK

## 成功条件

「仏像をステージ内で自由に動かせる」

## Commit例

```text
Phase 1: 仏像プレイヤー移動と三人称カメラを実装
```

---

# Phase 2 — Enemy群集

## 実装

- Enemy Data
- Enemy State
- EnemyManager
- EnemyPool
- SpawnSystem
- Procedural Enemy
- chase
- separation
- SpatialHashGrid
- 20 initial
- 50 target
- max60
- attack slot基盤

## このPhaseでは

Enemy Damageはまだ必須ではない。

## テスト

- ObjectPool
- SpatialHash
- Spawn distance
- max enemy

## 手動確認

- 50体前後出る
- Playerへ寄る
- 一点完全重複しない
- 場外へ出ない

## 成功条件

「大量の落武者が仏像へ群がる」

## Commit例

```text
Phase 2: 落武者の群集AIとスポーンを実装
```

---

# Phase 3 — Combat

## 実装

- J 3段
- input buffer
- K strong
- attack radius/arc
- attack instance
- multi-hit prevention
- DamageSystem
- stagger
- knockback
- Enemy death
- Enemy recycle
- Player enemy attack
- Player HP
- hit invincibility
- ComboSystem

## テスト

- Damage
- Combo
- Multi-hit prevention
- Kill
- hit invincible

## 手動確認

- Jで敵が倒せる
- 3段が繋がる
- Kで5体以上まとめて吹き飛ばせる
- EnemyからDamageを受ける
- Enemy death後再spawn

## 成功条件

「戦闘として遊べる」

## Commit例

```text
Phase 3: 攻撃・ダメージ・吹き飛ばしを実装
```

---

# Phase 4 — 仏技 / HUD / Game Flow

## 実装

### Player
- Buddhist Power
- L Skill
- Dodge

### HUD
- HP
- 仏力
- COMBO
- Kills
- Controls

### Game Flow
- Title
- Start
- Pause
- Result
- Game Over
- Clear at 100 kills
- Retry
- Return Title

### Effects
- Slash
- Hit Flash
- Skill Ring
- death fade

## テスト

- Power
- Skill cost
- GameState
- Clear condition
- Restart reset

## 手動確認

最初から最後まで通しプレイ。

## 成功条件

```text
Title
→ Start
→ Combat
→ Skill
→ 100 Kills
→ Clear
→ Retry
```

が動く。

## Commit例

```text
Phase 4: 仏技・HUD・ゲーム進行を完成
```

---

# Phase 5 — 最適化 / プロトタイプ完成

## 実装・確認

- F3 Debug HUD
- FPS
- draw calls
- triangles
- 50 Enemy安定性
- allocation確認
- DOM更新確認
- Restart leak確認
- Chrome
- Edge
- 1280×720
- 1920×1080

必要なら：

- Enemy Renderer最適化
- InstancedMesh
- Effect数削減
- Shadow disable
- pixel ratio調整

## 最終コマンド

```powershell
npm run typecheck
npm test
npm run build
```

全部成功。

## Acceptance

`docs/ACCEPTANCE_TESTS.md` 全項目確認。

## Commit例

```text
Phase 5: プロトタイプ最終調整と動作確認
```

---

# 完成判定

Phase 5終了時点で、

```text
STATE: PROTOTYPE_COMPLETE
```

と報告できれば終了。

その後の3Dモデル、BGM等は別フェーズ。
