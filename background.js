/**
 * NotebookLM URL Exporter - Background Service Worker
 * chrome.scripting.executeScriptでMAINワールドを使用してwindow.openをインターセプト
 * 
 * 更新履歴:
 * - 2026/01/20 v4: ポップアップブロック対応（MAINワールド実行）
 */

/**
 * メッセージリスナー
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received:', message.action);

    if (message.action === 'captureUrlFromPage') {
        // MAINワールドでスクリプトを実行してwindow.openをインターセプト
        const tabId = sender.tab?.id;
        if (!tabId) {
            sendResponse({ url: null });
            return true;
        }

        chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: 'MAIN', // ページコンテキストで実行
            func: () => {
                return new Promise((resolve) => {
                    const originalOpen = window.open;
                    let capturedUrl = null;

                    window.open = function (url) {
                        capturedUrl = url;
                        window.open = originalOpen;
                        return null; // タブを開かない
                    };

                    // リンクボタンをクリック
                    const linkButton = document.querySelector('.source-link-button');
                    const titleLink = document.querySelector('.source-title-link');

                    if (linkButton) {
                        linkButton.click();
                    } else if (titleLink) {
                        titleLink.click();
                    }

                    // 少し待ってから結果を返す
                    setTimeout(() => {
                        window.open = originalOpen;
                        resolve(capturedUrl);
                    }, 500);
                });
            }
        }).then(results => {
            const url = results?.[0]?.result;
            console.log('Captured URL:', url);
            sendResponse({ url: url || null });
        }).catch(e => {
            console.error('Script execution error:', e);
            sendResponse({ url: null });
        });

        return true; // 非同期レスポンス
    }

    if (message.action === 'downloadUrls') {
        const urls = message.urls || [];
        const titles = message.titles || [];

        let content = '# NotebookLM URL Export\n';
        content += `# Generated: ${new Date().toISOString()}\n`;
        content += `# Total: ${urls.length} URLs\n\n`;

        for (let i = 0; i < urls.length; i++) {
            if (titles[i]) {
                content += `## ${titles[i]}\n`;
            }
            content += `${urls[i]}\n\n`;
        }

        const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
        const filename = `notebooklm_urls_${new Date().toISOString().slice(0, 10)}.txt`;

        chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false
        }).then(() => {
            console.log('Download started:', filename);
            sendResponse({ success: true });
        }).catch(e => {
            console.error('Download error:', e);
            sendResponse({ success: false, error: e.message });
        });

        return true;
    }

    if (message.action === 'progress') {
        // popupに転送（もし開いていれば）
        return false;
    }
});

console.log('NotebookLM URL Exporter background script loaded (v4 - No Popup)');
