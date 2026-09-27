# 仏像無双（仮）
# プロトタイプ統合仕様書

Version: 1.0.0-prototype  
Status: Implementation Ready  
Target: Desktop Browser  
Source of Truth: 本ファイル

---

# 1. 目的

本仕様書の目的は、ブラウザで動作する無双風3Dアクションゲーム
「仏像無双（仮）」の**最低限遊べるプロトタイプ**を完成させることである。

完成版の品質は要求しない。

プロトタイプで検証するのは以下。

1. ブラウザ上で3Dアクションとして成立するか
2. 多数の敵を表示できるか
3. 複数敵を同時に吹き飛ばす爽快感が出るか
4. Three.js構成で今後拡張可能か
5. 共同開発可能なコード構造になっているか

---

# 2. コアコンセプト

プレイヤーは戦う仏像。

敵は大量の落武者。

プレイヤーが錫杖を振り、

```text
敵が群がる
↓
攻撃する
↓
複数体へ同時Hit
↓
落武者が大量に吹き飛ぶ
↓
COMBOが増える
↓
仏力が溜まる
↓
仏技で大量撃破
```

という流れを中心体験とする。

---

# 3. プロトタイプ完成条件

以下をすべて満たした時点でプロトタイプ完成とする。

## 起動

- `npm install` 成功
- `npm run dev` でゲーム起動
- Chromeで表示
- Edgeで表示
- consoleに進行不能エラーなし

## ゲームフロー

- タイトル画面
- ゲーム開始
- 戦闘
- ステージクリア
- ゲームオーバー
- 再挑戦
- タイトルへ戻る

## プレイヤー

- WASD移動
- J通常攻撃
- K強攻撃
- L仏技
- Space回避

## 敵

- 30体以上が同時出現
- 目標50体前後
- プレイヤーへ接近
- 簡易Separation
- 攻撃
- 被ダメージ
- 吹き飛ばし
- 死亡
- 再スポーン

## 戦闘

- 複数敵への同時Hit
- Knockback
- COMBO
- 仏力
- 仏技
- プレイヤーHP

## HUD

- HP
- 仏力
- COMBO
- 撃破数
- 操作説明

## 終了条件

- 100体撃破でクリア
- HP 0でゲームオーバー

## 品質

- 50体前後の敵との戦闘で30 FPS以上を目標
- `npm run typecheck` 成功
- `npm test` 成功
- `npm run build` 成功

---

# 4. プロトタイプで作らないもの

以下は明確にスコープ外。

- 完成版3Dモデル
- 完成版キャラクターアニメーション
- BGM
- 効果音
- ボイス
- 高品質パーティクル
- 豪華なメニュー
- ボス
- 複数ステージ
- アイテム
- 装備
- レベル
- スキルツリー
- ストーリー
- 会話
- セーブゲーム
- オンライン機能
- マルチプレイ
- ランキングサーバー
- スマートフォン操作
- ゲームパッド
- 課金
- 高度な物理
- NavMesh
- 布シミュレーション

「ついでに実装」は禁止する。

---

# 5. 技術スタック

使用：

- Vite
- TypeScript
- Three.js
- Vitest
- HTML
- CSS

使用しない：

- React
- Vue
- Angular
- Unity
- Unreal Engine
- Cannon.js等の重量級物理
- Backend
- Database

---

# 6. 対象ブラウザ

優先：

1. Google Chrome
2. Microsoft Edge

PCキーボード操作を前提とする。

---

# 7. 基準解像度

基準：

```text
1920 × 1080
```

最低確認：

```text
1280 × 720
```

Canvasはウィンドウ追従。

PixelRatio：

```ts
Math.min(window.devicePixelRatio, 1.5)
```

を初期値とする。

---

# 8. アセット方針

コンセプト資料：

```text
public/assets/concept/buddha-musou-gameplay-concept.png
public/assets/concept/buddha-hero-sheet.png
public/assets/concept/ochimusha-enemy-sheet.png
```

これらは**見た目の参考資料**。

