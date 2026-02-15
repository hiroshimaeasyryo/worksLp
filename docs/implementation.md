# プロジェクトの概要
- このプロジェクトは当社「ワークス事業部」の事業の一つである、学生の長期インターンシップ実施において、そのインターンシップメンバーの集客を行うためのLPを作成するものである。
- 低コストで実現するためGithub Pagesで独自ドメインを設定して公開する。
- また、非エンジニアが容易に内容の編集や差し替えを行えるようにするべく、`contents-manager`ページを設け、アクセスコードを入力することでそれを可能とする。
- `contents-manager`は当社の別事業部でのLPで実装しているため、そちらも参考にされたい。
  - https://github.com/hiroshimaeasyryo/kanpai_lp_new

## 関連ドキュメント
- **全体LP・拠点別LPの構成**: [multi-lp-structure.md](./multi-lp-structure.md)  
  GitHub Pages の命名規則、推奨ディレクトリ・ファイル構成、および contents_manager で拠点ごとのLPを編集する際の方針を記載。
- **GitHub 設定手順**: [github-setup.md](./github-setup.md)  
  Pages の公開方法（GitHub Actions）、contents-manager の保存先リポジトリ設定・PAT の取り方、アクセスコード変更、運用の流れを記載。