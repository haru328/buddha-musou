# 遊べるプロトタイプの実装・検証報告

STATE: EXECUTED

PHASE: 1〜5（実装と接続可能なブラウザーでの検証）

確認日: 2026-09-29

ユーザーからフェーズを止めずに完成まで進める指示を受け、Phase 1〜4を統合実装し、Phase 5でブラウザー検証・独立レビュー・修正を実施した。
Edgeの実機確認と人間による体験評価は残るため、仕様上の最終判定 `PROTOTYPE_COMPLETE` はまだ宣言しない。

## 実装内容

| Phase | 実装 |
| --- | --- |
| 1 | 簡易仏像、光背、錫杖、Ground、WASD / 矢印キー、移動方向への回転、境界制限、滑らかな三人称カメラ |
| 2 | 固定60枠の敵プール、初期20体から目標50体への増員、安全距離スポーン、追跡、Spatial Hashによる近傍分離、最大6攻撃枠 |
| 3 | 通常攻撃3段、入力バッファ、強攻撃、扇形 / 円形の複数ヒット、同一攻撃の多重ヒット防止、吹き飛ばし、死亡・再利用、敵の攻撃、HP・無敵、COMBO |
| 4 | 仏力、仏光陣、回避、HUD、タイトル、Pause、100体撃破のクリア、HP 0の敗北、再挑戦、タイトル帰還、光弧・閃光・衝撃波・死亡演出 |
| 5 | 敵のInstancedMesh化、背景のマテリアル単位の結合、72枠のエフェクト再利用、F3デバッグ、独立レビューと回帰テスト |

3Dモデル、テクスチャ、音声は外部から取得しない。既存の参考画像は仕様どおり参考資料として保持。

## ファイル構成

- 統合: `src/main.ts`、`src/game/Game.ts`、`src/game/GameSession.ts`、`src/game/GameState.ts`
- 入力・基盤: `src/core/InputManager.ts`、`src/core/ObjectPool.ts`、`src/core/SpatialHashGrid.ts`
- 戦闘: `src/combat/ComboSystem.ts`、`src/combat/DamageSystem.ts`、`src/config/balance.ts`
- 描画: `src/world/Stage.ts`、`src/player/PlayerRenderer.ts`、`src/enemy/EnemyRenderer.ts`、`src/effects/EffectManager.ts`、`src/camera/ThirdPersonCamera.ts`、`src/utils/disposeScene.ts`、`src/config/graphics.ts`
- UI: `index.html`、`src/style.css`、`src/ui/GameUI.ts`
- テスト: `tests/GameplayCore.test.ts`、`tests/GameSession.test.ts`、`tests/EffectManager.test.ts`、既存 `tests/GameLoop.test.ts`
- ドキュメント: `README.md`、本書

## 自動検証

- `npm run typecheck`: 成功。
- `npm test`: 4ファイル、35件成功。
- `npm run build`: 成功。本番用の `dist/` 生成を確認。
- 固定更新、停止・再開、多重ループ防止。
- Pool枯渇・二重返却・同一オブジェクト再利用。
- 負座標とセル境界を含む近傍検索、更新・削除。
- 移動速度、斜め入力正規化、場外防止、回避方向・クールダウン・無敵。
- 敵数・スポーン距離・角での安全距離・重なり軽減・同時攻撃数。
- 攻撃方向、範囲端、多重ヒット防止、3段連携、強攻撃の10体撃破、仏力、仏技後0、コンボ失効。
- HP / 撃破数を直接変更しない通常入力による100体撃破、再挑戦、無抵抗での敗北、タイトル帰還。
- 再挑戦でタイマー、HP、位置、仏力、コンボ、敵、攻撃枠、イベントをリセット。
- 光弧のワールド座標方向、50体撃破相当のイベントでも仏技リングが維持されること。

この実行環境のnpmは前フェーズ同様 `node tmp/npm/package/bin/npm-cli.js` 経由で実行。
依存パッケージ追加はなし。

## ブラウザー確認

- Chrome: 本番ビルドのタイトル表示、開始、3Dキャラクター・群集・HUD表示、1920×1080へのリサイズ。
- Codex内蔵ブラウザー: 開発版と本番ビルドで起動。1280×720と1920×1080を確認。
- 通常攻撃で36 COMBO / 仏力72を画面上で確認。
- 通常のJ/K/L入力からクリア（109撃破・最大66 COMBO・41秒）に到達。
- クリア後の再挑戦でHP1000・仏力0・撃破0・初期20体・00:00へ復帰。
- 本番版で無抵抗の被ダメージから「力尽きた……」に遷移（31秒）。
- レビュー修正後の本番ビルドでも、再挑戦から112撃破・最大43 COMBO・22秒でクリアし、タイトルに戻れることを確認。
- Enterによる再挑戦、Escによる停止・再開、W移動・Space回避、F3の表示切替を確認。
- 一時停止中はシミュレーション時間を進めず、背面HUDをキーボード操作対象から除外。
- 本番版のコンソールerror / warnなし。

100体到達を含む同時攻撃は最後まで解決するため、最終撃破数が100を超える場合がある。

## パフォーマンスとリソース

- 内蔵ブラウザーで敵50体、1920×1080: F3表示60 FPS、47 draw calls、31,500 triangles。
- 1280×720での戦闘中も約60 FPSを観測。個別端末での性能保証ではなく、この実行環境の観測値。
- Chromeの自動接続タブでは描画頻度が1 FPSに制限される状態があり、Chromeの前面実行時の性能値としては採用していない。
- 描画ループは全体で1本。敵個別のDOM、ループ、ライト、Raycasterは使用しない。
- 背景をマテリアルごとに結合し、敵パーツはInstancedMeshで共有する。
- エフェクトは攻撃8枠とヒット・死亡64枠に分け、閃光が重要な仏技リングを上書きしない。
- 戦闘を再開してもScene・Renderer・Meshを作り直さない。GPU Geometry数は初回使用で26から最大29へ増え、その後の再挑戦では増えない構成。
- 破棄時にDOMイベント、UIイベント、描画予約、共有Geometry / Material / InstancedMeshを解除。
- HUD更新は10 Hz、FPS等の集計は1 Hz。

## 独立レビューで修正した不具合

1. 左右を向いた通常攻撃の光弧が、判定と逆方向に表示されていた。回転符号を修正し、4方向×2時点の実際のMesh座標を検証。
2. 36体以上への仏技で、ヒット・死亡演出がリングを最初の描画前に上書きしていた。攻撃用の予約枠を設け、50体分のイベントによる回帰テストを追加。

修正後に同じ独立レビュアーがコードと回帰テスト9件を再確認し、指摘した不具合の解消を確認した。

## 既知の問題・残る確認

- MANUAL CHECK REQUIRED: 接続されていないEdgeで、起動・操作・リサイズ・コンソール・FPSを確認する。
- MANUAL CHECK REQUIRED: Chromeを通常の前面タブで操作し、FPSと操作感を確認する。
- MANUAL CHECK REQUIRED: `ACCEPTANCE_TESTS.md` のT（爽快感・操作説明の分かりやすさ）を人間が通しプレイで評価する。
- GPUの長時間メモリプロファイルとWebGL無効環境での実機確認は未実施。
- Three.jsを含む約578 kB（gzip約147 kB）のJSチャンクに、Viteの500 kB警告が出る。ビルド失敗や実行時エラーはない。

## 次の作業

まず上記の実機確認と操作感のフィードバックを優先。正式モデル・BGM・ボス・ステージ追加は別スコープ。
