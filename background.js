chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveNote') {
    const noteContent = request.data;
    const noteId = `note-${Date.now()}`;
    chrome.storage.local.get({ notes: [] }, function(result) {
      const notes = result.notes;
      notes.push({ id: noteId, content: noteContent });
      chrome.storage.local.set({ notes: notes }, function() {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
        } else {
          sendResponse({ status: 'success' });
        }
      });
    });
    return true;
  } else if (request.action === 'exportNotes') {
    chrome.storage.local.get({ notes: [] }, function(result) {
      const notes = result.notes;
      console.log('Export notes:', notes.length);
      if (notes.length === 0) {
        console.log('No notes to export');
        sendResponse({ status: 'error', message: 'No notes to export' });
        return;
      }
      let fullContent = '';
      notes.forEach(note => {
        fullContent += note.content + '\n\n---\n\n';
      });

      const blob = new Blob([fullContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download({
        url: url,
        filename: 'knowledge-weaver-notes.md',
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
        } else {
          console.log('Download started:', downloadId);
          sendResponse({ status: 'success', downloadId: downloadId });
        }
        URL.revokeObjectURL(url);
      });
    });
    return true;
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    chrome.action.openPopup();
  }
});
