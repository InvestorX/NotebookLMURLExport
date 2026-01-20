/**
 * NotebookLM URL Exporter - Content Script
 * ポップアップブロック環境でも動作するバージョン
 * 
 * 更新履歴:
 * - 2026/01/20 v9: ポップアップブロック対応（タブを開かずにURLを取得）
 */

/**
 * 指定ミリ秒待機する
 * @param {number} ms - 待機時間（ミリ秒）
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 要素が表示されるまで待機
 * @param {string} selector - CSSセレクタ
 * @param {number} timeout - タイムアウト（ミリ秒）
 * @returns {Promise<Element|null>}
 */
async function waitForElement(selector, timeout = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    await sleep(50);
  }
  return null;
}

/**
 * ソースリストに戻る
 * @returns {Promise<boolean>}
 */
async function goBackToSourceList() {
  const existing = document.querySelectorAll('.single-source-container');
  if (existing.length > 0) return true;

  const elements = document.querySelectorAll('span, button, div');
  for (const el of elements) {
    if (el.textContent.trim() === 'ソース' && el.offsetParent !== null) {
      el.click();
      await waitForElement('.single-source-container', 2000);
      await sleep(300);
      return true;
    }
  }
  return false;
}

/**
 * 特定のソースをクリックしてソースガイドを開く
 * @param {number} index - ソースのインデックス
 * @returns {Promise<{opened: boolean, title: string}>}
 */
async function openSourceByIndex(index) {
  const sources = document.querySelectorAll('.single-source-container');
  if (index >= sources.length) return { opened: false, title: '' };

  const container = sources[index];
  const titleEl = container.querySelector('.source-title') || container.querySelector('div');
  const title = titleEl?.textContent?.trim() || `Source ${index + 1}`;

  const divs = container.querySelectorAll('div');
  for (const div of divs) {
    const text = div.innerText?.trim();
    if (text && text.length > 10 && !div.querySelector('mat-icon')) {
      div.click();
      const linkEl = await waitForElement('.source-title-link, .source-link-button', 2000);
      if (linkEl) {
        return { opened: true, title };
      }
    }
  }
  return { opened: false, title };
}

/**
 * backgroundにURL抽出をリクエスト（MAINワールドで実行）
 * @returns {Promise<string|null>}
 */
async function extractUrlViaBackground() {
  return new Promise((resolve) => {
    // backgroundに依頼
    chrome.runtime.sendMessage({ action: 'captureUrlFromPage' }, (response) => {
      resolve(response?.url || null);
    });
  });
}

/**
 * すべてのソースからURLを抽出
 * @param {Function} onProgress - 進捗コールバック
 * @returns {Promise<{urls: Array<{title: string, url: string}>, error?: string}>}
 */
async function extractAllUrls(onProgress) {
  try {
    const results = [];

    await goBackToSourceList();

    const sources = document.querySelectorAll('.single-source-container');
    const total = sources.length;

    if (total === 0) {
      return { urls: [], error: 'ソースが見つかりませんでした' };
    }

    console.log(`Found ${total} sources`);

    for (let i = 0; i < total; i++) {
      if (onProgress) {
        onProgress(i + 1, total, `${i + 1}/${total}`);
      }

      await goBackToSourceList();
      await sleep(300);

      const { opened, title } = await openSourceByIndex(i);

      if (!opened) {
        console.log(`[${i + 1}] ❌ Failed to open`);
        continue;
      }

      // backgroundにURL抽出を依頼
      const url = await extractUrlViaBackground();

      if (url) {
        console.log(`[${i + 1}] ✓ ${url.substring(0, 50)}...`);
        results.push({ title, url });
      } else {
        console.log(`[${i + 1}] ⚠️ No URL`);
      }
    }

    await goBackToSourceList();

    console.log(`Extraction complete: ${results.length}/${total} URLs`);

    return { urls: results, total };

  } catch (error) {
    console.error('Extract error:', error);
    return { urls: [], error: error.message };
  }
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractUrls') {
    const autoSave = message.autoSave !== false; // デフォルトtrue

    (async () => {
      const result = await extractAllUrls((current, total, title) => {
        try {
          chrome.runtime.sendMessage({ action: 'progress', current, total, title });
        } catch (e) { }
      });

      // 自動保存が有効な場合のみダウンロード
      if (autoSave && result.urls && result.urls.length > 0) {
        await chrome.runtime.sendMessage({
          action: 'downloadUrls',
          urls: result.urls.map(r => r.url),
          titles: result.urls.map(r => r.title)
        });
      }

      sendResponse(result);
    })();
    return true;
  }
});

console.log('NotebookLM URL Exporter content script loaded (v9 - No Popup)');
