document.addEventListener('DOMContentLoaded', function() {
  const notesContainer = document.getElementById('notes-container');
  const editModal = document.getElementById('edit-modal');
  const edit_textarea = document.getElementById('edit-textarea');
  const cancelEditButton = document.getElementById('cancel-edit-button');
  const saveEditButton = document.getElementById('save-edit-button');
  let currentNoteId = null;

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
        editButton.className = 'py-1 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
          currentNoteId = note.id;
          edit_textarea.value = note.content;
          editModal.classList.remove('hidden');
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'py-1 px-3 bg-red-600 hover:bg-red-700 rounded-lg text-sm';
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

  cancelEditButton.addEventListener('click', () => {
    editModal.classList.add('hidden');
  });

  saveEditButton.addEventListener('click', () => {
    const newContent = edit_textarea.value;
    chrome.runtime.sendMessage({ action: 'editNote', id: currentNoteId, content: newContent }, () => {
      editModal.classList.add('hidden');
      renderNotes();
    });
  });

  renderNotes();
});
