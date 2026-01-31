document.getElementById('add-bookmark').addEventListener('click', () => {
    console.log('Bookmark button clicked.');
    const statusEl = document.getElementById('status-message');
    statusEl.classList.remove('hidden');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
            console.warn('Cannot inject script into restricted URL:', tab.url);
            alert('Cannot bookmark this page. Restricted URL.');
            statusEl.classList.add('hidden');
            return;
        }
        console.log('Injecting content script into tab:', tab.id);
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        }, () => {
            // Wait for background script to finish
        });
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'bookmarkSaved') {
        const statusEl = document.getElementById('status-message');
        statusEl.classList.add('hidden');
        displayBookmarks();
    } else if (request.action === 'bookmarkError') {
        const statusEl = document.getElementById('status-message');
        statusEl.textContent = request.message;
        statusEl.className = 'error'; // Apply error styling
    }
});

function displayBookmarks() {
    chrome.storage.local.get(['bookmarks'], (result) => {
        const bookmarksList = document.getElementById('bookmarks-list');
        bookmarksList.innerHTML = '';
        const bookmarks = result.bookmarks || [];
        console.log('Displaying bookmarks:', bookmarks);
        bookmarks.forEach(bookmark => {
            const bookmarkDiv = document.createElement('div');
            bookmarkDiv.className = 'bookmark';

            const titleText = bookmark.title || bookmark.url;
            const summaryText = bookmark.summary || 'No summary available.';
            const tagsHtml = bookmark.tags && bookmark.tags.length
                ? `<div class="tags">${bookmark.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
                : '';

            bookmarkDiv.innerHTML = `
                <a href="${bookmark.url}" target="_blank" class="bookmark-title">${titleText}</a>
                <div class="bookmark-details">
                    <p>${summaryText}</p>
                    ${tagsHtml}
                </div>
            `;
            bookmarksList.appendChild(bookmarkDiv);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    displayBookmarks();
    document.getElementById('open-dashboard').addEventListener('click', () => {
        chrome.tabs.create({ url: 'dashboard.html' });
    });
});