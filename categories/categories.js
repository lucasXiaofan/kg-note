document.addEventListener('DOMContentLoaded', function() {
  const categoriesContainer = document.getElementById('categories-container');
  const serverStatusIndicator = document.getElementById('server-status-indicator');
  const serverStatusText = document.getElementById('server-status-text');
  const testResult = document.getElementById('test-result');
  const editModal = document.getElementById('edit-modal');

  let currentEditingIndex = null;
  const API_BASE = 'http://localhost:8000';

  // Server status check
  async function checkServerStatus() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        serverStatusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
        serverStatusText.textContent = 'Server is running';
        return true;
      }
    } catch (error) {
      serverStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
      serverStatusText.textContent = 'Server is offline';
      return false;
    }
  }

  // Render categories with edit/delete buttons
  async function renderCategories() {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      const categories = await response.json();
      
      categoriesContainer.innerHTML = '';
      
      if (categories.length === 0) {
        categoriesContainer.innerHTML = `
          <div class="col-span-full text-center py-8">
            <p class="text-gray-400 text-lg">No categories created yet.</p>
            <p class="text-gray-500 text-sm mt-2">Add a new category above or test the categorization API!</p>
          </div>
        `;
        return;
      }

      categories.forEach((cat, index) => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow';
        
        categoryElement.innerHTML = `
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl font-bold text-yellow-400">${escapeHtml(cat.category)}</h3>
            <div class="flex gap-2">
              <button onclick="editCategory(${index})" class="text-blue-400 hover:text-blue-300 text-sm">✏️</button>
              <button onclick="deleteCategory(${index})" class="text-red-400 hover:text-red-300 text-sm">🗑️</button>
            </div>
          </div>
          <p class="text-gray-300 text-sm leading-relaxed">${escapeHtml(cat.definition)}</p>
          <div class="mt-3 text-xs text-gray-500">
            Category #${index + 1}
          </div>
        `;
        
        categoriesContainer.appendChild(categoryElement);
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      categoriesContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-red-500">❌ Could not load categories</p>
          <p class="text-gray-400 text-sm mt-2">Is the server running? <a href="http://localhost:8000/docs" target="_blank" class="text-blue-400 hover:underline">Check API docs</a></p>
        </div>
      `;
    }
  }

  // Add new category
  async function addCategory() {
    const name = document.getElementById('new-category-name').value.trim();
    const definition = document.getElementById('new-category-definition').value.trim();

    if (!name || !definition) {
      showNotification('Please fill in both category name and definition', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: name, definition })
      });

      if (response.ok) {
        document.getElementById('new-category-name').value = '';
        document.getElementById('new-category-definition').value = '';
        showNotification('Category added successfully!', 'success');
        renderCategories();
      } else {
        const error = await response.json();
        showNotification(error.detail || 'Failed to add category', 'error');
      }
    } catch (error) {
      showNotification('Failed to add category. Is the server running?', 'error');
    }
  }

  // Test categorization
  async function testCategorization() {
    const content = document.getElementById('test-note-content').value.trim();
    const url = document.getElementById('test-note-url').value.trim() || 'https://example.com';

    if (!content) {
      showNotification('Please enter some note content to test', 'error');
      return;
    }

    testResult.innerHTML = '<p class="text-yellow-400">🔄 Processing...</p>';

    try {
      const response = await fetch(`${API_BASE}/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, url })
      });

      const result = await response.json();
      
      testResult.innerHTML = `
        <div class="space-y-2">
          <p class="text-green-400 font-semibold">✅ Categorization Result:</p>
          <div class="bg-gray-600 rounded p-3">
            <p class="text-yellow-300 font-medium">${escapeHtml(result.category)}</p>
            ${result.definition ? `<p class="text-gray-300 text-sm mt-1">${escapeHtml(result.definition)}</p>` : ''}
          </div>
          ${result.definition ? '<p class="text-blue-400 text-sm">✨ New category created!</p>' : '<p class="text-gray-400 text-sm">📂 Existing category used</p>'}
        </div>
      `;
      
      if (result.definition) {
        renderCategories(); // Refresh if new category was created
      }
    } catch (error) {
      testResult.innerHTML = '<p class="text-red-500">❌ Failed to categorize. Is the server running?</p>';
    }
  }

  // Global functions for category management
  window.editCategory = function(index) {
    fetch(`${API_BASE}/categories`)
      .then(response => response.json())
      .then(categories => {
        const category = categories[index];
        document.getElementById('edit-category-name').value = category.category;
        document.getElementById('edit-category-definition').value = category.definition;
        currentEditingIndex = index;
        editModal.classList.remove('hidden');
      });
  };

  window.deleteCategory = async function(index) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`${API_BASE}/categories/${index}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showNotification('Category deleted successfully!', 'success');
        renderCategories();
      } else {
        showNotification('Failed to delete category', 'error');
      }
    } catch (error) {
      showNotification('Failed to delete category. Is the server running?', 'error');
    }
  };

  // Save edited category
  async function saveEdit() {
    const name = document.getElementById('edit-category-name').value.trim();
    const definition = document.getElementById('edit-category-definition').value.trim();

    if (!name || !definition) {
      showNotification('Please fill in both fields', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/categories/${currentEditingIndex}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: name, definition })
      });

      if (response.ok) {
        editModal.classList.add('hidden');
        showNotification('Category updated successfully!', 'success');
        renderCategories();
      } else {
        showNotification('Failed to update category', 'error');
      }
    } catch (error) {
      showNotification('Failed to update category. Is the server running?', 'error');
    }
  }

  // Utility functions
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Event listeners
  document.getElementById('add-category-btn').addEventListener('click', addCategory);
  document.getElementById('test-categorize-btn').addEventListener('click', testCategorization);
  document.getElementById('refresh-categories-btn').addEventListener('click', renderCategories);
  document.getElementById('save-edit-btn').addEventListener('click', saveEdit);
  document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    editModal.classList.add('hidden');
  });
  document.getElementById('clear-test-btn').addEventListener('click', () => {
    document.getElementById('test-note-content').value = '';
    document.getElementById('test-note-url').value = '';
    testResult.innerHTML = '<p class="text-gray-400">Test results will appear here...</p>';
  });

  // Close modal when clicking outside
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.classList.add('hidden');
    }
  });

  // Initialize
  checkServerStatus();
  renderCategories();
  
  // Check server status every 30 seconds
  setInterval(checkServerStatus, 30000);
});
