# TECH_DESIGN.md
# 技術詳細設計

本書は `GAME_SPEC.md` の実装上の補助資料。

---

## 1. モジュール責務

### Game

全体初期化とState管理。

```ts
class Game {
  initialize(): Promise<void>;
  startNewGame(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  returnToTitle(): void;
  dispose(): void;
}
```

GameへEnemy AIやDamage計算を直接書かない。

### GameLoop

- frame delta計算
- fixed update
- render呼出

### InputManager

- held
- pressedThisFrame
- releasedThisFrame

を管理。

### Player

Playerデータ・状態。

### PlayerController

移動と回避。

### PlayerCombat

Attack state、Combo chain、Skill発動。

### EnemyManager

全Enemy dataとPool/AI/Renderer連携。

### CombatSystem

Player attack → Enemy hit候補抽出 → Damage。

### DamageSystem

HP、Kill判定。

### ComboSystem

Combo値とtimeout。

### SpawnSystem

Active Enemy数維持。

### EffectManager

簡易Effect。

### HUD

EventBusを購読してDOM更新。

---

## 2. データと描画を分離

Playerの論理状態：

```ts
position
rotation
hp
state
power
```

PlayerRenderer：

```ts
Object3D
Material
visual animation
```

Enemyも同じ考え方。

将来GLBへ置換してもlogicは変更しない。

---

## 3. Fixed Update

```ts
const FIXED_DT = 1 / 60;
const MAX_FRAME_DELTA = 0.1;

let accumulator = 0;

function frame(now: number) {
  const delta = Math.min((now - previous) / 1000, MAX_FRAME_DELTA);
  previous = now;
  accumulator += delta;

  while (accumulator >= FIXED_DT) {
    game.fixedUpdate(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  game.render();
  requestAnimationFrame(frame);
}
```

完全一致実装でなくてもよい。

---

## 4. Input

`keydown` / `keyup` を一元管理。

ブラウザのSpace/Arrowスクロールをゲーム中のみpreventDefault。

UI入力中はゲームキーを奪わない。

---

## 5. Camera Movement Vector

```ts
camera.getWorldDirection(tmpForward);
tmpForward.y = 0;
tmpForward.normalize();

tmpRight.crossVectors(tmpForward, UP).normalize();
```

入力から移動Vector生成。

---

## 6. Enemy Separation

Spatial Hashから近傍のみ取得。

```ts
for each nearby enemy:
  delta = self - other
  if distance < radius:
     force += normalized(delta) * weight
```

Player追跡Vector + Separation。

SeparationはChaseより弱くする。

---

## 7. Attack Slot

EnemyManagerが：

```ts
currentAttackers: Set<number>
```

を持つ。

Slot数 < 6ならEnemy attack許可。

Enemy死亡/knockback/attack終了時は解放。

---

## 8. Spatial Hash

推奨内部：

```ts
Map<string, Set<number>>
```

プロトタイプ規模なら十分。

Hot pathで問題が出たらArray bucketへ最適化。

最初から過剰最適化しない。

---

## 9. Attack Query

```text
CombatSystem
→ spatialGrid.queryRadius()
→ candidate enemy ids
→ exact distance
→ arc test
→ already-hit check
→ DamageSystem
```

---

## 10. Arc判定

Player forwardとEnemy directionのdot。

```ts
const threshold = Math.cos(arcRadians / 2);

if (forward.dot(toEnemyNormalized) >= threshold) {
  hit
}
```

---

## 11. Attack Instance

PlayerCombat：

```ts
private nextAttackId = 1;
```

攻撃開始時：

```ts
const attackId = nextAttackId++;
```

CombatSystem：

```ts
Set<number> hitEnemyIds
```

をAttack session内で保持。

---

## 12. Knockback

Enemy Data：

```ts
velocity: Vector3
knockbackTimer: number
```

Knockback中はAI movement停止。

velocityで移動し、dragで減速。

---

## 13. Player Damage Invulnerability

Player：

```ts
hitInvincibleTimer
```

0より大きい間Damage無効。

Dodge invincibleと別管理でもよい。

---

## 14. Renderer

初期化：

```text
WebGLRenderer
Scene
Camera
Lights
Stage
```

サイズ変更：

```ts
renderer.setSize(width, height)
camera.aspect = width / height
camera.updateProjectionMatrix()
```

---

## 15. Procedural Hero

完成度は不要。

重要：

- Enemyと色で区別
- Haloで仏像と分かる
- Staffが見える
- 攻撃時にStaffが動く

---

## 16. Procedural Enemy

重要：

- dark color
- helmet
- sword
- Heroより小さめ

個体差は不要。

---

## 17. Effect

Slash：

Ring / Plane等。

Hit Flash：

small sprite / sphere。

Skill：

RingGeometryをscale up。

Death：

opacity低下。

---

## 18. DOM UI

Three.js Canvasと同じrootにoverlay。

```css
#game-root {
  position: relative;
}

canvas {
  display: block;
}

#ui-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
```

ボタンだけpointer-events有効。

---

## 19. State別UI

TITLE：
Game canvas背景は簡易Scene表示してよい。

PLAYING：
HUD。

PAUSED：
半透明overlay。

RESULT：
Result overlay。

---

## 20. メモリ

RestartごとにScene全破棄・再生成してもプロトタイプでは可だが、
Enemy Pool等が二重生成されないこと。

Event Listenerの多重登録に注意。

---

## 21. Dispose

Game disposeで最低：

- window listeners解除
- Input listeners解除
- animation loop停止
- Three resources dispose
- EventBus listeners解除

---

## 22. Error Handling

ModelやAudioはprototype必須でない。

WebGL initialization failureのみError Screen。

---

## 23. Debug

F3で：

```text
FPS
Enemies
Kills
Draw Calls
Triangles
```

1秒ごとに表示更新。

毎frameDOM更新しない。

---

## 24. Quality

Prototypeでは1 Qualityのみ。

追加Presetは完成後。

---

## 25. Browser Visibility

`document.visibilitychange` 時：

Tab非表示なら自動Pauseしてよい。

巨大deltaを防止。

---

## 26. TypeScript

`strict: true`

`any`濫用禁止。

Three.js型定義を利用。

---

## 27. テスト可能性

Three.js Objectをテストしなくてよい。

Pure logicをテスト可能にする。

例：

```ts
ComboSystem
ObjectPool
SpatialHashGrid
DamageSystem
```

---

## 28. 実装判断

仕様にない細部は、

1. シンプル
2. 保守しやすい
3. 動く
4. パフォーマンス上問題ない

順で選ぶ。

新しい大規模依存を追加しない。
