document.getElementById('add-bookmark').addEventListener('click', () => {
    console.log('Bookmark button clicked.');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        console.log('Injecting content script into tab:', tab.id);
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
    });
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
            bookmarkDiv.innerHTML = `
                <a href="${bookmark.url}" target="_blank">${bookmark.summary || bookmark.url}</a>
                <p>${bookmark.tags.join(', ')}</p>
            `;
            bookmarksList.appendChild(bookmarkDiv);
        });
    });
}

document.addEventListener('DOMContentLoaded', displayBookmarks);