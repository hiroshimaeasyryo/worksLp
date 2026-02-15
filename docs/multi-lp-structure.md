# 全体LP・拠点別LPのファイル構成と contents_manager 方針

## GitHub Pages の前提

- **ルートの `index.html`** がサイトのトップ（`https://your-domain.com/`）として表示される。
- それ以外のHTMLは **リポジトリ内のパスがそのままURLになる**。
  - 例: `locations/tokyo/index.html` → `https://your-domain.com/locations/tokyo/`
  - 例: `osaka.html` → `https://your-domain.com/osaka.html`
- ファイル名に特別な禁止文字はないが、**URLとして扱いやすいよう英小文字・数字・ハイフン**に揃えると安全。
- 各「ページ」は **1つのHTMLファイル**、または **`フォルダ名/index.html`** で表現する（後者の方がURLがきれい）。

---

## 推奨: ディレクトリ・ファイル構成

全体用LPを1本、拠点ごとに1本ずつLPを用意する場合の例です。

```
（リポジトリルート = GitHub Pages の公開元）
├── index.html                    # 全体用LP（トップ）
├── contents-manager.html         # 編集用ページ（共通）
├── assets/                       # 共通CSS・JS・画像（任意）
│   ├── css/
│   ├── js/
│   └── images/
├── data/                         # 編集対象のテキスト・設定（contents_manager が読む/書く）
│   ├── main.json                 # 全体LP用
│   └── locations/
│       ├── tokyo.json
│       ├── osaka.json
│       └── hiroshima.json
└── locations/                    # 拠点別LP（URL: /locations/〇〇/）
    ├── tokyo/
    │   └── index.html
    ├── osaka/
    │   └── index.html
    └── hiroshima/
        └── index.html
```

### この構成の利点

| 観点 | 説明 |
|------|------|
| **URL** | 全体: `https://your-domain.com/`、拠点: `https://your-domain.com/locations/tokyo/` のように一貫して分かりやすい。 |
| **GitHub Pages** | 標準の「静的ファイルをそのまま配信」の使い方だけで成立する。 |
| **編集対象の分離** | 全体用は `data/main.json`、拠点用は `data/locations/<拠点ID>.json` と1対1で対応させやすい。 |
| **contents_manager** | 「どのLPを編集するか」を選ぶだけで、読み書きするJSONを切り替えられる。 |

---

## 命名規則の目安

- **フォルダ名・ファイル名**: 英小文字 + 数字 + ハイフンのみ（例: `tokyo`, `osaka-west`, `location-01`）。
- **拠点ID**: 上記と同じルールで、`data/locations/<拠点ID>.json` と `locations/<拠点ID>/index.html` で一致させる。
- **HTMLファイル名**: 拠点用は各フォルダ内で **`index.html`** に統一すると、URLが `.../locations/tokyo/` のようにシンプルになる。

---

## contents_manager で拠点ごとのLPを編集するには

### 1. 「編集対象LP」の選択

- 画面に **「編集するLPを選択」** のようなドロップダウン（またはタブ）を用意する。
  - 例: `全体用LP` | `東京` | `大阪` | `広島`
- 選択値とデータファイルの対応例:
  - `main` → `data/main.json`
  - `tokyo` → `data/locations/tokyo.json`
  - `osaka` → `data/locations/osaka.json`

### 2. データの読み込み・保存

- 選択されたLPに応じて、上記のJSONパスを組み立てて fetch する。
- 保存時も同じパスへ PUT または「GitHub API 経由でファイル更新」など、採用する保存方式に合わせて同じパスを指定する。
- 参考リポジトリ（kanpai_lp_new）で「1つのJSONをどう読んで編集しているか」を確認し、**「読み書きするJSONのパスだけを切り替える」**形にすると実装しやすい。

### 3. 拠点一覧の管理

- 拠点IDの一覧は **設定用のJSON（例: `data/locations/index.json`）** や、**contents_manager 内の定数**で持つ。
- 新拠点を追加するときは、
  - `data/locations/<新拠点ID>.json` を追加
  - `locations/<新拠点ID>/index.html` を追加（既存拠点の index.html をコピーして中身だけ差し替え）
  - contents_manager の選択肢にその拠点を追加  
  という手順にすると、命名規則と構成を守れる。

### 4. 各LPのHTML側

- 全体用 `index.html` は `data/main.json` を読み込む。
- 拠点用 `locations/tokyo/index.html` などは、**自分がどの拠点か**を埋め込みで持つ（例: `<script>const LOCATION_ID = 'tokyo';</script>`）か、**パスから拠点IDを判定**して、`data/locations/tokyo.json` を読み込むようにする。
- こうすると、LPの見た目・レイアウトは共通のまま、表示する文言だけ拠点別JSONで差し替えできる。

---

## まとめ

- **全体用LP**: ルートの `index.html` + `data/main.json`。
- **拠点別LP**: `locations/<拠点ID>/index.html` + `data/locations/<拠点ID>.json`。
- **contents_manager**: 「編集するLP」を選び、そのLP用のJSONだけを読み書きする。

この構成にすれば、GitHub Pages の制約に沿いつつ、複数LPを同じリポジトリで公開し、contents_manager から拠点ごとのLPも編集可能にできます。
