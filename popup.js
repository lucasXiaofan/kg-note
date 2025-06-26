document.addEventListener('DOMContentLoaded', function() {
  const noteArea = document.getElementById('note-area');
  const saveButton = document.getElementById('save-button');
  const exportButton = document.getElementById('export-button');
  const viewNotesButton = document.getElementById('view-notes-button');

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageContent' }, function(response) {
      if (response) {
        let noteContent = `# ${response.title}\n\n`;
        noteContent += `**URL:** ${response.url}\n\n`;
        if (response.summary) {
          noteContent += `**Summary:**\n${response.summary}\n\n`;
        }
        noteArea.value = noteContent;
        // Multiple attempts to ensure focus works
        setTimeout(() => {
          window.focus();
          noteArea.focus();
          noteArea.select();
        }, 50);
        setTimeout(() => {
          noteArea.focus();
          noteArea.setSelectionRange(noteArea.value.length, noteArea.value.length);
        }, 150);
      }
    });
  });

  noteArea.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      saveButton.click();
    }
  });

  exportButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'exportNotes' }, function(response) {
      if (response && response.status === 'error') {
        alert('Export failed: ' + response.message);
      } else if (response && response.status === 'success') {
        console.log('Export successful');
      }
    });
  });

  viewNotesButton.addEventListener('click', function() {
    chrome.tabs.create({ url: 'notes.html' });
  });

  saveButton.addEventListener('click', function() {
    const noteText = noteArea.value;
    if (noteText.trim() !== '') {
      chrome.runtime.sendMessage({
        action: 'saveNote',
        data: noteText
      }, function(response) {
        if (response && response.status === 'success') {
          noteArea.value = '';
        }
      });
    }
  });
});
