document.addEventListener('DOMContentLoaded', function() {
  const edit_textarea = document.getElementById('edit-textarea');
  const saveButton = document.getElementById('save-button');
  const cancelButton = document.getElementById('cancel-button');

  const urlParams = new URLSearchParams(window.location.search);
  const noteId = urlParams.get('id');

  chrome.storage.local.get({ notes: [] }, function(result) {
    const note = result.notes.find(n => n.id === noteId);
    if (note) {
      edit_textarea.value = note.content;
    }
  });

  saveButton.addEventListener('click', () => {
    const newContent = edit_textarea.value;
    chrome.storage.local.get({ notes: [] }, function(result) {
      const note = result.notes.find(n => n.id === noteId);
      if (note) {
        fetch('http://localhost:8000/categorize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newContent, url: note.url }),
        })
        .then(response => response.json())
        .then(data => {
          chrome.runtime.sendMessage({ action: 'editNote', id: noteId, content: newContent, category: data.category, definition: data.definition }, () => {
            chrome.windows.getCurrent(function(win) {
              chrome.windows.remove(win.id);
            });
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          // Save without category if API fails
          chrome.runtime.sendMessage({ action: 'editNote', id: noteId, content: newContent }, () => {
            chrome.windows.getCurrent(function(win) {
              chrome.windows.remove(win.id);
            });
          });
        });
      }
    });
  });

  cancelButton.addEventListener('click', () => {
    chrome.windows.getCurrent(function(win) {
      chrome.windows.remove(win.id);
    });
  });
});