ゲームへ直接3D表示する素材ではない。

プロトタイプではProcedural Geometryを使う。

---

# 9. プレイヤー外観

簡易仏像。

最低構成：

```text
Root
├─ Body
├─ Head
├─ LeftArm
├─ RightArm
├─ Legs
├─ Staff
└─ Halo
```

色：

- 金
- Bronze
- Dark Brown
- 赤布アクセント

Halo：

TorusGeometry。

Staff：

Cylinder + Torus等。

攻撃時は腕やStaff rootを回転させるだけでもよい。

---

# 10. 敵外観

簡易落武者。

最低構成：

```text
Root / Instance
├─ Body
├─ Head
├─ Helmet
└─ Sword
```

色：

- 黒
- Dark Gray
- Rust Brown
- Dark Red

完成版Skeleton Animationは不要。

---

# 11. ステージ

名称：

```text
荒廃した寺院
```

プロトタイプでは簡略化。

サイズ：

```text
70 × 70
```

プレイ可能範囲：

```text
X = -33 ～ +33
Z = -33 ～ +33
```

構成：

- Ground
- 外周の簡易柱
- 簡易鳥居
- 石灯籠風オブジェクト数個

中央戦闘域には移動を妨げる大型障害物を置かない。

---

# 12. GameState

```ts
type GameState =
  | 'boot'
  | 'title'
  | 'playing'
  | 'paused'
  | 'result';
```

状態：

```text
BOOT
↓
TITLE
↓
PLAYING
↓
RESULT
↓
TITLE / RETRY
```

ESC：

```text
PLAYING ↔ PAUSED
```

---

# 13. タイトル画面

最低表示：

```text
仏像無双（仮）

[ゲーム開始]

WASD 移動
J 攻撃
K 強攻撃
L 仏技
SPACE 回避
```

Enterまたはボタンで開始。

---

# 14. Player Config

初期値：

```ts
export const PLAYER_CONFIG = {
  maxHp: 1000,
  moveSpeed: 8,
  rotationSpeed: 12,

  dodgeSpeed: 16,
  dodgeDuration: 0.30,
  dodgeInvincibleDuration: 0.25,
  dodgeCooldown: 0.50,

  hitInvincibleDuration: 0.35,

  buddhistPowerMax: 100,
};
```

---

# 15. Player State

```ts
type PlayerState =
  | 'idle'
  | 'move'
  | 'attack'
  | 'strongAttack'
  | 'skill'
  | 'dodge'
  | 'stagger'
  | 'dead';
```

---

# 16. 操作

```text
W / ↑     前
S / ↓     後
A / ←     左
D / →     右

J         通常攻撃
K         強攻撃
L         仏技
Space     回避
Esc       Pause
F3        Debug表示
```

---

# 17. 移動

カメラ基準移動。

Wは画面奥。

移動方向へPlayerを回転。

Stage境界を超えない。

---

# 18. 通常攻撃

J。

3段コンボ。

バランス：

```ts
export const NORMAL_ATTACKS = [
  {
    damage: 40,
    radius: 3.0,
    arcDeg: 110,
    knockback: 3,
  },
  {
    damage: 55,
    radius: 3.5,
    arcDeg: 130,
    knockback: 4,
  },
  {
    damage: 80,
    radius: 4.5,
    arcDeg: 170,
    knockback: 8,
  },
];
```

3段目は特に広くする。

---

# 19. 攻撃タイミング

厳密な格闘ゲームタイミングは不要。

参考：

```text
Attack 1 total ≒ 0.45 sec
Attack 2 total ≒ 0.48 sec
Attack 3 total ≒ 0.60 sec
```

入力Buffer：

```ts
0.25 sec
```

攻撃中にJが押されたら次段を予約できる。

---

# 20. 強攻撃

K。

全周囲に近い攻撃。

```ts
export const STRONG_ATTACK = {
  damage: 120,
  radius: 6,
  knockback: 12,
  cooldown: 1.2,
};
```

一度に5～10体以上Hitできる状況を作る。

---

# 21. 仏技

