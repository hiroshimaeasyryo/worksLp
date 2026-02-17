# コンテンツ管理の最適化とメモリクラッシュ対策

`data/main.json` が 5.7MB と肥大化しており、そのほとんどが Base64 形式の画像データであることが分かりました。これをファイルとして外部化（`assets/images` への保存）し、JSON 内にはパスのみを保持するように変更することで、開発環境および実行時のメモリ負荷を劇的に軽減します。

## Proposed Changes

### 1. データ移行（Migration）
- `data/main.json` 内の Base64 文字列を抽出し、`assets/images/` 配下にファイルとして保存するスクリプトを作成・実行します。
- `main.json` 内の画像データを Base64 からファイルパス（例: `assets/images/hero_bg.jpg`）に書き換えます。

### 2. コンテンツ管理画面（contents-manager.html）の修正
- **画像リサイズ処理の導入**:
  - Canvas API を使用し、画像選択時に自動でリサイズ（長辺1600px程度）および圧縮（JPEG/WebP）を行います。
- **保存方式の変更**:
  - 画像データを JSON に直接埋め込まず、ファイルとして保存（GitHub API を介したファイル作成）し、JSON にはそのパスを記録するように変更を検討します。
  - ※構成上 JSON 埋め込みを維持せざるを得ない場合でも、リサイズ処理により 1/10 以下のサイズに圧縮することで、現在の肥大化問題を回避できます。

### 3. LP本体（assets/js/main.js）の対応
- 現在の `main.js` はパス指定と Base64 の両方に対応しているため、基本的にはそのままでも動作しますが、最適化に合わせてパスベースでの動作を確実にします。

## Cloud Functions へのデプロイ

### [MODIFY] [gcp-save-api/index.js](file:///Users/higashiyamaryou/Desktop/BaseDir/WAL/LP_WAL_KANPAIHUTTEWORKS/gcp-save-api/index.js)
- バイナリ保存（画像ファイル等）に対応するよう修正済み。

### デプロイ実行
- gcloud CLI を使用して、既存の環境変数を維持したままデプロイを行います。

```bash
gcloud functions deploy saveContent \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region asia-northeast1 \
  --set-env-vars "GITHUB_TOKEN=YOUR_GITHUB_TOKEN,CONTENTS_SAVE_SECRET=YOUR_SECRET_KEY"
```

## Verification Plan

### Automated Tests
- 保存ボタンクリック時の挙動確認
- `assets/images/` への画像ファイル作成確認
- `main.json` のパス更新確認

### Manual Verification
- `contents-manager.html` から画像をアップロードし、「保存してデプロイ」が正常に終了することを確認。
- GitHub リポジトリ上で、画像ファイルと `main.json` が更新されていることを確認。
- `contents-manager.html` で新しい画像をアップロードした際、リサイズが効いていること、およびメモリ使用量が抑制されていることを確認する。
