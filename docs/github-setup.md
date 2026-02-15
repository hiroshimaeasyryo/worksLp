# GitHub 設定手順（contents-manager と GitHub Pages）

[kanpai_lp_new](https://github.com/hiroshimaeasyryo/kanpai_lp_new) と同様に、**コンテンツを編集して保存するたびに push が発生し、GitHub Actions が走って GitHub Pages にデプロイされる**流れです。

---

## 1. GitHub Pages の公開方法を「GitHub Actions」に設定する

1. リポジトリの **Settings** → **Pages** を開く。
2. **Build and deployment** の **Source** で **GitHub Actions** を選ぶ。
   - 「Deploy from a branch」ではなく **「GitHub Actions」** を選択してください。
3. これで、`.github/workflows/deploy-pages.yml` が `main` に push されたときに実行され、ビルド成果物が Pages にデプロイされます。

---


## 2. contents-manager から「保存してデプロイ」するために必要な設定

contents-manager の「保存してデプロイ」は、**GitHub API で `data/main.json` 等を更新（commit）** します。その commit が `main` に push されるため、上記ワークフローが動き、数分でサイトに反映されます。

### 2.1 リポジトリ情報の設定

保存先のリポジトリを指定する方法は次のいずれかです。

- **推奨: `data/repo-config.json` を編集する**
  - リポジトリを clone した状態で、`data/repo-config.json` を開き、`owner` と `repo` を自分のリポジトリに合わせて記入する。
  - 例: リポジトリが `https://github.com/your-org/LP_WAL_KANPAIHUTTEWORKS` の場合  
    `"owner": "your-org", "repo": "LP_WAL_KANPAIHUTTEWORKS"`
  - このファイルを commit して push すれば、本番の GitHub Pages 上でも contents-manager が同じリポジトリに保存できる。

- **代替: `contents-manager.html` 内の `REPO_CONFIG` を編集する**
  - `<script>` 内の `var REPO_CONFIG = { owner: '你的org', repo: 'リポジトリ名', branch: 'main' };` を書き換える。

- **代替: meta タグで指定する**
  - `<head>` 内に  
    `<meta name="github-repo" content="owner/repo">`  
    を追加する。

### 2.2 GitHub Personal Access Token（PAT）の作成

ブラウザから GitHub API でファイルを更新するには、**Personal Access Token** が必要です。

1. GitHub の **Settings** → **Developer settings** → **Personal access tokens** を開く。
2. **Tokens (classic)** または **Fine-grained tokens** のどちらかで新規作成する。
   - **Classic**: **repo** スコープにチェックを入れる（フル権限で問題ない場合）。
   - **Fine-grained**: 対象リポジトリを選び、**Repository permissions** で **Contents** を **Read and write** にする。
3. トークンを発行し、**一度だけ** 表示される文字列をコピーする（`ghp_...` または `github_pat_...`）。
4. contents-manager の「GitHub トークン」欄に、**保存するときだけ** 貼り付けて使用する。  
   - トークンはこのページの入力欄でのみ使用され、保存・送信先には送りません（他サイトに送らないよう注意）。

**注意**: 共有PCではトークンを入力しない・使い終わったら欄を空にするなど、取り扱いに注意してください。

---

## 3. アクセスコードの変更（任意）

contents-manager の入室には、初期状態で **`hutte2025`** というアクセスコードが使われています。

- 変更する場合は、`contents-manager.html` 内の `<script>` にある  
  `var ACCESS_CODE = 'hutte2025';`  
  を任意の文字列に書き換えてから、デプロイしてください。

---

## 4. 運用の流れのまとめ

| 手順 | 内容 |
|------|------|
| 1 | リポジトリの **Pages** で Source を **GitHub Actions** に設定する。 |
| 2 | `data/repo-config.json` の `owner` / `repo` を設定する（または REPO_CONFIG / meta で指定）。 |
| 3 | 編集担当者は contents-manager にアクセスし、アクセスコードを入力して入室する。 |
| 4 | 必要に応じて GitHub PAT を「GitHub トークン」欄に入力する。 |
| 5 | 文言を編集し「保存してデプロイ」を押す。 |
| 6 | GitHub に commit が push され、Actions の **Deploy to GitHub Pages** が実行される。 |
| 7 | 数分後、GitHub Pages の URL で変更が反映される。 |

---

## 5. カスタムドメインを使う場合

- **Settings** → **Pages** の **Custom domain** にドメインを入力し、指示に従って DNS（CNAME または A レコード）を設定する。
- リポジトリ直下に **CNAME** ファイルを置き、そのドメイン名だけを1行で書く方法も利用できます（Pages が CNAME を読む場合）。

---

## 参考

- [GitHub Pages の公式ドキュメント](https://docs.github.com/ja/pages)
- [GitHub Actions で Pages にデプロイする](https://github.com/actions/deploy-pages)
- 参考リポジトリ: [kanpai_lp_new](https://github.com/hiroshimaeasyryo/kanpai_lp_new)（Vite ビルド＋Pages の例）
