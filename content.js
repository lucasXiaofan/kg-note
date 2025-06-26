chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    const descriptionTag = document.querySelector('meta[name="description"]');
    const summary = descriptionTag ? descriptionTag.content : '';
    sendResponse({
      title: document.title,
      url: window.location.href,
      summary: summary
    });
  }
});
