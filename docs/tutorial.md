# Knowledge Weaver: Backend & Frontend Tutorial

This tutorial covers the essential backend and frontend knowledge used in the Knowledge Weaver project, focusing on practical implementation patterns rather than basic syntax.

## Table of Contents

1. [FastAPI Backend Architecture](#fastapi-backend-architecture)
2. [Async Programming Patterns](#async-programming-patterns)
3. [Local vs Production Server Deployment](#local-vs-production-server-deployment)
4. [Chrome Extension Architecture](#chrome-extension-architecture)
5. [JavaScript Patterns in Extensions](#javascript-patterns-in-extensions)
6. [Project-Specific Implementation Guide](#project-specific-implementation-guide)

---

## FastAPI Backend Architecture

### Core FastAPI Concepts in Our Project

#### 1. Application Structure
```python
# api/api.py - Our main FastAPI application
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Knowledge Weaver API",
    description="API for categorizing notes and managing categories",
    version="1.0.0"
)

# CORS middleware for browser requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Key Points:**
- FastAPI automatically generates OpenAPI documentation at `/docs`
- CORS middleware allows browser-based extensions to call the API
- Title and description appear in the auto-generated documentation

#### 2. Request/Response Models with Pydantic
```python
from pydantic import BaseModel

class Note(BaseModel):
    content: str
    url: str = ""  # Optional with default value

class Category(BaseModel):
    category: str
    definition: str
```

**Benefits:**
- Automatic request validation
- Type hints for IDE support
- Auto-generated API documentation with schemas
- Serialization/deserialization handling

#### 3. Route Patterns in Our Project
```python
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Knowledge Weaver API is running"}

@app.post("/categorize")
async def categorize_note(note: Note):
    # Process the note and return categories
    pass
```

**Pattern Analysis:**
- Health endpoints for monitoring
- RESTful design (`GET`, `POST`, `PUT`, `DELETE`)
- Async functions for I/O operations
- Clear docstrings for auto-documentation

---

## Async Programming Patterns

### Understanding Async in Our Context

#### 1. When to Use Async vs Sync in FastAPI (2024 Best Practices)

**Use Async When:**
- Making HTTP requests to external APIs (like DeepSeek API)
- Database operations with async drivers
- File I/O operations
- Any operation that involves waiting

**Use Sync When:**
- CPU-intensive calculations
- Simple data transformations
- Working with sync libraries

#### 2. Our LLM API Integration Pattern
```python
async def categorize_note(note: Note):
    try:
        # Async HTTP request to external LLM API
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={'type': 'json_object'},
            temperature=0.1,
            stream=False
        )
        
        # Process response
        raw_response = response.choices[0].message.content
        category_data = json.loads(raw_response)
        
        return category_data
    except Exception as e:
        # Error handling for production
        return {"categories": ["General"], "error": str(e)}
```

**Key Patterns:**
- Use `await` for external API calls
- Proper exception handling for unreliable external services
- Structured error responses
- JSON parsing with fallbacks

#### 3. Async Best Practices from Our Project

**File Operations:**
```python
def read_categories():
    # Sync file operations are fine for small files
    with open(CATEGORIES_FILE, "r") as f:
        return json.load(f)

def write_categories(categories):
    # Ensure directory exists
    os.makedirs(os.path.dirname(CATEGORIES_FILE), exist_ok=True)
    with open(CATEGORIES_FILE, "w") as f:
        json.dump(categories, f, indent=2)
```

**Database-like Operations:**
```python
# Our simple file-based storage pattern
async def add_category(category: Category):
    categories = read_categories()  # Sync operation
    
    # Check for duplicates
    for existing in categories:
        if existing["category"].lower() == category.category.lower():
            raise HTTPException(status_code=400, detail="Category already exists")
    
    categories.append(category.model_dump())
    write_categories(categories)  # Sync operation
    return {"message": "Category added successfully"}
```

---

## Local vs Production Server Deployment

### Development Setup (Local)

#### 1. Our Current Development Pattern
```bash
# Install dependencies
pdm install

# Run development server with auto-reload
pdm run python api/api.py

# Or direct uvicorn command
uvicorn api.api:app --reload --host 0.0.0.0 --port 8000
```

**Key Configuration in api.py:**
```python
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Local Benefits:**
- Auto-reload on code changes
- Accessible from extension at `localhost:8000`
- Easy debugging with print statements
- Direct file access for categories.json

### Production Deployment Options

#### 1. Single Server Deployment (Uvicorn)
```bash
# Production-ready uvicorn
uvicorn api.api:app --host 0.0.0.0 --port 8000 --workers 1
```

**Use Case:** Small applications, single-user deployment

#### 2. Multi-Process Deployment (Gunicorn + Uvicorn)
```bash
# Install gunicorn
pip install gunicorn[uvicorn]

# Run with multiple workers
gunicorn api.api:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Benefits:**
- Process-level fault tolerance
- Better CPU utilization
- Graceful restarts
- Production stability

#### 3. Production Configuration for Our Project

**Environment Variables:**
```bash
# .env for production
DEEPSEEK_API_KEY=your_production_key
CATEGORIES_FILE=/app/data/categories.json
CORS_ORIGINS=https://yourdomain.com
```

**Production api.py modifications:**
```python
import os
from dotenv import load_dotenv

load_dotenv()

# Production CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

#### 4. Docker Deployment (Recommended for Production)
```dockerfile
# Dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install PDM
RUN pip install pdm

# Copy dependency files
COPY pyproject.toml pdm.lock ./

# Install dependencies
RUN pdm install --prod --no-dev

# Copy application code
COPY api/ ./api/
COPY categories/ ./categories/

# Expose port
EXPOSE 8000

# Run with gunicorn
CMD ["pdm", "run", "gunicorn", "api.api:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

**Docker Compose for full stack:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api
```

#### 5. Cloud Deployment Options

**Railway/Vercel/Heroku Pattern:**
```python
# For platforms that auto-detect FastAPI
# Just ensure your main app is importable
from api.api import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
```

**AWS/GCP/Azure with Load Balancing:**
- Use container orchestration (Kubernetes)
- Implement health checks
- Add logging and monitoring
- Use managed databases instead of file storage

---

## Chrome Extension Architecture

### Manifest V3 Structure in Our Project

#### 1. Our Manifest Configuration
```json
{
  "manifest_version": 3,
  "name": "Knowledge Weaver",
  "version": "0.1.0",
  "background": {
    "service_worker": "background/background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content.js"]
    }
  ],
  "action": {
    "default_popup": "popup/popup.html"
  },
  "permissions": [
    "activeTab",
    "downloads", 
    "storage",
    "scripting"
  ],
  "commands": {
    "_execute_action": {
      "suggested_key": {"default": "Ctrl+Shift+Y"}
    }
  }
}
```

**Key Components Explained:**

**Service Worker (background/background.js):**
- Handles extension lifecycle events
- Manages message passing between components
- Performs background processing (like AI categorization)
- Persists only when needed (not always running)

**Content Scripts (content/content.js):**
- Injected into web pages
- Access to page DOM and YouTube video controls
- Bridge between web page and extension
- Can inject overlays and modify page content

**Popup (popup/popup.html + popup.js):**
- Extension icon click interface
- Quick note-taking interface
- Access to Chrome APIs and storage

#### 2. Component Communication Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Popup/Action  │    │ Service Worker   │    │ Content Script  │
│                 │    │ (Background)     │    │                 │
│ - UI Interface  │    │ - Message Router │    │ - DOM Access    │
│ - User Input    │◄──►│ - Data Storage   │◄──►│ - Page Control  │
│ - Chrome APIs   │    │ - API Calls      │    │ - Overlay UI    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └─── chrome.storage ─────┴──── chrome.tabs ──────┘
```

#### 3. Our Message Passing Patterns

**From Content Script to Background:**
```javascript
// content/content.js
chrome.runtime.sendMessage({
  action: 'saveNote',
  data: {
    content: noteText,
    metadata: pageContext
  }
}, (response) => {
  if (response && response.status === 'success') {
    // Handle success
  }
});
```

**From Background to Content Script:**
```javascript
// background/background.js
chrome.tabs.sendMessage(tabs[0].id, { 
  action: 'showOverlay' 
}, (response) => {
  if (chrome.runtime.lastError) {
    // Handle error - content script not ready
    console.log('Content script not ready');
  }
});
```

**Background Message Listener:**
```javascript
// background/background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveNote') {
    // Process note saving
    categorizeNote(request.data.content).then(categories => {
      // Save to storage
      sendResponse({ status: 'success', categories });
    });
    return true; // Indicates async response
  }
});
```

---

## JavaScript Patterns in Extensions

### DOM Manipulation Patterns in Our Project

#### 1. Content Script DOM Injection
```javascript
// content/content.js - Overlay creation pattern
function createSimpleOverlay() {
  // Remove existing overlay
  const existing = document.getElementById('kw-overlay');
  if (existing) existing.remove();

  // Create new overlay element
  const overlay = document.createElement('div');
  overlay.id = 'kw-overlay';
  
  // Inline styles for isolation from page CSS
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      /* More styles... */
    ">
      <!-- Overlay content -->
    </div>
  `;

  document.body.appendChild(overlay);
  setupOverlayEvents();
}
```

**Key Patterns:**
- High z-index (2147483647) to stay above page content
- Inline styles to avoid CSS conflicts
- Unique IDs to prevent conflicts
- Cleanup of existing elements

#### 2. Event Listener Management
```javascript
// content/content.js - Event setup pattern
function setupOverlayEvents() {
  const noteArea = document.getElementById('kw-note-area');
  const saveBtn = document.getElementById('kw-save');
  
  // Cleanup pattern
  const cleanup = () => {
    // Remove event listeners if needed
    hideOverlay();
  };

  // Save handler with async operations
  const saveNote = () => {
    const noteText = noteArea.value.trim();
    if (!noteText) return;

    // Send to background for processing
    chrome.runtime.sendMessage({
      action: 'saveNote',
      data: { content: noteText, metadata: getPageContext() }
    }, (response) => {
      // Handle response
      if (response?.status === 'success') {
        cleanup();
      }
    });
  };

  // Keyboard shortcuts
  noteArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveNote();
    }
    if (e.key === 'Escape') {
      cleanup();
    }
  });

  saveBtn.addEventListener('click', saveNote);
}
```

#### 3. YouTube-Specific DOM Patterns
```javascript
// content/content.js - YouTube integration
function getYouTubeVideoInfo() {
  if (!window.location.hostname.includes('youtube.com')) {
    return null;
  }
  
  const video = document.querySelector('video');
  if (!video) return null;
  
  // Selector patterns for YouTube elements
  const videoTitle = document.querySelector(
    'h1.ytd-video-primary-info-renderer yt-formatted-string, ' +
    'h1.title yt-formatted-string, ' +
    '#title h1'
  );
  
  const channelName = document.querySelector(
    '#owner-name a, ' +
    '#channel-name a, ' +
    '.ytd-channel-name a'
  );
  
  // Create timestamped URL
  const currentTime = video.currentTime;
  const timestampedUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?v=${videoId}&t=${Math.floor(currentTime)}s`;
  
  return {
    videoId: new URLSearchParams(window.location.search).get('v'),
    currentTime,
    timestampedUrl,
    // ... other properties
  };
}
```

### Storage Management Patterns

#### 1. Chrome Storage API Usage
```javascript
// background/background.js - Storage pattern
function saveNoteToStorage(note) {
  chrome.storage.local.get({ notes: [] }, (result) => {
    const notes = result.notes;
    notes.push({
      id: `note-${Date.now()}`,
      content: note.content,
      metadata: note.metadata,
      timestamp: Date.now(),
      categories: [], // Will be filled by AI
    });
    
    chrome.storage.local.set({ notes }, () => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
      }
    });
  });
}
```

#### 2. Async Storage with Promises
```javascript
// Modern promise-based storage pattern
function getStorageData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get({ [key]: [] }, (result) => {
      resolve(result[key]);
    });
  });
}

