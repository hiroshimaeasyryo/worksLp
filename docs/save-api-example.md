# 保存用 API サンプル（PAT を非エンジニアに入力させない場合）

非エンジニアに GitHub PAT を入力させずに「保存してデプロイ」を動かすには、**サーバーレス API** を 1 回だけ用意し、そこに PAT を環境変数で設定します。編集者はアクセスコードだけで入室し、保存時もトークン入力は不要です。

---

## 全体の流れ

1. 編集者が contents-manager で「保存してデプロイ」を押す。
2. ブラウザは **あなたがデプロイした API の URL** に、編集内容（JSON）とアクセスコード（または共有シークレット）を POST する。
3. API はアクセスコードを検証し、環境変数に設定した `GITHUB_TOKEN` で GitHub API を呼び、ファイルを更新する。
4. 更新 = commit が push されるので、既存の GitHub Actions が走り、Pages にデプロイされる。

---

## 例: Vercel Serverless Function

以下は Vercel の serverless 関数の例です。リポジトリに `api/` を追加して使うか、別リポジトリで API だけをデプロイしても構いません。

### 1. ディレクトリ構成（Vercel の場合）

```
your-api-project/
├── api/
│   └── save-content.js   # 下記のコード
├── package.json          # 空でよい、または {} のみ
└── vercel.json           # 省略可
```

### 2. `api/save-content.js`

```javascript
// Vercel では api/save-content.js が POST /api/save-content で動く
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SHARED_SECRET = process.env.CONTENTS_SAVE_SECRET || 'your-secret';

function getByPath(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || req.body?.secret || '';
  const secret = auth.replace(/^Bearer\s+/i, '').trim();
  if (secret !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { path, content, owner, repo, branch = 'main' } = req.body || {};
  if (!path || !content || !owner || !repo || !GITHUB_TOKEN) {
    return res.status(400).json({ error: 'Missing path, content, owner, repo or GITHUB_TOKEN' });
  }

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  let sha = null;

  try {
    const getRes = await fetch(`${apiBase}?ref=${branch}`, {
      headers: { 'Accept': 'application/vnd.github+json', 'Authorization': `Bearer ${GITHUB_TOKEN}` }
    });
    const file = await getRes.json();
    if (file.sha) sha = file.sha;
  } catch (e) {
    return res.status(500).json({ error: 'Failed to get file sha' });
  }

  const body = JSON.stringify(content, null, 2);
  const base64 = Buffer.from(body, 'utf8').toString('base64');

  try {
    const putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `contents-manager: update ${path}`,
        content: base64,
        sha,
        branch
      })
    });
    if (!putRes.ok) {
      const err = await putRes.json();
      return res.status(putRes.status).json({ error: err.message || 'Update failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Update failed' });
  }
}
```

### 3. 環境変数（Vercel のダッシュボードで設定）

| 名前 | 値 | 説明 |
|------|-----|------|
| `GITHUB_TOKEN` | あなたの PAT（repo または Contents: Read and write） | GitHub API でファイル更新に使用 |
| `CONTENTS_SAVE_SECRET` | 任意の長い文字列 | ブラウザから API を呼ぶときの「合言葉」。contents-manager からこの値を送る |

### 4. contents-manager 側の変更

「保存してデプロイ」を押したときに、トークン欄が空なら **API の URL に POST する** 分岐を追加します。

- `data/repo-config.json` に `saveApiUrl` と `saveApiSecret` を追加する例:
  - `"saveApiUrl": "https://your-project.vercel.app/api/save-content"`
  - `"saveApiSecret": "あなたが CONTENTS_SAVE_SECRET に設定した値"`
- contents-manager の保存ロジックで、`githubToken` が空かつ `saveApiUrl` が設定されていれば、`fetch(saveApiUrl, { method: 'POST', body: JSON.stringify({ path, content: payload, owner, repo, branch, secret: saveApiSecret }) })` を送る。

こうすると、編集者はトークン欄を空のまま「保存してデプロイ」を押すだけで、API 経由で GitHub が更新されます。

---

## 例: Google Cloud Functions（GCP）

自社で GCP を利用する場合、**Cloud Functions** で同じ保存 API を用意できます。Vercel と同様、PAT は関数の環境変数（または Secret Manager）にだけ持ち、非エンジニアは触りません。

