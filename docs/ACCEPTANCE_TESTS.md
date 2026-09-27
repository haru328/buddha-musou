# ACCEPTANCE_TESTS.md
# プロトタイプ受け入れテスト

最終Phaseでこのチェックリストを使用する。

---

# A. Build

- [ ] `npm install` 成功
- [ ] `npm run typecheck` 成功
- [ ] `npm test` 成功
- [ ] `npm run build` 成功
- [ ] `dist/`生成

---

# B. Browser

- [ ] Chrome起動
- [ ] Edge起動
- [ ] 1280×720表示
- [ ] 1920×1080表示
- [ ] Console進行不能Errorなし

---

# C. Title

- [ ] タイトル表示
- [ ] 操作説明表示
- [ ] Start可能
- [ ] EnterまたはButtonで開始

---

# D. Player Movement

- [ ] W
- [ ] A
- [ ] S
- [ ] D
- [ ] Arrow keys
- [ ] Camera relative
- [ ] Player rotation
- [ ] 場外へ出ない
- [ ] Camera追従

---

# E. Enemy

- [ ] 初期Enemy出現
- [ ] 時間経過で約50体
- [ ] Player追跡
- [ ] 完全重複が軽減されている
- [ ] Stage外へ出ない
- [ ] 最大60を超えない

---

# F. Normal Attack

- [ ] J Attack 1
- [ ] J Attack 2
- [ ] J Attack 3
- [ ] 入力Buffer
- [ ] 前方複数Hit
- [ ] 同一Attackで同じEnemyへ多重Hitしない

---

# G. Strong Attack

- [ ] Kで発動
- [ ] 通常攻撃より広い
- [ ] 複数EnemyへHit
- [ ] 5体以上をまとめて吹き飛ばせる場面がある
- [ ] Cooldown

---

# H. Enemy Damage

- [ ] EnemyがPlayerを攻撃
- [ ] HP減少
- [ ] Hit後無敵
- [ ] 一瞬で100体分Damageを受けない
- [ ] HP 0でGame Over

---

# I. Knockback / Death

- [ ] Enemyが押し出される
- [ ] Kで大きく吹き飛ぶ
- [ ] HP 0でDeath
- [ ] Dead Enemyは攻撃しない
- [ ] Poolへ戻る
- [ ] 再利用される

---

# J. Combo

- [ ] HitでCombo加算
- [ ] 同時10Hitなら+10
- [ ] 3秒以内維持
- [ ] 3秒経過で0
- [ ] Max Combo記録

---

# K. Buddhist Power

- [ ] Hitで+2
- [ ] Killで+3
- [ ] 最大100
- [ ] 100未満L不発
- [ ] 100でL発動
- [ ] Skill後0

---

# L. Buddha Skill

- [ ] L発動
- [ ] 周囲広範囲
- [ ] 大量EnemyへHit
- [ ] 大きなKnockback
- [ ] Ring Effect
- [ ] 通常攻撃より明確に強い

---

# M. Dodge

- [ ] Space
- [ ] 移動入力方向
- [ ] 入力なしなら前
- [ ] 一定無敵
- [ ] Cooldown

---

# N. HUD

- [ ] HP
- [ ] 仏力
- [ ] Combo
- [ ] Kills / 100
- [ ] Controls
- [ ] Skill Ready表示

---

# O. Clear

- [ ] 100 Killで終了
- [ ] Result表示
- [ ] Kills表示
- [ ] Max Combo表示
- [ ] Time表示
- [ ] Retry
- [ ] Titleへ戻れる

---

# P. Game Over

- [ ] HP 0
- [ ] Result表示
- [ ] Retry
- [ ] Titleへ戻れる

---

# Q. Restart

Retry後：

- [ ] HP reset
- [ ] Power reset
- [ ] Combo reset
- [ ] Kill reset
- [ ] Enemy reset
- [ ] Effect reset
- [ ] Timer reset
- [ ] Attack Slot reset
- [ ] previous result残留なし

---

# R. Pause

- [ ] ESCでPause
- [ ] Enemy停止
- [ ] Timer停止
- [ ] Resume
- [ ] Tab非表示時に巨大delta問題なし

---

# S. Performance

50 Enemy時：

- [ ] 30 FPS以上を目標
- [ ] 操作不能にならない
- [ ] 攻撃時に長時間freezeしない
- [ ] Memoryが戦闘ごとに増え続けない
- [ ] Draw callsをF3で確認可能

---

# T. Prototype Experience

最終的に人間が確認する。

- [ ] 仏像と落武者が一目で区別可能
- [ ] 多数の敵がいると感じる
- [ ] Kで敵がまとめて吹き飛ぶ
- [ ] Lはさらに派手
- [ ] Comboが増えて気持ちいい
- [ ] 操作方法が説明なしでも概ね理解できる
- [ ] 最初からクリアまでプレイできる

---

# 最終判定

すべてのCritical項目を満たした場合：

```text
STATE: PROTOTYPE_COMPLETE
```

Critical：

- Build
- Browser
- Player
- Enemy
- Combat
- HP
- Combo
- Power
- Skill
- Clear
- Game Over
- Retry
- Performance 30fps目標
