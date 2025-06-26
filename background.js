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

      try {
        const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(fullContent);
        
        chrome.downloads.download({
          url: dataUrl,
          filename: 'knowledge-weaver-notes.md',
          saveAs: true
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('Download failed:', chrome.runtime.lastError);
            sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
          } else {
            console.log('Download started with ID:', downloadId);
            sendResponse({ status: 'success' });
          }
        });
      } catch (e) {
        console.error('Error during export:', e);
        sendResponse({ status: 'error', message: e.message });
      }
    });
    return true;
  } else if (request.action === 'deleteNote') {
    chrome.storage.local.get({ notes: [] }, function(result) {
      let notes = result.notes;
      notes = notes.filter(note => note.id !== request.id);
      chrome.storage.local.set({ notes: notes }, function() {
        sendResponse({ status: 'success' });
      });
    });
    return true;
  } else if (request.action === 'editNote') {
    chrome.storage.local.get({ notes: [] }, function(result) {
      let notes = result.notes;
      const noteIndex = notes.findIndex(note => note.id === request.id);
      if (noteIndex !== -1) {
        notes[noteIndex].content = request.content;
      }
      chrome.storage.local.set({ notes: notes }, function() {
        sendResponse({ status: 'success' });
      });
    });
    return true;
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    chrome.action.openPopup(() => {
      chrome.runtime.sendMessage({ action: 'focusPopup' });
    });
  }
});