L。

名称：

```text
仏光陣
```

仏力100で発動。

```ts
export const BUDDHA_SKILL = {
  damage: 300,
  radius: 12,
  knockback: 20,
  powerCost: 100,
};
```

周囲の敵を一気に外方向へ吹き飛ばす。

---

# 22. 仏力

Hit：

```text
+2
```

Kill：

```text
+3
```

最大：

```text
100
```

Skill発動で0。

---

# 23. 回避

Space。

移動入力方向へdash。

入力なしならPlayer前方。

```ts
duration = 0.30
invincible = 0.25
cooldown = 0.50
```

---

# 24. Enemy Config

```ts
export const ENEMY_CONFIG = {
  maxHp: 100,
  moveSpeedMin: 2.2,
  moveSpeedMax: 3.2,

  attackDamage: 15,
  attackDistance: 1.8,

  attackIntervalMin: 1.5,
  attackIntervalMax: 2.5,

  separationRadius: 1.2,
};
```

---

# 25. Enemy State

```ts
type EnemyState =
  | 'spawn'
  | 'chase'
  | 'attack'
  | 'stagger'
  | 'knockback'
  | 'dead';
```

---

# 26. Enemy AI

基本：

```text
Spawn
↓
Chase
↓
Attack
↓
Cooldown
↓
Chase
```

被Hit：

```text
Stagger / Knockback
```

HP 0：

```text
Dead
```

---

# 27. 敵追跡

Playerへ直線的に接近。

NavMesh不要。

```ts
desiredVelocity = directionToPlayer * speed;
```

---

# 28. Separation

近いEnemy同士を軽く離す。

全Enemy総当たりは禁止。

Spatial Hashを使用。

---

# 29. Enemy Attack Slot

同時に攻撃できるEnemy数：

```ts
MAX_ATTACKERS = 6;
```

Attack Slotが取れないEnemyはPlayer周囲へ接近するだけ。

100体が同時に殴る状態を防ぐ。

---

# 30. Enemy Attack

距離：

```text
1.8以下
```

でAttack候補。

予備動作：

```text
0.35 sec
```

Hit時にPlayerが無敵でなければDamage。

---

# 31. Spawn

初期：

```text
20体
```

目標：

```text
50体
```

最大：

```text
60体
```

プロトタイプでは50体前後を正式目標とする。

設定：

```ts
export const SPAWN_CONFIG = {
  initialEnemies: 20,
  targetEnemies: 50,
  maxEnemies: 60,

  minSpawnDistance: 14,
  maxSpawnDistance: 28,

  spawnBatch: 5,
  interval: 1,
};
```

---

# 32. クリア条件

プロトタイプでは：

```ts
CLEAR_KILLS = 100;
```

100体撃破でクリア。

完成版MVPでは300へ増加可能。

---

# 33. 敗北条件

Player HP 0。

```text
GAME OVER
```

---

# 34. Combo

Hit数＝Combo増加数。

同時10体Hit：

```text
+10 COMBO
```

維持：

```text
3 sec
```

Hitなし3秒で0。

---

# 35. Attack Hit判定

見た目のMeshとの厳密衝突は行わない。

XZ平面上の範囲判定。

通常：

```text
Radius + Arc
```

強攻撃：

```text
Radius
```

Skill：

```text
Large Radius
```

---

# 36. 多重Hit防止

Attackごとに：

```ts
attackInstanceId
```

を発行。

同じAttack Instanceから同じEnemyへ1回だけHit。

---

# 37. Knockback

敵に水平velocityを加える。

```ts
velocity += direction * knockbackPower;
```

減衰させる。

視覚的に少しY方向へ上がる演出は任意。

---

# 38. Enemy Death

HP 0：

1. AI停止
2. SpatialHash除外
3. Kill Count++
4. Comboは既存Hitで加算済み
5. 仏力加算
6. 0.8秒程度吹き飛ぶ/縮小
7. 非表示
8. Poolへ返却

---

# 39. Object Pool

Enemyを毎回new/deleteしない。

