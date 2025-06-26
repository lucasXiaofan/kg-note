document.addEventListener('DOMContentLoaded', function() {
  const notesContainer = document.getElementById('notes-container');
  const exportNotesButton = document.getElementById('export-notes-button');

  function renderNotes() {
    notesContainer.innerHTML = '';
    chrome.storage.local.get({ notes: [] }, function(result) {
      const notes = result.notes;
      if (notes.length === 0) {
        notesContainer.innerHTML = '<div class="empty-state"><p class="text-gray-400 text-lg">📝 No notes saved yet.</p><p class="text-gray-500 text-sm mt-2">Start taking notes to build your knowledge base!</p></div>';
        return;
      }

      notes.forEach((note, index) => {
        const noteElement = document.createElement('div');
        noteElement.className = 'bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-200';
        
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
            url: `edit.html?id=${note.id}`,
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
          });
        });

        noteActions.appendChild(editButton);
        noteActions.appendChild(deleteButton);

        noteElement.appendChild(noteHeader);
        noteElement.appendChild(noteContent);
        noteElement.appendChild(noteActions);
        notesContainer.appendChild(noteElement);
      });
    });
  }


  exportNotesButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'exportNotes' });
  });

  renderNotes();
});
