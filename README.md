# NotebookLM URL Exporter

<p align="center">
  <img src="https://github.com/InvestorX/NotebookLMURLExport/blob/main/icon.png" alt="NotebookLM URL Exporter" width="128" height="128">
</p>

<p align="center">
  <strong>NotebookLMのソースからURLを一括抽出するChrome拡張機能</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-green?style=flat-square&logo=googlechrome" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/License-SUSHI--WARE-ff6b9d?style=flat-square" alt="SUSHI-WARE License">
</p>

---

## 📖 概要

NotebookLM URL Exporterは、Google NotebookLMに登録されたWebサイトソースから元URLを一括で抽出し、テキストファイルとして保存できるChrome拡張機能です。

### ✨ 特徴

- 🚀 **高速抽出**: 300件のソースでも約5分で処理
- 🛡️ **ポップアップブロック対応**: タブを開かずにURLを取得
- 💾 **自動保存**: 抽出完了後に自動でファイルをダウンロード
- 🎨 **サイバーパンクUI**: 攻殻機動隊風のダークテーマデザイン

---

## 🔧 インストール

### 開発版（パッケージ化されていない拡張機能）

1. このリポジトリをクローンまたはダウンロード
   ```bash
   git clone https://github.com/yourusername/notebooklm-url-exporter.git
   ```

2. Chromeで `chrome://extensions` を開く

3. 右上の「**デベロッパーモード**」をONにする

4. 「**パッケージ化されていない拡張機能を読み込む**」をクリック

5. ダウンロードしたフォルダを選択

---

## 📝 使い方

1. [NotebookLM](https://notebooklm.google.com/) でノートブックを開く

2. 拡張機能アイコンをクリック

3. 「**EXECUTE**」ボタンをクリック

4. 抽出完了後、URLリストが自動でダウンロードされます

### オプション

| オプション | 説明 |
|-----------|------|
| AUTO_SAVE | ONにすると抽出完了後に自動保存（デフォルト: ON） |

---

## 📁 出力ファイル形式

ファイル名: `notebooklm_urls_YYYY-MM-DD.txt`

---

## 📂 ファイル構成

```
notebooklmURLExport/
├── manifest.json       # 拡張機能設定
├── background.js       # Service Worker (URLキャプチャ)
├── content.js          # コンテンツスクリプト (DOM操作)
├── popup.html          # ポップアップUI
├── popup.css           # スタイル (サイバーパンク風)
├── popup.js            # ポップアップロジック
├── console-script.js   # DevToolsコンソール用スクリプト
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## ⚠️ 注意事項

- **対応ソース**: Webサイト、YouTube動画などのURL付きソースのみ
- **非対応**: PDFアップロード、テキスト貼り付けなどはURLを持たないため抽出不可
- **動作環境**: Google Chrome (Manifest V3対応)

---

## 🛠️ 技術仕様

- **Manifest Version**: 3
- **URL抽出方式**: `chrome.scripting.executeScript` (MAIN world)
- **ポップアップブロック回避**: `window.open` インターセプト方式
- **自動ダウンロード**: `chrome.downloads` API

---

## 📜 ライセンス

SUSHI-WARE License 🍣

> このソフトウェアを使用して気に入ったら、作者に寿司をおごってください。

---

## 🤝 コントリビュート

Issues や Pull Requests は歓迎します！

---

<p align="center">
  Made with ❤️ for NotebookLM users
</p>

