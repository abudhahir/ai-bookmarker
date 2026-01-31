console.log('Content script loaded and sending message.');
chrome.runtime.sendMessage({
    action: 'processContent',
    title: document.title,
    url: window.location.href,
    content: document.body.innerText
});