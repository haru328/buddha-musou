# 仏像無双（仮）
## ブラウザ3Dアクションゲーム 基本仕様書・詳細設計書

Version: 0.1.0  
Status: MVP設計  
Target: Desktop Browser  
Implementation: Codex

---

# 1. ゲームコンセプト

多数の落武者を、プレイヤーである戦う仏像が豪快になぎ倒すブラウザ3D群集アクション。

核となる体験：

- 大量の敵に囲まれる
- 一回の攻撃で複数の敵を吹き飛ばす
- COMBOを伸ばす
- 仏力を溜める
- 仏技で大量の敵を一掃する
- URLを開けばすぐ遊べる

既存の無双系作品の爽快感を参考にするが、既存作品のキャラクター・マップ・UI・名称・音声・画像・ゲームデータをコピーしない。

---

# 2. MVP

第一目標：**仏像を操作し、100体前後の落武者と戦い、300体倒すとステージクリア**。

優先順位：

1. 操作感
2. 大量敵表示
3. 攻撃の爽快感
4. パフォーマンス
5. UI
6. グラフィック
7. 細かな演出

---

# 3. 技術

使用：

- Vite
- TypeScript
- Three.js
- HTML/CSS
- Vitest

MVPで使用しない：

- React / Vue / Angular
- Unity WebGL / Unreal Engine
- 重量級物理エンジン
- サーバーサイド
- DB

UIはHTML/CSS、3DのみThree.js。

---

# 4. 対象環境

- Chrome
- Edge
- PCブラウザ優先
- 基準1920×1080
- 最低1280×720

Pixel ratio：

```ts
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

---

# 5. パフォーマンス

- 目標60 FPS
- 最低30 FPS
- 通常80～100体
- MVP最大100体を基本
- 最適化後150体を検証
- 将来200体以上

敵数よりフレームレートを優先。

---

# 6. アセット

```text
public/assets/concept/buddha-musou-gameplay-concept.png
public/assets/concept/buddha-hero-sheet.png
public/assets/concept/ochimusha-enemy-sheet.png
```

## 仏像戦士

- 金銅・木彫風
- 仏像顔
- 光背
- 数珠
- 袈裟
- 武者風装甲
- 赤い布
- 大型錫杖/降魔杵

## 落武者

- 壊れた兜
- 朽ちた鎧
- 骸骨/亡者風
- 赤く光る目
- ボロ布
- 刀
- 赤黒い怨念

現在の画像はデザイン資料。MVPはThree.js Geometryによる簡易モデル。

将来：

```text
public/assets/models/hero/hero.glb
public/assets/models/enemy/enemy.glb
```

ゲームロジックを3Dモデル固有構造へ依存させない。

---

# 7. GameState

```ts
type GameState = 'boot' | 'title' | 'playing' | 'paused' | 'result';
```

```text
BOOT → TITLE → PLAYING → RESULT → TITLE
                   ↕
                 PAUSED
```

---

# 8. 勝敗

- 300体撃破：CLEAR
- HP 0：GAME OVER

```ts
const CLEAR_KILLS = 300;
```

---

# 9. プレイヤー

```ts
const PLAYER_CONFIG = {
  maxHp: 1000,
  moveSpeed: 8,
  rotationSpeed: 12,
  dodgeSpeed: 16,
  dodgeDuration: 0.30,
  dodgeInvincibleDuration: 0.25,
  dodgeCooldown: 0.50,
  buddhistPowerMax: 100,
};
```

操作：

```text
WASD 移動
J 通常攻撃
K 強攻撃
L 仏技
Space 回避
ESC Pause
```

移動はカメラ基準。

---

# 10. 通常攻撃

J。3段攻撃。

```ts
const NORMAL_ATTACKS = [
  { damage: 40, radius: 3.0, knockback: 3 },
  { damage: 55, radius: 3.5, knockback: 4 },
  { damage: 75, radius: 4.5, knockback: 8 },
];
```

1・2段目：前方扇形。
3段目：広い前方範囲。

武器Meshとの厳密な衝突ではなくゲーム用HitVolume。

---

# 11. 強攻撃

K。

```ts
const STRONG_ATTACK = {
  damage: 120,
  radius: 6,
  cooldown: 1.2,
  knockback: 12,
};
```

ほぼ全周攻撃。大量の敵を吹き飛ばす。

---

# 12. 仏技

L。名称：**仏光陣**。

```ts
const BUDDHA_SKILL = {
  damage: 300,
  radius: 14,
  knockback: 20,
  powerCost: 100,
};
```

演出：

- 光背発光
- 金色リング
- 地面光輪
- 敵を外側へ吹き飛ばす

---

# 13. 仏力

- Hit：+2
- Kill：+3
- 最大100
- 100で仏技可能

---

# 14. 回避

Space。

- duration 0.30
- invincible 0.25
- cooldown 0.50

入力方向へダッシュ。

---

# 15. 攻撃定義

```ts
interface AttackDefinition {
  damage: number;
  radius: number;
  arc?: number;
  knockback: number;
  duration: number;
}
```

---

# 16. 敵

```ts
const ENEMY_CONFIG = {
  maxHp: 100,
  moveSpeedMin: 2.2,
  moveSpeedMax: 3.4,
  attackDamage: 15,
  attackDistance: 1.8,
  attackIntervalMin: 1.5,
  attackIntervalMax: 2.5,
};
```

AI：

```ts
type EnemyState =
  | 'spawn'
  | 'chase'
  | 'attack'
  | 'stagger'
  | 'knockback'
  | 'dead';