初期Pool：

```text
60～80
```

を確保。

死亡後に再利用。

---

# 40. Spatial Hash Grid

Cell size：

```ts
4
```

用途：

- Enemy Separation
- Attack候補検索

API例：

```ts
insert(id, x, z)
update(id, x, z)
remove(id)
queryRadius(x, z, radius, output)
clear()
```

`queryRadius` は再利用Arrayを受け取る方式推奨。

---

# 41. Enemy描画

可能な範囲でInstancedMesh。

最低：

```text
body
head
helmet
weapon
```

ただし実装複雑度が高くPhaseを止める場合は、
Phase 2ではGroup方式で開始し、
Phase 4でInstancedMeshへ移行してよい。

最終プロトタイプでは50体で30fps以上を満たすこと。

---

# 42. Lighting

最低：

- HemisphereLight
- DirectionalLight

EnemyごとのLightは禁止。

---

# 43. Shadow

プロトタイプでは任意。

重い場合は無効。

ShadowよりFPSを優先。

---

# 44. Camera

三人称。

Offset：

```ts
new THREE.Vector3(0, 8, 12)
```

LookTarget：

```text
Player + Y 2
```

Smooth follow。

---

# 45. HUD

最低表示：

左上：

```text
HP
仏力
```

右：

```text
COMBO
```

上または右上：

```text
撃破 32 / 100
```

左下：

```text
WASD 移動
J 攻撃
K 強攻撃
L 仏技
SPACE 回避
```

MiniMapはプロトタイプでは**任意**。

完成条件には含めない。

---

# 46. 仏技表示

仏力100：

```text
[L] 仏光陣 発動可能
```

100未満：

```text
[L] 仏光陣
```

---

# 47. 最低エフェクト

必要：

- 通常攻撃：金色Arc
- 強攻撃：大きな金色Arc
- Hit：小さいFlash
- Skill：Ring
- Enemy death：Fade / Smoke風

高品質Particleは不要。

---

# 48. エフェクト実装

Three.js標準Geometry / Material。

外部Particle library不要。

再利用できるものはPool。

---

# 49. Hit Stop

必須ではないが推奨。

強攻撃で：

```text
30～50 ms
```

Skill：

```text
最大60 ms
```

大量Hit数に比例して増やさない。

---

# 50. Camera Shake

推奨。

通常Attack：

なし～極小。

強攻撃：

小。

Skill：

中。

酔うほど揺らさない。

---

# 51. Game Loop

ゲーム全体で1本。

```ts
requestAnimationFrame(loop)
```

Enemy個別loop禁止。

固定Update推奨：

```ts
FIXED_DT = 1 / 60
MAX_FRAME_DELTA = 0.1
```

---

# 52. Update順

```text
Input
↓
Player
↓
Enemy AI
↓
Spatial Hash
↓
Combat
↓
Knockback
↓
Spawn
↓
Effects
↓
Camera
↓
HUD
↓
Render
```

---

# 53. EventBus

UI更新等に使用。

最低イベント：

```ts
interface GameEvents {
  'player:hpChanged': { hp: number; maxHp: number };
  'player:powerChanged': { value: number; max: number };
  'enemy:killed': { totalKills: number };
  'combo:changed': { combo: number };
  'game:stateChanged': { state: GameState };
  'game:clear': { kills: number; maxCombo: number; time: number };
  'game:over': { kills: number; maxCombo: number; time: number };
}
```

Enemy位置更新等はEvent化しない。

---

# 54. ディレクトリ