**リポジトリ内のデプロイ用コード**: この LP リポジトリの **`gcp-save-api/`** に、そのままデプロイできる Cloud Functions のコードと README を置いてあります。`gcp-save-api/README.md` の手順に従ってデプロイしてください。

以下は同じ内容の説明です。

### 1. ディレクトリ構成

```
save-content-gcp/
├── index.js      # 下記のコード
├── package.json  # 下記のとおり
└── .gcloudignore # node_modules などを除外（省略可）
```

### 2. `package.json`

```json
{
  "name": "contents-manager-save-api",
  "main": "index.js",
  "engines": { "node": ">=18" }
}
```

### 3. `index.js`

```javascript
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SHARED_SECRET = process.env.CONTENTS_SAVE_SECRET || 'your-secret';

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

exports.saveContent = (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || (req.body && req.body.secret) || '';
  const secret = (typeof auth === 'string' ? auth.replace(/^Bearer\s+/i, '') : auth).trim();
  if (secret !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body || {};
  const { path, content, owner, repo, branch = 'main' } = body;
  if (!path || !content || !owner || !repo || !GITHUB_TOKEN) {
    return res.status(400).json({
      error: 'Missing path, content, owner, repo or GITHUB_TOKEN'
    });
  }

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  let sha = null;

  fetch(`${apiBase}?ref=${branch}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`
    }
  })
    .then((r) => r.json())
    .then((file) => {
      if (file.sha) sha = file.sha;
      const jsonBody = JSON.stringify(content, null, 2);
      const base64 = Buffer.from(jsonBody, 'utf8').toString('base64');
      return fetch(apiBase, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `contents-manager: update ${path}`,
          content: base64,
          sha,
          branch
        })
      });
    })
    .then((putRes) => {
      if (!putRes.ok) {
        return putRes.json().then((err) => {
          throw new Error(err.message || 'Update failed');
        });
      }
      return res.status(200).json({ ok: true });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message || 'Update failed' });
    });
};
```

### 4. デプロイ（gcloud CLI）

```bash
cd save-content-gcp
gcloud functions deploy saveContent \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars "GITHUB_TOKEN=ghp_xxxx,CONTENTS_SAVE_SECRET=あなたの共有シークレット"
```

- **認証をかけたい場合**: `--allow-unauthenticated` を外し、IAM で `allUsers` に `roles/cloudfunctions.invoker` を付与する代わりに、API ゲートウェイや Cloud Endpoints で制御するか、`--no-allow-unauthenticated` のまま Invoker にだけ権限を付与する。
- **PAT を環境変数に直接書きたくない場合**: Secret Manager に PAT を登録し、Cloud Functions の「シークレットを環境変数としてマウント」で `GITHUB_TOKEN` に紐づける。  
  例: シークレット `github-token` を作成したうえで  
  `--set-secrets="GITHUB_TOKEN=github-token:latest"` を指定する。

### 5. 発行される URL

デプロイ後、次のような URL が表示されます。

```
https://<region>-<project-id>.cloudfunctions.net/saveContent
```

この URL を `data/repo-config.json` の **saveApiUrl** に設定し、**saveApiSecret** にデプロイ時に指定した `CONTENTS_SAVE_SECRET` の値（同じ文字列）を設定します。contents-manager はすでに「saveApiUrl ありなら API に POST」する実装になっているため、追加のフロント変更は不要です。

### 6. GCP の補足

- **Secret Manager**: PAT を `github-token` などのシークレットに格納し、Cloud Functions の環境変数にマッピングすると、コードや gcloud の履歴に PAT が出ません。
- **VPC・ファイアウォール**: 関数から GitHub API（HTTPS）へはパブリックに出るため、自社の出口プロキシや制限がある場合は、VPC コネクタや Cloud NAT の設定に合わせてください。
- **リージョン**: 利用するリージョンを `--region=asia-northeast1` などで指定できます。

---

## 他のサービス（Netlify / Cloudflare Workers）

- **Netlify**: `netlify/functions/save-content.js` に同様の処理を書き、環境変数に `GITHUB_TOKEN` と `CONTENTS_SAVE_SECRET` を設定する。
- **Cloudflare Workers**: `fetch` で受け取ったリクエストを検証し、`env.GITHUB_TOKEN` で GitHub API を呼ぶ。Worker の環境変数（Settings → Variables）に PAT を設定する。

いずれも「PAT はサーバー側の環境変数だけに存在し、非エンジニアは触らない」形になります。
