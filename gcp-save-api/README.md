# contents-manager 保存用 API（GCP Cloud Functions）

LP の contents-manager から「保存してデプロイ」を、GitHub PAT をブラウザで入力せずに実行するための API です。GCP の Cloud Functions（Gen2）にデプロイして利用します。

## 必要な環境変数

| 変数名 | 説明 |
|--------|------|
| `GITHUB_TOKEN` | GitHub Personal Access Token（repo または Contents: Read and write） |
| `CONTENTS_SAVE_SECRET` | ブラウザから API を呼ぶときの合言葉。`data/repo-config.json` の `saveApiSecret` と同一の値にする |

## デプロイ手順

1. [Google Cloud のドキュメント](https://cloud.google.com/functions/docs/deploy) に従い、gcloud CLI でプロジェクトを選択・認証する。

2. このディレクトリで次を実行（プレースホルダーを実際の値に置き換える）。

```bash
gcloud functions deploy saveContent \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region asia-northeast1 \
  --set-env-vars "GITHUB_TOKEN=ghp_xxxx,CONTENTS_SAVE_SECRET=あなたの共有シークレット"
```

3. デプロイ後に表示される URL（例: `https://asia-northeast1-PROJECT_ID.cloudfunctions.net/saveContent`）を、LP リポジトリの `data/repo-config.json` に設定する。

```json
{
  "owner": "your-org",
  "repo": "LP_WAL_KANPAIHUTTEWORKS",
  "branch": "main",
  "saveApiUrl": "https://asia-northeast1-PROJECT_ID.cloudfunctions.net/saveContent",
  "saveApiSecret": "あなたの共有シークレット"
}
```

## PAT を Secret Manager で扱う場合

PAT を環境変数に直接書かない場合は、Secret Manager に登録してからマウントする。

```bash
# シークレット作成（値は手動入力またはファイルから）
echo -n "ghp_xxxx" | gcloud secrets create github-token --data-file=-

# デプロイ時にシークレットを環境変数としてマウント
gcloud functions deploy saveContent \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region asia-northeast1 \
  --set-secrets="GITHUB_TOKEN=github-token:latest" \
  --set-env-vars "CONTENTS_SAVE_SECRET=あなたの共有シークレット"
```

詳細は [docs/save-api-example.md](../docs/save-api-example.md#例-google-cloud-functionsgcp) を参照してください。
