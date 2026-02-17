# 企業カードUI改善：ロゴ背景化とホバー演出の強化

企業ロゴをカードの背景として配置し、デフォルト状態での存在感を高めるとともに、ホバー時の視認性を向上させます。

## Proposed Changes

### JavaScript (HTML構造の変更)

#### [MODIFY] [main.js](file:///Users/higashiyamaryou/Desktop/BaseDir/WAL/LP_WAL_KANPAIHUTTEWORKS/assets/js/main.js)
- 企業ロゴをカードの「全面背景」として扱うため、レンダリング時のHTML構造を変更します。
- 旧構造：ロゴを表示する div と名前を並列で配置。
- 新構造：
  - ロゴ画像を絶対配置の背景要素として配置。
  - 企業名を相対配置のオーバーレイ要素として配置。

### CSS (スタイルの調整)

#### [MODIFY] [main.css](file:///Users/higashiyamaryou/Desktop/BaseDir/WAL/LP_WAL_KANPAIHUTTEWORKS/assets/css/main.css)
- `.company-logo`: `position: relative`, `overflow: hidden` を追加。
- `.company-logo-img`: カード背景としてのスタイルを調整。
  - デフォルト：グレースケール（または薄い色）、低透明度、中央配置（contain）。
  - ホバー時：フルカラー、透過なし、拡大（scale(1.2)など）。
- `.company-name`: 視認性を確保するための調整（微かなシャドウや配置の最適化）。

## Verification Plan

### Manual Verification
- `index.html` をブラウザで開き、「内定獲得企業」セクションを確認します。
- **デフォルト状態**: 企業ロゴがカードの背景として大きく（かつ控えめに）表示されていることを確認。
- **ホバー状態**:
  - ロゴが拡大され、フルカラーで鮮明に表示されることを確認。
  - カードに枠線が表示される（既存演出）ことを確認。
  - 企業ロゴの視認性が向上していることを確認。
- **レスポンシブ**: スマートフォンサイズでもカードのレイアウトが崩れず、ロゴが適切に表示されることを確認。
