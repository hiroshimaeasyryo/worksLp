/**
 * contents-manager 保存用 API（Google Cloud Functions）
 * 環境変数: GITHUB_TOKEN, CONTENTS_SAVE_SECRET
 * デプロイ後、data/repo-config.json の saveApiUrl にこの関数の URL を設定する。
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SHARED_SECRET = process.env.CONTENTS_SAVE_SECRET || '';

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
  const secret = (typeof auth === 'string' ? auth.replace(/^Bearer\s+/i, '').trim() : String(req.body.secret || '').trim());
  if (!SHARED_SECRET || secret !== SHARED_SECRET) {
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

  fetch(`${apiBase}?ref=${branch}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`
    }
  })
    .then((r) => r.json())
    .then((file) => {
      const sha = file.sha || null;
      let base64;
      if (typeof content === 'object') {
        const jsonBody = JSON.stringify(content, null, 2);
        base64 = Buffer.from(jsonBody, 'utf8').toString('base64');
      } else {
        // 文字列の場合は既にBase64エンコードされているか、生のデータとみなす
        // ここでは、data:プロトコルを含まない純粋なBase64文字列を期待する
        base64 = content;
      }
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
