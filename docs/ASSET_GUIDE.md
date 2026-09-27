# アセット運用ガイド

## コンセプト資料

`public/assets/concept/`

- `buddha-musou-gameplay-concept.png` — ゲーム全体の画面・雰囲気参考
- `buddha-hero-sheet.png` — プレイヤー「仏像戦士」の設定資料
- `ochimusha-enemy-sheet.png` — 敵「落武者」の設定資料

これらは3Dモデルではありません。MVPでは簡易3Dモデルをコード生成し、ゲームロジック・戦闘・群集処理・UIを先に完成させます。

## 将来の3Dモデル

```text
public/assets/models/hero/hero.glb
public/assets/models/enemy/enemy.glb
```

ゲームロジックを特定モデルのMesh階層へ依存させないこと。

## その他

```text
public/assets/textures/
public/assets/effects/
public/assets/audio/
```

## Git LFS

以下が増えてリポジトリが重くなったらGit LFSを導入します。

- `.glb` / `.gltf` / `.fbx`
- 高解像度PNG
- WAV
- 大容量MP3/OGG
