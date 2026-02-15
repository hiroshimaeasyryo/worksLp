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

#### public リポジトリで `data/repo-config.json` を commit したくない場合

- `data/repo-config.json` は **.gitignore に含まれており**、リポジトリには含めません（`saveApiSecret` などを公開しないため）。
- 代わりに、**GitHub の Actions Secrets** に設定を渡し、デプロイ時にだけ `data/repo-config.json` を生成します。
  1. リポジトリの **Settings** → **Secrets and variables** → **Actions** を開く。
  2. **New repository secret** で、名前を **`REPO_CONFIG_JSON_B64`** にする。
  3. 値には、**`data/repo-config.json` の中身（JSON 全体）を base64 にした文字列**を入れる。  
     例（ターミナルで作成）:  
     `echo -n '{"owner":"hiroshimaeasyryo","repo":"worksLp","branch":"main","saveApiUrl":"https://...","saveApiSecret":"あなたの共有シークレット"}' | base64`
  4. 表示された 1 行をコピーし、Secret の値として貼り付けて保存する。
- これで、push のたびにワークフローが Secret をデコードして `_site/data/repo-config.json` を生成し、本番サイトだけに設定が渡ります。

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

## 2.3 PAT を非エンジニアに入力させない方法（推奨）

非エンジニアに GitHub PAT を入力させるのはハードルが高いため、次のいずれかの運用を推奨します。

### 方法1: JSON をダウンロードして担当者に渡す（トークン不要・追加設定なし）

- 編集者は contents-manager で文言を変え、**「JSONをダウンロード（担当者に渡す・トークン不要）」** を押す。
- ダウンロードした JSON ファイル（例: `main.json`）を Slack・メール等で担当者（エンジニア）に渡す。
- 担当者がそのファイルを `data/main.json`（または該当する `data/locations/〇〇.json`）に上書きして commit・push する。
- push で GitHub Actions が走り、数分でサイトに反映される。

**メリット**: トークン不要・追加の仕組み不要。  
**デメリット**: 反映のたびに担当者による commit が必要。

### 方法2: サーバーレス経由でトークンを「預ける」（1回だけ設定）

- **GitHub Actions の Secrets** は、ワークフローが**実行されている runner のなか**でしか参照できません。ブラウザからは参照できないため、「Secrets に PAT を入れておいて contents-manager から使う」ことはそのままではできません。
- 代わりに、**小さな API（サーバーレス関数）** を 1 回だけ用意し、そこに PAT を環境変数で設定する方法があります。
  1. 自社環境に合わせたサーバーレスに、「リクエストを受け取り、アクセスコードを確認してから GitHub API でファイルを更新する」関数をデプロイする。  
     **GCP**（Cloud Functions）／Vercel／Netlify／Cloudflare Workers などで同じ構成が可能。自社で GCP を使う場合は [save-api-example.md の GCP の節](./save-api-example.md#例-google-cloud-functions) を参照。
  2. そのサービス側の **環境変数** に `GITHUB_TOKEN`（PAT）を設定する（GitHub の Actions Secrets ではなく、各クラウドの環境変数または Secret Manager）。
  3. contents-manager の `data/repo-config.json` に **saveApiUrl** と **saveApiSecret** を設定し、「保存してデプロイ」がその API に POST する形にする。
  4. 編集者は**アクセスコードだけ**で入室し、保存時もトークン入力は不要。PAT はサーバー側にだけ存在する。

**メリット**: 非エンジニアはトークンを一切触らない。  
**デメリット**: API のデプロイと環境変数の初期設定が 1 回必要。  
詳細なサンプル（Vercel・**GCP Cloud Functions**）は [docs/save-api-example.md](./save-api-example.md) を参照してください。

### 方法3: GitHub Actions Secrets について

- **Actions の Secrets** は「ワークフロー実行時に runner から参照する」ためのものです。ブラウザで開いている contents-manager からは参照できません。
- そのため、「PAT を Secrets に置いて、非エンジニアの入力を省く」には、上記の**サーバーレス API 経由**で、その API が持つトークン（Vercel/Netlify 等の環境変数に設定した PAT）を使って GitHub を更新する形が前提になります。

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
