// Function to categorize a note using the API
async function categorizeNote(content, url) {
  try {
    const response = await fetch('http://localhost:8000/categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, url })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Categorization result:', result);
      return result.categories || ['General'];
    } else {
      console.error('Categorization API error:', response.status);
      return ['General'];
    }
  } catch (error) {
    console.error('Failed to categorize note:', error);
    return ['General'];
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveNote') {
    const noteData = request.data;
    const noteContent = typeof noteData === 'string' ? noteData : noteData.content;
    const noteMetadata = typeof noteData === 'object' ? noteData.metadata : null;
    const noteId = `note-${Date.now()}`;
    
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
      const currentUrl = tabs[0].url;
      
      // Use metadata URL if available, otherwise current tab URL
      const contextUrl = noteMetadata?.url || currentUrl;
      
      // First, categorize the note
      console.log('Categorizing note...');
      const categories = await categorizeNote(noteContent, contextUrl);
      console.log('Note categorized as:', categories);
      
      chrome.storage.local.get({ notes: [] }, function(result) {
        const notes = result.notes;
        
        // Create note with separated content and metadata
        const note = {
          id: noteId,
          content: noteContent,
          metadata: noteMetadata || {
            title: tabs[0].title,
            url: currentUrl,
            domain: new URL(currentUrl).hostname,
            summary: ''
          },
          category: categories[0], // Backward compatibility
          categories: categories, // Support multiple categories
          timestamp: Date.now(),
          // YouTube-specific fields for knowledge graph
          relationships: {
            type: noteMetadata?.isYouTube ? 'youtube_video' : 'webpage',
            videoId: noteMetadata?.youtube?.videoId || null,
            videoTime: noteMetadata?.youtube?.currentTime || null,
            channelName: noteMetadata?.youtube?.channelName || null,
            timestampedUrl: noteMetadata?.youtube?.timestampedUrl || null
          }
        };
        
        // For backward compatibility, also store url at root level
        note.url = note.metadata.url;
        
        notes.push(note);
        chrome.storage.local.set({ notes: notes }, function() {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
          } else {
            sendResponse({ status: 'success', category: categories[0] });
          }
        });
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
        if (request.category) {
          notes[noteIndex].category = request.category;
        }
        if (request.definition) {
          // Store definition, maybe in a separate storage if it gets large
          notes[noteIndex].definition = request.definition;
        }
      }
      chrome.storage.local.set({ notes: notes }, function() {
        sendResponse({ status: 'success' });
      });
    });
    return true;
  }
});

// Handle overlay toggle with secondary hotkey
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle_overlay') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showOverlay' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Content script not ready:', chrome.runtime.lastError.message);
            // Fallback: inject content script and try again
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['content/content.js']
            }, () => {
              setTimeout(() => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'showOverlay' });
              }, 100);
            });
          }
        });
      }
    });
  }
});

// Handle primary hotkey for popup
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // Default popup behavior
  }
});