```text
src/
├─ main.ts
├─ game/
│  ├─ Game.ts
│  ├─ GameLoop.ts
│  └─ GameState.ts
├─ config/
│  ├─ balance.ts
│  └─ graphics.ts
├─ core/
│  ├─ InputManager.ts
│  ├─ EventBus.ts
│  ├─ SpatialHashGrid.ts
│  └─ ObjectPool.ts
├─ player/
│  ├─ Player.ts
│  ├─ PlayerController.ts
│  ├─ PlayerCombat.ts
│  └─ PlayerRenderer.ts
├─ enemy/
│  ├─ Enemy.ts
│  ├─ EnemyManager.ts
│  ├─ EnemyAI.ts
│  ├─ EnemyPool.ts
│  └─ EnemyRenderer.ts
├─ combat/
│  ├─ CombatSystem.ts
│  ├─ DamageSystem.ts
│  └─ ComboSystem.ts
├─ world/
│  ├─ Stage.ts
│  ├─ StageBuilder.ts
│  └─ SpawnSystem.ts
├─ camera/
│  └─ ThirdPersonCamera.ts
├─ effects/
│  └─ EffectManager.ts
├─ ui/
│  ├─ HUD.ts
│  ├─ TitleScreen.ts
│  ├─ PauseScreen.ts
│  └─ ResultScreen.ts
└─ utils/
   ├─ math.ts
   └─ performance.ts
```

---

# 55. Balance Config

値を各Classへ直接埋め込まない。

`src/config/balance.ts` に集約。

---

# 56. Performance禁止事項

禁止：

- EnemyごとのrequestAnimationFrame
- EnemyごとのDOM
- EnemyごとのRaycaster
- O(n²)Enemy全探索
- GameLoop内大量new Vector3
- Enemy死亡ごとのGeometry dispose
- 毎frame大量DOM更新
- EnemyごとのPointLight

---

# 57. Debug HUD

F3。

最低：

```text
FPS
Active Enemies
Kills
Draw Calls
Triangles
```

`renderer.info`を使用。

---

# 58. テスト対象

Vitest。

最低：

- GameState
- ObjectPool
- SpatialHashGrid
- ComboSystem
- DamageSystem
- BuddhistPower
- SpawnSystem
- Attack多重Hit防止

---

# 59. npm scripts

最低：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

構成に合わせて変更可。

---

# 60. Result

クリア：

```text
成仏完了

撃破数 100
最大COMBO 128
戦闘時間 02:35

[再挑戦]
[タイトルへ]
```

Game Over：

```text
力尽きた……

撃破数 42
最大COMBO 61

[再挑戦]
[タイトルへ]
```

---

# 61. Restart

Restart時に必ずリセット：

- Player HP
- Player position
- Player state
- 仏力
- Combo
- Kill count
- Timers
- Enemy active状態
- EnemyPool
- Effects
- Attack slots
- Result
- Elapsed Time

前Battleの状態を残さない。

---

# 62. プロトタイプPhase

プロトタイプは6 Phaseで完成させる。

```text
Phase 0 基盤
Phase 1 Player
Phase 2 Enemy
Phase 3 Combat
Phase 4 Skill / HUD / Game Flow
Phase 5 Optimization / Final Verification
```

詳細は `docs/IMPLEMENTATION_PHASES.md`。

---

# 63. 最終Acceptance

最終確認：

```text
TITLE
↓
START
↓
PLAYER MOVE
↓
50 ENEMIES
↓
J COMBO
↓
K MASS KNOCKBACK
↓
POWER 100
↓
L BUDDHA SKILL
↓
100 KILLS
↓
CLEAR
↓
RETRY
```

これが一連で動けばプロトタイプ完成。

---

# 64. 仕様凍結

プロトタイプ完成までは以下を変更しない。

- Stack
- 操作キー
- 基本Game Loop
- 100 Kill Clear
- 50 Enemy target
- 仏像 vs 落武者
- J/K/L/Space

見た目、数値、色、名称微調整は可能。

---

# 65. 完成後

プロトタイプ完成後、別Issue / 別仕様として：

- 正式3Dアセット
- Animation
- BGM / SE
- UI polish
- 100体以上
- MiniMap
- ボス
- 敵種類
- ステージ追加

へ進む。

---

# 66. 最重要原則

「機能を増やす」より、

**最初から最後まで一度プレイできること**

を優先する。

プロトタイプの価値は機能数ではなく、

```text
遊べる
+
爽快感がある
+
拡張できる
+
壊れていない
```

ことである。
