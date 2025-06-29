document.addEventListener('DOMContentLoaded', function() {
  const noteArea = document.getElementById('note-area');
  const saveButton = document.getElementById('save-button');
  const exportButton = document.getElementById('export-button');
  const viewNotesButton = document.getElementById('view-notes-button');
  const toggleContextButton = document.getElementById('toggle-context');
  const contextContent = document.getElementById('context-content');
  
  let pageContext = null;

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageContent' }, function(response) {
      if (response) {
        // Store context as metadata, don't add to note content
        pageContext = {
          title: response.title,
          url: response.url,
          summary: response.summary || '',
          domain: new URL(response.url).hostname,
          isYouTube: response.isYouTube || false,
          youtube: response.youtube || null
        };
        
        // Display context in the context section
        document.getElementById('page-title').textContent = response.title;
        document.getElementById('page-url').textContent = response.url;
        
        // Show summary if available
        const summaryElement = document.getElementById('page-summary');
        if (response.summary && response.summary.trim()) {
          summaryElement.textContent = response.summary;
          summaryElement.style.display = 'block';
        } else {
          summaryElement.style.display = 'none';
        }
        
        // Handle YouTube-specific content
        if (response.isYouTube && response.youtube) {
          const videoInfoElement = document.getElementById('video-info');
          const videoTitleElement = document.getElementById('video-title');
          const videoTimeElement = document.getElementById('video-time');
          
          videoTitleElement.textContent = response.youtube.videoTitle;
          videoTimeElement.textContent = `⏰ Current time: ${response.youtube.timeString} • 📺 ${response.youtube.channelName}`;
          videoInfoElement.style.display = 'block';
          
          // Auto-pause video when popup opens for note-taking
          chrome.tabs.sendMessage(tabs[0].id, { action: 'pauseVideo' });
        }
        
        // Check for related notes
        checkRelatedNotes(response.url);
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
    chrome.tabs.create({ url: 'src/pages/notes/notes.html' });
  });

  // Toggle context visibility
  toggleContextButton.addEventListener('click', function() {
    if (contextContent.style.display === 'none') {
      contextContent.style.display = 'block';
      toggleContextButton.textContent = 'Hide';
    } else {
      contextContent.style.display = 'none';
      toggleContextButton.textContent = 'Show';
    }
  });
  
  // Function to check for related notes
  function checkRelatedNotes(url) {
    chrome.storage.local.get({ notes: [] }, function(result) {
      const notes = result.notes;
      const domain = new URL(url).hostname;
      const exactUrlNotes = notes.filter(note => note.metadata && note.metadata.url === url);
      const sameWebsiteNotes = notes.filter(note => note.metadata && note.metadata.domain === domain && note.metadata.url !== url);
      
      if (exactUrlNotes.length > 0 || sameWebsiteNotes.length > 0) {
        const contextSection = document.getElementById('context-section');
        const relatedInfo = document.createElement('div');
        relatedInfo.className = 'text-xs text-yellow-300 mt-2 p-2 bg-yellow-900/20 rounded border border-yellow-700/30';
        
        let relatedText = '';
        if (exactUrlNotes.length > 0) {
          relatedText += `📝 ${exactUrlNotes.length} note(s) from this page`;
        }
        if (sameWebsiteNotes.length > 0) {
          if (relatedText) relatedText += ' • ';
          relatedText += `🌐 ${sameWebsiteNotes.length} note(s) from ${domain}`;
        }
        
        relatedInfo.innerHTML = `<div class="font-medium">🔗 Related Notes:</div><div>${relatedText}</div>`;
        contextSection.appendChild(relatedInfo);
      }
    });
  }

  saveButton.addEventListener('click', function() {
    const noteText = noteArea.value;
    if (noteText.trim() !== '') {
      // Show saving feedback
      saveButton.textContent = '💾 Categorizing...';
      saveButton.disabled = true;
      
      chrome.runtime.sendMessage({
        action: 'saveNote',
        data: {
          content: noteText,
          metadata: pageContext
        }
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
