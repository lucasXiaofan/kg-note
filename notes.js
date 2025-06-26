document.addEventListener('DOMContentLoaded', function() {
  const notesContainer = document.getElementById('notes-container');

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
      
      noteElement.appendChild(noteHeader);
      noteElement.appendChild(noteContent);
      notesContainer.appendChild(noteElement);
    });
  });
});