```

CHASE：Playerへ接近。
ATTACK：1.8以内。攻撃間隔をランダム化。
STAGGER：0.2秒程度。
KNOCKBACK：velocityへ加算し減衰。
DEAD：非表示後Poolへ戻す。

近隣Enemyが約1.2以内なら簡易Separation。

---

# 17. スポーン

```ts
const SPAWN_CONFIG = {
  initialEnemies: 40,
  targetEnemies: 80,
  maxEnemies: 100,
  minSpawnDistance: 15,
  maxSpawnDistance: 35,
  spawnBatch: 5,
  interval: 1,
};
```

カメラ正面の突然出現を避ける。

---

# 18. 大量敵最適化

必須：

- SpatialHashGrid
- ObjectPool
- InstancedMesh
- 1本のrequestAnimationFrame

禁止：

- EnemyごとのrequestAnimationFrame
- EnemyごとのDOM
- EnemyごとのRaycaster
- O(n²)全敵検索
- 死亡ごとのMesh dispose

## Spatial Hash

Cell Size：4。

```ts
cellX = Math.floor(position.x / 4);
cellZ = Math.floor(position.z / 4);
```

用途：

- Separation
- 攻撃Hit検索
- 近隣検索

---

# 19. Enemy描画

MVPは簡易モデル + InstancedMesh。

```text
EnemyRenderer
 ├ body InstancedMesh
 ├ head InstancedMesh
 ├ helmet InstancedMesh
 └ weapon InstancedMesh
```

ロジックとRendererを分離。

---

# 20. ステージ

第一ステージ：荒廃した寺院。

- 80×80
- 中央：寺院広場
- 鳥居
- 石灯籠
- 壊れた柱
- 岩
- 境界

境界：

```text
X -38～+38
Z -38～+38
```

---

# 21. カメラ

三人称。

```ts
const CAMERA_OFFSET = { x: 0, y: 8, z: 12 };
```

Smooth Follow。

```ts
camera.position.lerp(targetPosition, factor);
```

MVPでは自由カメラを必須にしない。

---

# 22. COMBO

- 1 Hit = +1
- 10体Hit = +10
- 維持3秒
- 3秒Hitなしで0

---

# 23. HUD

左上：HP / 仏力。
右上：ミニマップ。
右中央：COMBO。
右下：仏技。
左下：操作説明。

ミニマップはCanvas 2D、更新10fps程度でよい。

---

# 24. エフェクト

- 通常攻撃：金色Slash
- 強攻撃：大型金色円弧
- 仏技：光輪
- Hit：Spark
- Death：赤黒い煙

外部Particleライブラリは初期導入しない。
EffectPoolを使用。

---

# 25. ヒットストップ

強攻撃等で30～60ms。最大60ms。大量同時Hitでも時間を加算し続けない。

---

# 26. ゲームループ

```ts
requestAnimationFrame(loop);
```

```ts
const FIXED_DT = 1 / 60;
const MAX_FRAME_DELTA = 0.1;
```

順序：

```text
Input
Player
Enemy AI
Spatial Hash
Combat
Physics-lite
Spawn
Effects
Camera
UI
Renderer
```

---

# 27. 物理/当たり判定

本格物理エンジン不要。XZ平面中心。

- Player radius 0.8
- Enemy radius 0.6

吹き飛ばし：XZ velocity + 簡易Yアニメーション。

---

# 28. データ駆動

`src/config/balance.ts` にゲームバランス値を集約。

```ts
export const PLAYER_CONFIG = {};
export const ENEMY_CONFIG = {};
export const ATTACK_CONFIG = {};
export const SPAWN_CONFIG = {};
export const STAGE_CONFIG = {};
```

---

# 29. 推奨構成

```text
src/
├─ main.ts
├─ game/
│  ├─ Game.ts
│  ├─ GameState.ts
│  └─ GameLoop.ts
├─ config/
│  ├─ balance.ts
│  └─ graphics.ts
├─ core/
│  ├─ InputManager.ts
│  ├─ SpatialHashGrid.ts
│  ├─ ObjectPool.ts
│  └─ EventBus.ts
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
│  ├─ AttackDefinition.ts
│  ├─ DamageSystem.ts
│  └─ ComboSystem.ts
├─ world/
│  ├─ Stage.ts
│  ├─ StageBuilder.ts
│  └─ SpawnSystem.ts
├─ camera/
│  └─ ThirdPersonCamera.ts
├─ effects/
│  ├─ EffectManager.ts
│  ├─ SlashEffect.ts
│  ├─ HitEffect.ts
│  └─ BuddhaSkillEffect.ts
├─ ui/
│  ├─ HUD.ts
│  ├─ MiniMap.ts
│  ├─ TitleScreen.ts
│  ├─ PauseScreen.ts
│  └─ ResultScreen.ts
└─ utils/
   ├─ math.ts
   └─ performance.ts
