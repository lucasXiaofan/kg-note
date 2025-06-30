// Helper functions for export functionality
function extractDomain(url) {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return '';
  }
}

function generateRelationships(notes) {
  const relationships = [];
  
  // Group notes by domain
  const domainGroups = {};
  notes.forEach(note => {
    const domain = note.metadata?.domain || extractDomain(note.metadata?.url || note.url || '');
    if (domain) {
      if (!domainGroups[domain]) domainGroups[domain] = [];
      domainGroups[domain].push(note.id);
    }
  });
  
  // Group notes by category
  const categoryGroups = {};
  notes.forEach(note => {
    if (note.categories) {
      note.categories.forEach(category => {
        if (!categoryGroups[category]) categoryGroups[category] = [];
        categoryGroups[category].push(note.id);
      });
    }
  });
  
  // Generate domain relationships
  Object.values(domainGroups).forEach(noteIds => {
    if (noteIds.length > 1) {
      for (let i = 0; i < noteIds.length - 1; i++) {
        for (let j = i + 1; j < noteIds.length; j++) {
          relationships.push({
            from: noteIds[i],
            to: noteIds[j],
            type: 'same_domain',
            strength: 0.7
          });
        }
      }
    }
  });
  
  // Generate category relationships
  Object.values(categoryGroups).forEach(noteIds => {
    if (noteIds.length > 1) {
      for (let i = 0; i < noteIds.length - 1; i++) {
        for (let j = i + 1; j < noteIds.length; j++) {
          relationships.push({
            from: noteIds[i],
            to: noteIds[j],
            type: 'same_category',
            strength: 0.8
          });
        }
      }
    }
  });
  
  return relationships;
}

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
    const exportFormat = request.format || 'json'; // Default to JSON for comprehensive export
    
    chrome.storage.local.get(null, function(result) {
      const notes = result.notes || [];
      const categories = result.categories || [];
      
      console.log('Export notes:', notes.length, 'categories:', categories.length, 'format:', exportFormat);
      
      if (notes.length === 0) {
        console.log('No notes to export');
        sendResponse({ status: 'error', message: 'No notes to export' });
        return;
      }

      try {
        let exportData, filename, mimeType;
        
        if (exportFormat === 'json') {
          // Comprehensive JSON export for full database restoration
          exportData = {
            metadata: {
              exportDate: new Date().toISOString(),
              version: "2.0.0",
              totalNotes: notes.length,
              totalCategories: categories.length,
              source: "Knowledge Weaver Chrome Extension"
            },
            categories: categories,
            notes: notes.map(note => ({
              // Core note data
              id: note.id,
              content: note.content,
              timestamp: note.timestamp,
              
              // Category information
              categories: note.categories || [],
              
              // Webpage context (enhanced)
              metadata: {
                title: note.metadata?.title || '',
                url: note.metadata?.url || note.url || '',
                domain: note.metadata?.domain || extractDomain(note.metadata?.url || note.url || ''),
                summary: note.metadata?.summary || ''
              },
              
              // Additional context for KG building
              context: {
                pageTitle: note.metadata?.title || '',
                sourceUrl: note.metadata?.url || note.url || '',
                websiteDomain: note.metadata?.domain || extractDomain(note.metadata?.url || note.url || ''),
                captureDate: note.timestamp ? new Date(note.timestamp).toISOString() : null,
                contentLength: note.content?.length || 0,
                wordCount: note.content ? note.content.split(/\s+/).length : 0
              }
            })),
            
            // Knowledge graph preparation data
            knowledgeGraph: {
              domains: [...new Set(notes.map(note => 
                note.metadata?.domain || extractDomain(note.metadata?.url || note.url || '')
              ).filter(Boolean))],
              
              urls: [...new Set(notes.map(note => 
                note.metadata?.url || note.url || ''
              ).filter(Boolean))],
              
              categoryUsage: categories.map(cat => ({
                category: cat.category,
                definition: cat.definition,
                noteCount: notes.filter(note => 
                  note.categories && note.categories.includes(cat.category)
                ).length
              })),
              
              relationships: generateRelationships(notes)
            }
          };
          
          filename = `knowledge-weaver-complete-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          
        } else if (exportFormat === 'markdown') {
          // Enhanced markdown export with full metadata
          let fullContent = `# Knowledge Weaver Export\n\n`;
          fullContent += `**Export Date:** ${new Date().toISOString()}\n`;
          fullContent += `**Total Notes:** ${notes.length}\n`;
          fullContent += `**Total Categories:** ${categories.length}\n\n`;
          
          // Export categories first
          if (categories.length > 0) {
            fullContent += `## Categories\n\n`;
            categories.forEach(category => {
              fullContent += `### ${category.category}\n`;
              fullContent += `${category.definition}\n\n`;
            });
            fullContent += `---\n\n`;
          }
          
          // Export notes with full metadata
          fullContent += `## Notes\n\n`;
          notes.forEach((note, index) => {
            fullContent += `### Note ${index + 1}\n\n`;
            
            // Metadata section
            fullContent += `**Created:** ${note.timestamp ? new Date(note.timestamp).toISOString() : 'Unknown'}\n`;
            fullContent += `**Categories:** ${note.categories ? note.categories.join(', ') : 'None'}\n`;
            
            if (note.metadata?.title) {
              fullContent += `**Page Title:** ${note.metadata.title}\n`;
            }
            if (note.metadata?.url || note.url) {
              fullContent += `**Source URL:** ${note.metadata?.url || note.url}\n`;
            }
            if (note.metadata?.domain) {
              fullContent += `**Domain:** ${note.metadata.domain}\n`;
            }
            if (note.metadata?.summary) {
              fullContent += `**Page Summary:** ${note.metadata.summary}\n`;
            }
            
            fullContent += `\n**Content:**\n${note.content}\n\n---\n\n`;
          });
          
          exportData = fullContent;
          filename = `knowledge-weaver-notes-${new Date().toISOString().split('T')[0]}.md`;
          mimeType = 'text/markdown';
          
        } else if (exportFormat === 'csv') {
          // CSV export for spreadsheet analysis
          const csvRows = [];
          csvRows.push([
            'ID', 'Content', 'Timestamp', 'Created Date', 'Categories', 
            'Page Title', 'URL', 'Domain', 'Summary', 'Word Count'
          ]);
          
          notes.forEach(note => {
            csvRows.push([
              note.id || '',
              note.content ? note.content.replace(/"/g, '""') : '',
              note.timestamp || '',
              note.timestamp ? new Date(note.timestamp).toISOString() : '',
              note.categories ? note.categories.join('; ') : '',
              note.metadata?.title || '',
              note.metadata?.url || note.url || '',
              note.metadata?.domain || extractDomain(note.metadata?.url || note.url || ''),
              note.metadata?.summary || '',
              note.content ? note.content.split(/\s+/).length : 0
            ]);
          });
          
          exportData = csvRows.map(row => 
            row.map(cell => `"${cell}"`).join(',')
          ).join('\n');
          
          filename = `knowledge-weaver-notes-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
        }
        
        const dataUrl = `data:${mimeType};charset=utf-8,` + encodeURIComponent(
          typeof exportData === 'object' ? JSON.stringify(exportData, null, 2) : exportData
        );
        
        chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: true
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('Download failed:', chrome.runtime.lastError);
            sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
          } else {
            console.log('Download started with ID:', downloadId);
            sendResponse({ status: 'success', filename: filename });
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
