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
    chrome.tabs.create({ url: 'notes/notes.html' });
  });

  saveButton.addEventListener('click', function() {
    const noteText = noteArea.value;
    if (noteText.trim() !== '') {
      // Show saving feedback
      saveButton.textContent = '💾 Categorizing...';
      saveButton.disabled = true;
      
      chrome.runtime.sendMessage({
        action: 'saveNote',
        data: noteText
      }, function(response) {
        if (response && response.status === 'success') {
          if (response.category) {
            saveButton.textContent = `✅ Saved as: ${response.category}`;
            setTimeout(() => window.close(), 1000);
          } else {
            window.close();
          }
        } else {
          saveButton.textContent = '💾 Save Note';
          saveButton.disabled = false;
        }
      });
    }
  });
});
