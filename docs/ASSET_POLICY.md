# ASSET_POLICY.md
# プロトタイプ用アセット方針

---

## 1. 現在の画像

```text
public/assets/concept/
```

はコンセプト資料。

プロトタイプ実装では画像から3Dモデルを生成・復元しない。

---

## 2. 3Dモデル

プロトタイプ：

Procedural Geometry。

完成後：

```text
public/assets/models/hero/hero.glb
public/assets/models/enemy/enemy.glb
```

へ差し替え。

---

## 3. Audio

BGM / SE / Voiceはプロトタイプ完成条件外。

audioフォルダは空でよい。

AudioがなくてもErrorを出さない。

---

## 4. Visual Effect

外部AssetがなくてもThree.js Geometry/Materialで成立させる。

---

## 5. Asset追加

第三者Assetはライセンス確認必須。

ライセンス不明AssetをGitHubへcommitしない。

---

## 6. Git LFS

GLB、高解像度texture、WAV等が増えてから導入検討。

現段階では不要。

---

## 7. 差し替え設計

Game LogicがModel Mesh名に依存しないこと。

Renderer層だけで差し替えられる形を維持する。