```

---

# 30. InputManager

PressedとHeldを分離。押しっぱなしで毎frame攻撃しない。

---

# 31. EventBus

```text
player:hpChanged
player:powerChanged
enemy:killed
combo:changed
game:clear
game:over
```

UIとゲームロジックを直接強結合させない。

---

# 32. 攻撃処理

```text
PlayerCombat
 → CombatSystem
 → SpatialHashGrid.queryRadius()
 → 距離/角度判定
 → Damage
 → Knockback
```

通常攻撃はforwardとのdot積で扇形判定。強攻撃・仏技はRadius判定。

---

# 33. localStorage

保存候補：

- 音量
- 画質
- 最高COMBO
- 最高撃破数

```text
buddhaMusou.settings
buddhaMusou.records
```

---

# 34. デバッグ

F3：

- FPS
- Active Enemies
- Pool Size
- Draw Calls
- Triangles
- Memory

`renderer.info`を利用。

開発チート：

```text
F4 仏力MAX
F5 敵50体追加
F6 全敵撃破
F7 無敵
```

---

# 35. テスト

Vitest最低対象：

- SpatialHashGrid
- ComboSystem
- DamageSystem
- ObjectPool
- SpawnSystem
- GameState
- PlayerCombat cooldown
- BuddhistPower

必須：

```text
npm run typecheck
npm test
npm run build
```

---

# 36. 実装Phase

## Phase 0 基盤

- Vite
- TypeScript
- Three.js
- Vitest
- strict
- build/test/typecheck

## Phase 1 プレイヤー

- Scene
- Renderer
- Ground
- 仏像簡易モデル
- WASD
- Stage境界
- ThirdPersonCamera

成功：仏像を操作できる。

## Phase 2 敵AI

- Enemy
- Manager
- Pool
- Spawn
- Renderer
- chase
- separation
- 30体

成功：落武者が群がる。

## Phase 3 戦闘

- J/K
- Hit
- Damage
- Knockback
- Dead
- Kill count

成功：多数の落武者を吹き飛ばせる。

## Phase 4 大量敵

- SpatialHashGrid
- InstancedMesh
- ObjectPool最適化
- 100体

成功：100体と戦闘可能。

## Phase 5 仏技

- 仏力
- L
- 仏光陣
- 金色Effect

## Phase 6 UI

- HP
- 仏力
- Combo
- Kill
- MiniMap
- Controls
- Skill indicator

## Phase 7 ゲーム進行

- Title
- Start
- Pause
- Clear
- Game Over
- Result
- Restart

## Phase 8 演出

- Slash
- Hit
- Death
- Camera shake
- Hit stop
- Combo animation

## Phase 9 最適化

100→150体を検証。FPS/DrawCall/Memory計測。

## Phase 10 GLTF対応

`hero.glb` / `enemy.glb` があればロード可能にする。GLBなしでも動作。

---

# 37. MVP完成条件

- タイトル
- ゲーム開始
- WASD
- 大量落武者
- 追跡AI
- J/K/L/Space
- Knockback
- COMBO
- HP
- 仏力
- 撃破数
- 約100体戦闘
- 300体CLEAR
- HP0 GAME OVER
- Restart
- typecheck成功
- test成功
- build成功

---

# 38. MVPで実装しない

- オンライン
- マルチプレイ
- ランキングサーバー
- ログイン
- 課金
- 装備
- アイテム
- レベルアップ
- スキルツリー
- ストーリー
- 会話
- 複数ステージ
- 高度物理
- 布シミュレーション
- 高度IK
- NavMesh
- モバイル操作
- ゲームパッド
- セーブゲーム

---

# 39. Git/Codex

各Phaseごとにコミット。日本語コミット。

作業前：

```text
git status
git diff
```

破壊的操作禁止。共同開発者の変更を勝手に戻さない。

---

# 40. 最重要原則

```text
大量の落武者
      ↓
仏像が錫杖を振る
      ↓
一度に多数Hit
      ↓
敵が大量に吹き飛ぶ
      ↓
COMBOが一気に増える
```

リアルさよりも**「大量の敵を吹き飛ばして気持ちいい」**ことを最優先する。
