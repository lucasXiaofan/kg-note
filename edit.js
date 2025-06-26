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
    chrome.runtime.sendMessage({ action: 'editNote', id: noteId, content: newContent }, () => {
      chrome.windows.getCurrent(function(win) {
        chrome.windows.remove(win.id);
      });
    });
  });

  cancelButton.addEventListener('click', () => {
    chrome.windows.getCurrent(function(win) {
      chrome.windows.remove(win.id);
    });
  });
});
