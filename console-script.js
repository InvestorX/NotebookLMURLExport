/**
 * NotebookLM URL Exporter - Console Script
 * DevToolsコンソールに貼り付けて実行するスクリプト
 * ポップアップブロッカー環境でも動作します
 * 
 * 使い方:
 * 1. NotebookLMページでF12キーでDevToolsを開く
 * 2. Consoleタブを選択
 * 3. このスクリプト全体をコピーして貼り付け
 * 4. Enterキーで実行
 */

(async function NotebookLMURLExporter() {
    'use strict';

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // ソースリストに戻る
    async function goBackToSourceList() {
        const existing = document.querySelectorAll('.single-source-container');
        if (existing.length > 0) return true;

        const elements = document.querySelectorAll('span, button, div');
        for (const el of elements) {
            if (el.textContent.trim() === 'ソース' && el.offsetParent !== null) {
                el.click();
                await sleep(1500);
                return true;
            }
        }
        return false;
    }

    // ソースを開く
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
                await sleep(2000);

                if (document.querySelector('.source-title-link, .source-link-button')) {
                    return { opened: true, title };
                }
            }
        }
        return { opened: false, title };
    }

    // window.openをインターセプトしてURLを取得
    async function captureUrl() {
        return new Promise(resolve => {
            const originalOpen = window.open;
            let captured = null;

            window.open = function (url) {
                captured = url;
                window.open = originalOpen;
                resolve(url);
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

            // タイムアウト
            setTimeout(() => {
                window.open = originalOpen;
                resolve(null);
            }, 2000);
        });
    }

    // メイン処理
    console.log('%c🔗 NotebookLM URL Exporter 開始', 'color: #ff6b9d; font-size: 16px;');

    await goBackToSourceList();

    const sources = document.querySelectorAll('.single-source-container');
    const total = sources.length;
    const results = [];

    console.log(`📚 ${total}件のソースを検出`);

    for (let i = 0; i < total; i++) {
        await goBackToSourceList();
        await sleep(500);

        const { opened, title } = await openSourceByIndex(i);

        if (!opened) {
            console.log(`[${i + 1}/${total}] ❌ 開けませんでした: ${title.substring(0, 40)}`);
            continue;
        }

        const url = await captureUrl();

        if (url) {
            results.push({ title, url });
            console.log(`[${i + 1}/${total}] ✅ ${url}`);
        } else {
            console.log(`[${i + 1}/${total}] ⚠️ URLなし: ${title.substring(0, 40)}`);
        }
    }

    await goBackToSourceList();

    // 結果を表示
    console.log('%c📋 抽出完了!', 'color: #00d4ff; font-size: 16px;');
    console.log(`${results.length}/${total}件のURLを取得`);

    // テキスト形式で出力
    const output = results.map(r => r.url).join('\n');
    console.log('%c--- URLリスト (コピー用) ---', 'color: #ff6b9d;');
    console.log(output);

    // クリップボードにコピー
    try {
        await navigator.clipboard.writeText(output);
        console.log('%c✅ クリップボードにコピーしました!', 'color: #00ff00; font-size: 14px;');
    } catch (e) {
        console.log('⚠️ クリップボードへのコピーに失敗しました。上のURLリストを手動でコピーしてください。');
    }

    return results;
})();
