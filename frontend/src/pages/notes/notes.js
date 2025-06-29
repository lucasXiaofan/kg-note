document.addEventListener('DOMContentLoaded', function() {
  const notesContainer = document.getElementById('notes-container');
  const exportNotesButton = document.getElementById('export-notes-button');
  const categorizeAllButton = document.getElementById('categorize-all-button');
  const sortButton = document.getElementById('sort-button');
  const refreshStorageButton = document.getElementById('refresh-storage');
  
  // Sort state: 'newest' or 'oldest'
  let sortOrder = 'newest';

  // Chrome storage limits
  const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // 5 MB

  // Function to calculate storage usage
  function calculateStorageUsage() {
    chrome.storage.local.get(null, function(items) {
      const jsonString = JSON.stringify(items);
      const totalBytes = new Blob([jsonString]).size;
      
      // Calculate individual component sizes
      const notesBytes = items.notes ? new Blob([JSON.stringify(items.notes)]).size : 0;
      const categoriesString = JSON.stringify(items.categories || []);
      const categoriesBytes = new Blob([categoriesString]).size;
      
      // Format sizes for display
      const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      // Calculate usage percentage
      const usagePercentage = ((totalBytes / STORAGE_LIMIT_BYTES) * 100).toFixed(1);
      
      // Update UI elements
      document.getElementById('notes-usage').textContent = `${formatBytes(notesBytes)} (${items.notes ? items.notes.length : 0} notes)`;
      document.getElementById('categories-usage').textContent = `${formatBytes(categoriesBytes)} (${items.categories ? items.categories.length : 0} categories)`;
      document.getElementById('total-usage').textContent = formatBytes(totalBytes);
      document.getElementById('usage-percentage').textContent = `${usagePercentage}%`;
      document.getElementById('usage-text').textContent = `${formatBytes(totalBytes)} used`;
      
      // Update progress bar
      const usageBar = document.getElementById('usage-bar');
      usageBar.style.width = `${Math.min(parseFloat(usagePercentage), 100)}%`;
      
      // Change color based on usage
      if (parseFloat(usagePercentage) > 80) {
        usageBar.className = 'bg-red-500 h-2 rounded-full transition-all duration-300';
      } else if (parseFloat(usagePercentage) > 60) {
        usageBar.className = 'bg-yellow-500 h-2 rounded-full transition-all duration-300';
      } else {
        usageBar.className = 'bg-blue-500 h-2 rounded-full transition-all duration-300';
      }
    });
  }

  // Function to categorize a single note
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

  // Function to update a note's category (single)
  function updateNoteCategory(noteId, newCategory) {
    chrome.storage.local.get({ notes: [] }, function(result) {
      let notes = result.notes;
      const noteIndex = notes.findIndex(note => note.id === noteId);
      if (noteIndex !== -1) {
        notes[noteIndex].category = newCategory;
        chrome.storage.local.set({ notes: notes }, function() {
          renderNotes();
          calculateStorageUsage();
        });
      }
    });
  }

  // Function to update a note's categories (multiple)
  function updateNoteCategories(noteId, newCategories) {
    chrome.storage.local.get({ notes: [] }, function(result) {
      let notes = result.notes;
      const noteIndex = notes.findIndex(note => note.id === noteId);
      if (noteIndex !== -1) {
        notes[noteIndex].categories = newCategories;
        // Keep single category for backward compatibility
        notes[noteIndex].category = newCategories[0] || 'Uncategorized';
        chrome.storage.local.set({ notes: notes }, function() {
          renderNotes();
          calculateStorageUsage();
        });
      }
    });
  }

  // Function to create editable categories element with tags
  function createEditableCategories(note) {
    const categoryContainer = document.createElement('div');
    categoryContainer.className = 'mt-2';

    const categoryLabel = document.createElement('div');
    categoryLabel.className = 'text-sm text-gray-400 font-medium mb-1';
    categoryLabel.textContent = 'Categories:';

    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'flex flex-wrap gap-2 items-center';

    // Convert single category to array if needed
    let categories = note.categories;
    if (!categories) {
      categories = note.category ? [note.category] : ['Uncategorized'];
    }
    if (!Array.isArray(categories)) {
      categories = [categories];
    }

    // Create tag for each category
    categories.forEach((category, index) => {
      const tag = createCategoryTag(note.id, category, index, categories);
      tagsContainer.appendChild(tag);
    });

    // Add "+" button to add new categories
    const addButton = document.createElement('button');
    addButton.className = 'text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors';
    addButton.textContent = '+ Add';
    addButton.title = 'Add new category';

    addButton.addEventListener('click', function() {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'New category...';
      input.className = 'text-xs bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 focus:border-blue-500 focus:outline-none';
      input.style.width = '120px';

      const saveNewCategory = () => {
        const newCategory = input.value.trim();
        if (newCategory && !categories.includes(newCategory)) {
          const updatedCategories = [...categories, newCategory];
          updateNoteCategories(note.id, updatedCategories);
        }
      };

      const cancelAdd = () => {
        tagsContainer.replaceChild(addButton, input);
      };

      input.addEventListener('blur', () => {
        saveNewCategory();
        cancelAdd();
      });

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          saveNewCategory();
          cancelAdd();
        } else if (e.key === 'Escape') {
          cancelAdd();
        }
      });

      tagsContainer.replaceChild(input, addButton);
      input.focus();
    });

    tagsContainer.appendChild(addButton);

    categoryContainer.appendChild(categoryLabel);
    categoryContainer.appendChild(tagsContainer);
    return categoryContainer;
  }

  // Function to create individual category tag
  function createCategoryTag(noteId, category, index, allCategories) {
    const tag = document.createElement('div');
    tag.className = 'flex items-center bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 text-xs transition-colors group';

    const categoryText = document.createElement('span');
    categoryText.textContent = category;
    categoryText.className = 'cursor-pointer';
    categoryText.title = 'Click to edit category';

    // Edit category on click
    categoryText.addEventListener('click', function() {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = category;
      input.className = 'text-xs bg-gray-600 text-white px-1 rounded border border-gray-500 focus:border-blue-500 focus:outline-none';
      input.style.width = '80px';

      const saveEdit = () => {
        const newCategory = input.value.trim();
        if (newCategory && newCategory !== category) {
          const updatedCategories = [...allCategories];
          updatedCategories[index] = newCategory;
          updateNoteCategories(noteId, updatedCategories);
        }
      };

      const cancelEdit = () => {
        tag.replaceChild(categoryText, input);
      };

      input.addEventListener('blur', () => {
        saveEdit();
        cancelEdit();
      });

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          saveEdit();
          cancelEdit();
        } else if (e.key === 'Escape') {
          cancelEdit();
        }
      });

      tag.replaceChild(input, categoryText);
      input.focus();
      input.select();
    });

    // Remove category button (x)
    const removeButton = document.createElement('button');
    removeButton.className = 'ml-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity';
    removeButton.innerHTML = '×';
    removeButton.title = 'Remove category';

    removeButton.addEventListener('click', function(e) {
      e.stopPropagation();
      if (allCategories.length > 1) {
        const updatedCategories = allCategories.filter((_, i) => i !== index);
        updateNoteCategories(noteId, updatedCategories);
      } else {
        // If it's the last category, replace with "Uncategorized"
        updateNoteCategories(noteId, ['Uncategorized']);
      }
    });

    tag.appendChild(categoryText);
    tag.appendChild(removeButton);
    return tag;
  }

  function renderNotes() {
    notesContainer.innerHTML = '';
    chrome.storage.local.get({ notes: [] }, function(result) {
      let notes = result.notes;
      if (notes.length === 0) {
        notesContainer.innerHTML = '<div class="empty-state"><p class="text-gray-400 text-lg">📝 No notes saved yet.</p><p class="text-gray-500 text-sm mt-2">Start taking notes to build your knowledge base!</p></div>';
        return;
      }

      // Sort notes based on current sort order
      if (sortOrder === 'newest') {
        notes = notes.sort((a, b) => {
          const timeA = parseInt(a.id.split('-')[1]);
          const timeB = parseInt(b.id.split('-')[1]);
          return timeB - timeA; // Newest first
        });
      } else {
        notes = notes.sort((a, b) => {
          const timeA = parseInt(a.id.split('-')[1]);
          const timeB = parseInt(b.id.split('-')[1]);
          return timeA - timeB; // Oldest first
        });
      }
      
      // Group notes by domain for easier relationship visualization
      const notesByDomain = {};
      notes.forEach(note => {
        const domain = note.metadata?.domain || (note.url ? new URL(note.url).hostname : 'unknown');
        if (!notesByDomain[domain]) {
          notesByDomain[domain] = [];
        }
        notesByDomain[domain].push(note);
      });

      notes.forEach((note, index) => {
        const noteElement = document.createElement('div');
        noteElement.className = 'bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-200';
        noteElement.setAttribute('data-note-id', note.id);
        
        const noteHeader = document.createElement('div');
        noteHeader.className = 'flex justify-between items-center mb-3';
        
        const noteNumber = document.createElement('span');
        noteNumber.className = 'text-sm text-gray-400 font-medium';
        noteNumber.textContent = `Note #${notes.length - index}`;
        
        const noteDate = document.createElement('span');
        noteDate.className = 'text-sm text-gray-400';
        noteDate.textContent = new Date(parseInt(note.id.split('-')[1])).toLocaleDateString();
        
        noteHeader.appendChild(noteNumber);
        noteHeader.appendChild(noteDate);
        
        // Add webpage context metadata section
        const metadataSection = createMetadataSection(note, notesByDomain);

        // Create editable categories
        const noteCategories = createEditableCategories(note);

        const noteContent = document.createElement('div');
        noteContent.className = 'text-gray-100 whitespace-pre-wrap leading-relaxed note-content';
        noteContent.textContent = note.content;
        
        const noteActions = document.createElement('div');
        noteActions.className = 'mt-4 flex justify-end space-x-2';

        const editButton = document.createElement('button');
        editButton.className = 'py-2 px-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-bold';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
          const width = 800;
          const height = 600;
          const left = (screen.width / 2) - (width / 2);
          const top = (screen.height / 2) - (height / 2);

          chrome.windows.create({
            url: `../edit/edit.html?id=${note.id}`,
            type: 'popup',
            width: width,
            height: height,
            left: Math.round(left),
            top: Math.round(top)
          });
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
          chrome.runtime.sendMessage({ action: 'deleteNote', id: note.id }, () => {
            renderNotes();
            calculateStorageUsage();
          });
        });

        noteActions.appendChild(editButton);
        noteActions.appendChild(deleteButton);

        noteElement.appendChild(noteHeader);
        noteElement.appendChild(metadataSection);
        noteElement.appendChild(noteCategories);
        noteElement.appendChild(noteContent);
        noteElement.appendChild(noteActions);
        notesContainer.appendChild(noteElement);
      });
    });
  }

  // Categorize all uncategorized notes
  categorizeAllButton.addEventListener('click', async () => {
    const originalText = categorizeAllButton.textContent;
    categorizeAllButton.textContent = '🤖 Categorizing...';
    categorizeAllButton.disabled = true;

    chrome.storage.local.get({ notes: [] }, async function(result) {
      let notes = result.notes;
      const uncategorizedNotes = notes.filter(note => !note.category || note.category === 'Uncategorized' || note.category === 'General');
      
      if (uncategorizedNotes.length === 0) {
        alert('All notes are already categorized!');
        categorizeAllButton.textContent = originalText;
        categorizeAllButton.disabled = false;
        return;
      }

      let categorizedCount = 0;
      for (const note of uncategorizedNotes) {
        try {
          const categories = await categorizeNote(note.content, note.url);
          const noteIndex = notes.findIndex(n => n.id === note.id);
          if (noteIndex !== -1) {
            notes[noteIndex].categories = categories;
            notes[noteIndex].category = categories[0] || 'General'; // Backward compatibility
            categorizedCount++;
          }
          categorizeAllButton.textContent = `🤖 Categorizing... (${categorizedCount}/${uncategorizedNotes.length})`;
        } catch (error) {
          console.error('Error categorizing note:', error);
        }
      }

      chrome.storage.local.set({ notes: notes }, function() {
        categorizeAllButton.textContent = `✅ Categorized ${categorizedCount} notes`;
        setTimeout(() => {
          categorizeAllButton.textContent = originalText;
          categorizeAllButton.disabled = false;
          renderNotes();
          calculateStorageUsage();
        }, 2000);
      });
    });
  });

  exportNotesButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'exportNotes' });
  });

  // Sort button event listener
  sortButton.addEventListener('click', () => {
    if (sortOrder === 'newest') {
      sortOrder = 'oldest';
      sortButton.textContent = '🔄 Oldest First';
    } else {
      sortOrder = 'newest';
      sortButton.textContent = '🔄 Newest First';
    }
    renderNotes();
  });

  // Refresh storage button event listener
  refreshStorageButton.addEventListener('click', () => {
    calculateStorageUsage();
  });

  // Function to create metadata section showing webpage context and related notes
  function createMetadataSection(note, notesByDomain) {
    const metadataContainer = document.createElement('div');
    metadataContainer.className = 'mb-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50';
    
    // Webpage context
    const contextSection = document.createElement('div');
    contextSection.className = 'mb-2';
    
    // Check if this is a YouTube video note
    const isYouTube = note.relationships?.type === 'youtube_video';
    
    const contextLabel = document.createElement('div');
    contextLabel.className = 'text-xs font-medium mb-1';
    contextLabel.textContent = isYouTube ? '🎥 YouTube Video Context' : '📄 Webpage Context';
    contextLabel.classList.add(isYouTube ? 'text-red-300' : 'text-blue-300');
    
    const title = note.metadata?.title || 'Unknown Title';
    const url = note.metadata?.url || note.url || 'Unknown URL';
    const domain = note.metadata?.domain || (note.url ? new URL(note.url).hostname : 'unknown');
    
    const titleElement = document.createElement('div');
    titleElement.className = 'text-sm font-medium text-gray-200 truncate';
    titleElement.textContent = title;
    titleElement.title = title;
    
    const urlElement = document.createElement('div');
    urlElement.className = 'text-xs text-gray-400 truncate hover:text-blue-400 cursor-pointer';
    
    // Use timestamped URL for YouTube videos if available
    const displayUrl = isYouTube && note.relationships?.timestampedUrl ? note.relationships.timestampedUrl : url;
    const clickUrl = displayUrl;
    
    urlElement.textContent = displayUrl;
    urlElement.title = displayUrl;
    urlElement.addEventListener('click', () => {
      chrome.tabs.create({ url: clickUrl });
    });
    
    contextSection.appendChild(contextLabel);
    contextSection.appendChild(titleElement);
    contextSection.appendChild(urlElement);
    
    // Add YouTube-specific metadata
    if (isYouTube && note.relationships) {
      const youtubeInfo = document.createElement('div');
      youtubeInfo.className = 'mt-2 text-xs text-gray-300 bg-red-900/20 p-2 rounded border border-red-500/30';
      
      let youtubeDetails = '';
      if (note.relationships.channelName) {
        youtubeDetails += `📺 ${note.relationships.channelName}`;
      }
      if (note.relationships.videoTime !== null) {
        const minutes = Math.floor(note.relationships.videoTime / 60);
        const seconds = Math.floor(note.relationships.videoTime % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (youtubeDetails) youtubeDetails += ' • ';
        youtubeDetails += `⏰ ${timeString}`;
      }
      
      youtubeInfo.textContent = youtubeDetails;
      contextSection.appendChild(youtubeInfo);
    }
    
    // Related notes section with enhanced YouTube relationships
    const relatedSection = document.createElement('div');
    const domainNotes = notesByDomain[domain] || [];
    
    let exactPageNotes, sameDomainNotes, sameVideoNotes;
    
    if (isYouTube && note.relationships?.videoId) {
      // For YouTube, group by video ID instead of just URL
      sameVideoNotes = domainNotes.filter(n => 
        n.relationships?.videoId === note.relationships.videoId && n.id !== note.id
      );
      exactPageNotes = sameVideoNotes;
      sameDomainNotes = domainNotes.filter(n => 
        n.relationships?.videoId !== note.relationships.videoId && n.id !== note.id
      );
    } else {
      exactPageNotes = domainNotes.filter(n => (n.metadata?.url || n.url) === url && n.id !== note.id);
      sameDomainNotes = domainNotes.filter(n => (n.metadata?.url || n.url) !== url && n.id !== note.id);
    }
    
    if (exactPageNotes.length > 0 || sameDomainNotes.length > 0) {
      const relatedLabel = document.createElement('div');
      relatedLabel.className = 'text-xs font-medium text-yellow-300 mb-1 mt-2';
      relatedLabel.textContent = '🔗 Related Notes';
      
      const relatedInfo = document.createElement('div');
      relatedInfo.className = 'text-xs text-gray-300 space-y-1';
      
      if (exactPageNotes.length > 0) {
        const exactPageInfo = document.createElement('div');
        exactPageInfo.className = 'flex items-center space-x-2 cursor-pointer hover:text-blue-400';
        
        if (isYouTube) {
          exactPageInfo.innerHTML = `<span>🎥 ${exactPageNotes.length} note(s) from this video</span>`;
        } else {
          exactPageInfo.innerHTML = `<span>📝 ${exactPageNotes.length} note(s) from this page</span>`;
        }
        
        exactPageInfo.addEventListener('click', () => {
          highlightRelatedNotes(exactPageNotes.map(n => n.id));
        });
        relatedInfo.appendChild(exactPageInfo);
      }
      
      if (sameDomainNotes.length > 0) {
        const domainInfo = document.createElement('div');
        domainInfo.className = 'flex items-center space-x-2 cursor-pointer hover:text-blue-400';
        
        if (isYouTube) {
          domainInfo.innerHTML = `<span>🌐 ${sameDomainNotes.length} other YouTube video(s)</span>`;
        } else {
          domainInfo.innerHTML = `<span>🌐 ${sameDomainNotes.length} note(s) from ${domain}</span>`;
        }
        
        domainInfo.addEventListener('click', () => {
          highlightRelatedNotes(sameDomainNotes.map(n => n.id));
        });
        relatedInfo.appendChild(domainInfo);
      }
      
      relatedSection.appendChild(relatedLabel);
      relatedSection.appendChild(relatedInfo);
    }
    
    metadataContainer.appendChild(contextSection);
    if (relatedSection.children.length > 0) {
      metadataContainer.appendChild(relatedSection);
    }
    
    return metadataContainer;
  }
  
  // Function to highlight related notes
  function highlightRelatedNotes(noteIds) {
    // Remove existing highlights
    document.querySelectorAll('.bg-blue-900\/20').forEach(el => {
      el.classList.remove('bg-blue-900/20', 'border-blue-500/50');
      el.classList.add('bg-gray-800');
    });
    
    // Add highlight to related notes
    noteIds.forEach(noteId => {
      const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
      if (noteElement) {
        noteElement.classList.remove('bg-gray-800');
        noteElement.classList.add('bg-blue-900/20', 'border-blue-500/50');
        
        // Scroll to first related note
        if (noteIds.indexOf(noteId) === 0) {
          noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
    
    // Remove highlights after 5 seconds
    setTimeout(() => {
      document.querySelectorAll('.bg-blue-900\/20').forEach(el => {
        el.classList.remove('bg-blue-900/20', 'border-blue-500/50');
        el.classList.add('bg-gray-800');
      });
    }, 5000);
  }

  // Initial calls
  renderNotes();
  calculateStorageUsage();
});
