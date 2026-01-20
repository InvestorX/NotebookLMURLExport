/**
 * NotebookLM URL Exporter - Popup Script
 * 攻殻機動隊風UI対応版
 */

const elements = {
  exportBtn: document.getElementById('exportBtn'),
  autoSave: document.getElementById('autoSave'),
  status: document.getElementById('status'),
  statusText: document.getElementById('statusText'),
  progressContainer: document.getElementById('progressContainer'),
  progressBar: document.getElementById('progressBar'),
  progressText: document.getElementById('progressText'),
  results: document.getElementById('results'),
  urlList: document.getElementById('urlList'),
  urlCount: document.getElementById('urlCount'),
  copyBtn: document.getElementById('copyBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  error: document.getElementById('error'),
  errorText: document.getElementById('errorText')
};

let extractedUrls = [];

function showStatus(text) {
  elements.status.classList.remove('hidden');
  elements.statusText.textContent = text;
  elements.results.classList.add('hidden');
  elements.error.classList.add('hidden');
}

function updateProgress(current, total) {
  elements.progressContainer.classList.remove('hidden');
  const percentage = Math.round((current / total) * 100);
  elements.progressBar.style.width = `${percentage}%`;
  elements.progressText.textContent = `${current}/${total}`;
}

function hideStatus() {
  elements.status.classList.add('hidden');
  elements.progressContainer.classList.add('hidden');
}

function showError(message) {
  elements.error.classList.remove('hidden');
  elements.errorText.textContent = message;
  elements.status.classList.add('hidden');
  elements.progressContainer.classList.add('hidden');
  elements.results.classList.add('hidden');
}

function showResults(urlData) {
  extractedUrls = urlData.map(d => d.url);
  elements.results.classList.remove('hidden');
  elements.status.classList.add('hidden');
  elements.progressContainer.classList.add('hidden');
  elements.error.classList.add('hidden');

  elements.urlCount.textContent = urlData.length;

  elements.urlList.innerHTML = '';
  urlData.forEach((data, index) => {
    const li = document.createElement('li');
    li.className = 'url-item';
    li.innerHTML = `
      <div class="url-title">[${String(index + 1).padStart(2, '0')}] ${data.title.substring(0, 35)}${data.title.length > 35 ? '...' : ''}</div>
      <a href="${data.url}" target="_blank">${data.url}</a>
    `;
    elements.urlList.appendChild(li);
  });
}

async function exportUrls() {
  try {
    elements.exportBtn.disabled = true;
    showStatus('EXTRACTING...');
    elements.progressContainer.classList.remove('hidden');
    elements.progressBar.style.width = '0%';
    elements.progressText.textContent = 'INIT...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('NO_ACTIVE_TAB');
    }

    if (!tab.url || !tab.url.includes('notebooklm.google.com')) {
      throw new Error('INVALID_PAGE: NotebookLM required');
    }

    // 自動保存設定をcontent.jsに送信
    const autoSave = elements.autoSave.checked;

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractUrls',
      autoSave: autoSave
    });

    if (response.error) {
      throw new Error(response.error);
    }

    if (response.urls && response.urls.length > 0) {
      showResults(response.urls);
    } else {
      showError('NO_URLS_FOUND');
    }
  } catch (error) {
    console.error('Export error:', error);
    showError(error.message || 'UNKNOWN_ERROR');
  } finally {
    elements.exportBtn.disabled = false;
    hideStatus();
  }
}

async function copyUrls() {
  if (extractedUrls.length === 0) return;

  try {
    await navigator.clipboard.writeText(extractedUrls.join('\n'));
    elements.copyBtn.innerHTML = '<span>✓</span> COPIED';
    setTimeout(() => {
      elements.copyBtn.innerHTML = '<span>⎘</span> COPY';
    }, 2000);
  } catch (error) {
    showError('COPY_FAILED');
  }
}

function downloadUrls() {
  if (extractedUrls.length === 0) return;

  const text = extractedUrls.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `notebooklm_urls_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  elements.downloadBtn.innerHTML = '<span>✓</span> SAVED';
  setTimeout(() => {
    elements.downloadBtn.innerHTML = '<span>↓</span> SAVE';
  }, 2000);
}

// 進捗メッセージのリスナー
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'progress') {
    updateProgress(message.current, message.total);
  }
});

// イベントリスナー
elements.exportBtn.addEventListener('click', exportUrls);
elements.copyBtn.addEventListener('click', copyUrls);
elements.downloadBtn.addEventListener('click', downloadUrls);
