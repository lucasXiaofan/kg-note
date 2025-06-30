# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Knowledge Weaver is a Chrome extension for personal knowledge management that captures, organizes, and connects notes while browsing. It features AI-powered categorization via a local FastAPI server using the DeepSeek API.

## Development Commands

### Frontend (Chrome Extension)
- **Build Tailwind CSS**: `cd frontend && npm run build`
- **Install dependencies**: `cd frontend && npm install`

### Backend (FastAPI Server)
- **Install dependencies**: `cd backend && pdm install`
- **Run API server**: `cd backend && pdm run python src/api/api.py` (serves on http://localhost:8000)
- **Access API docs**: Visit http://localhost:8000/docs for interactive Swagger UI

### Cloud Deployment
- **Build Docker image**: `cd backend && docker build -t kg-api .`
- **Deploy to Google Cloud Run**: See `docs/deployment-guide.md` for complete instructions
- **Firestore setup**: `gcloud firestore databases create --location=us-central1`

### Setup Requirements
1. Install pdm: `pip install pdm`
2. Create `.env` file in backend directory with `DEEPSEEK_API_KEY=your_api_key`
3. For Chrome extension: Load unpacked extension from frontend directory

## Architecture

### Knowledge Graph Integration
- **Schema**: Entities (notes, URLs, categories, concepts, domains) with relationships
- **Storage**: Google Firestore with optimized indexes for graph queries
- **AI Integration**: DeepSeek API for concept extraction and relationship building
- **Query Patterns**: Related note discovery, semantic search, knowledge clustering

### Chrome Extension Structure (frontend/)
- **src/popup/**: Main extension interface (popup.html/js)
- **src/background/**: Service worker (background.js)
- **src/content/**: Page interaction scripts (content.js)
- **src/pages/notes/**: Notes viewing interface (notes.html/js)
- **src/pages/categories/**: Category management UI (categories.html/js)
- **src/pages/edit/**: Note editing interface (edit.html/js)
- **src/pages/sidepanel/**: Side panel interface (sidepanel.html/js)
- **src/assets/**: CSS and icons
- **dist/**: Built CSS output
- **manifest.json**: Extension manifest

### API Server (backend/)
- **src/api/api.py**: FastAPI server handling categorization and CRUD operations
- **data/categories.json**: Category definitions storage
- Uses OpenAI JSON schema for structured AI responses

### Documentation (docs/)
- **learning.md**: Development learning notes
- **tutorial.md**: Tutorial documentation

### Key Features Architecture
- **Storage**: Chrome local storage (5MB limit, 512 items max)
- **AI Integration**: DeepSeek API via local FastAPI server
- **Multi-category support**: Notes can have multiple category tags
- **Real-time categorization**: Auto-categorize on save with progress tracking
- **Webpage Context Separation**: Note content separated from webpage metadata
- **URL-based Relationships**: Notes grouped and related by website/URL
- **Related Notes Discovery**: Visual indicators for notes from same page/domain

### API Endpoints

#### Core Endpoints
- `GET /health` - Server health check
- `GET /categories` - Retrieve all categories
- `POST /categories` - Add new category
- `PUT /categories/{index}` - Update category
- `DELETE /categories/{index}` - Delete category
- `POST /categorize` - AI categorize note content

#### Knowledge Graph Endpoints
- `POST /kg/notes` - Add note to knowledge graph
- `GET /kg/notes/{note_id}/related` - Get related notes
- `POST /kg/search` - Search knowledge graph entities
- `GET /kg/overview` - Get knowledge graph overview

## Development Notes

### Extension Manifest
- Manifest V3 Chrome extension
- Hotkey: Ctrl+Shift+Y to open popup
- Permissions: activeTab, downloads, storage
- Host permissions for localhost:8000 API access

### Python Dependencies
- FastAPI, Uvicorn for API server
- OpenAI client for DeepSeek API integration
- python-dotenv for environment management
- Requires Python 3.13

### Storage Management
- Extension tracks Chrome storage usage with visual dashboard
- Color-coded progress bar (blue/yellow/red) based on usage
- Manual refresh capability for storage statistics

### Webpage Context & Note Relationships
- **Separated Metadata**: Webpage context (title, URL, domain) stored as metadata, not mixed with note content
- **Context Display**: Collapsible context section in popup showing current page info
- **Related Notes Detection**: Popup shows related notes from same page/domain
- **Note Grouping**: Notes view groups and highlights related notes by website
- **Clickable URLs**: Direct navigation to source pages from notes view
- **Visual Relationships**: Click relationship indicators to highlight related notes

### Note Data Structure
```json
{
  "id": "note-timestamp",
  "content": "User's actual note content",
  "metadata": {
    "title": "Page title",
    "url": "Full URL",
    "domain": "website.com",
    "summary": "Page summary if available"
  },
  "categories": ["category1", "category2"],
  "timestamp": 1234567890
}
```