async function saveNote(noteData) {
  const notes = await getStorageData('notes');
  notes.push(noteData);
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ notes }, () => {
      resolve(!chrome.runtime.lastError);
    });
  });
}
```

---

## Project-Specific Implementation Guide

### Understanding Our Architecture Flow

#### 1. Note-Taking Workflow
```
User presses Ctrl+Shift+Y
         ↓
Popup opens OR Overlay shows (content script)
         ↓
User types note (page context auto-captured)
         ↓
User presses Enter
         ↓
Content script sends message to background
         ↓
Background categorizes via FastAPI
         ↓
Background saves to Chrome storage
         ↓
UI shows success and closes
```

#### 2. AI Categorization Flow
```
Background receives note data
         ↓
Constructs prompt with existing categories
         ↓
Sends HTTP request to localhost:8000/categorize
         ↓
FastAPI processes with DeepSeek API
         ↓
Returns structured JSON with categories
         ↓
Background updates local categories.json
         ↓
Note saved with AI-generated categories
```

#### 3. Knowledge Graph Relationships
```javascript
// Our relationship structure
const note = {
  id: "note-1234567890",
  content: "User's actual note",
  metadata: {
    title: "YouTube Video Title",
    url: "https://youtube.com/watch?v=xyz",
    domain: "youtube.com"
  },
  relationships: {
    type: "youtube_video",
    videoId: "xyz",
    videoTime: 125.7,
    timestampedUrl: "https://youtube.com/watch?v=xyz&t=125s",
    channelName: "Channel Name"
  },
  categories: ["Machine Learning", "Tutorial"],
  timestamp: 1234567890
};
```

### Development Best Practices from Our Project

#### 1. Error Handling Patterns
```javascript
// Robust error handling in background script
async function categorizeNote(content, url) {
  try {
    const response = await fetch('http://localhost:8000/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, url })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.categories || ['General'];
    } else {
      console.error('API error:', response.status);
      return ['General'];
    }
  } catch (error) {
    console.error('Network error:', error);
    return ['General'];
  }
}
```

#### 2. Fallback Strategies
```javascript
// Content script injection fallback
chrome.tabs.sendMessage(tabId, message, (response) => {
  if (chrome.runtime.lastError) {
    // Content script not ready, inject it
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content.js']
    }, () => {
      // Retry message after injection
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, message);
      }, 100);
    });
  }
});
```

#### 3. Performance Optimization
```javascript
// Debounced auto-save pattern
let saveTimeout;
function debouncedSave(data) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToStorage(data);
  }, 500);
}

// Efficient DOM queries
const videoSelector = 'video'; // Cache selectors
const video = document.querySelector(videoSelector);
```

### Debugging and Development Tips

#### 1. Chrome Extension Debugging
```javascript
// Add to content script for debugging
console.log('Content script loaded on:', window.location.href);

// Add to background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request.action, 'from:', sender.tab?.url);
  // ... handle message
});
```

#### 2. FastAPI Development Debugging
```python
# Add logging to FastAPI
import logging
logging.basicConfig(level=logging.INFO)

@app.post("/categorize")
async def categorize_note(note: Note):
    logging.info(f"Categorizing note: {note.content[:50]}...")
    # ... process note
```

#### 3. Network Issues Debugging
```javascript
// Test API availability
async function testAPIConnection() {
  try {
    const response = await fetch('http://localhost:8000/health');
    console.log('API Status:', response.ok ? 'OK' : 'Error');
  } catch (error) {
    console.error('API not available:', error);
  }
}
```

---

This tutorial covers the essential knowledge for understanding and extending the Knowledge Weaver project. Focus on the patterns and architectural decisions rather than memorizing syntax, as these concepts will help you build robust, scalable applications.