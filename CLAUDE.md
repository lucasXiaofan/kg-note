# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Knowledge Weaver is a Chrome extension for personal knowledge management that captures, organizes, and connects notes while browsing. It features AI-powered categorization via a local FastAPI server using the DeepSeek API.

## Development Commands

### Frontend (Chrome Extension)
- **Build Tailwind CSS**: `npm run build`
- **Install dependencies**: `npm install`

### Backend (FastAPI Server)
- **Install dependencies**: `pdm install`
- **Run API server**: `pdm run python api/api.py` (serves on http://localhost:8000)
- **Access API docs**: Visit http://localhost:8000/docs for interactive Swagger UI

### Setup Requirements
1. Install pdm: `pip install pdm`
2. Create `.env` file with `DEEPSEEK_API_KEY=your_api_key`
3. For Chrome extension: Load unpacked extension from project directory

## Architecture

### Chrome Extension Structure
- **popup/**: Main extension interface (popup.html/js)
- **background/**: Service worker (background.js)
- **content/**: Page interaction scripts (content.js)
- **notes/**: Notes viewing interface (notes.html/js)
- **categories/**: Category management UI (categories.html/js)
- **edit/**: Note editing interface (edit.html/js)

### API Server
- **api/api.py**: FastAPI server handling categorization and CRUD operations
- **categories/categories.json**: Category definitions storage
- Uses OpenAI JSON schema for structured AI responses

### Key Features Architecture
- **Storage**: Chrome local storage (5MB limit, 512 items max)
- **AI Integration**: DeepSeek API via local FastAPI server
- **Multi-category support**: Notes can have multiple category tags
- **Real-time categorization**: Auto-categorize on save with progress tracking
- **Webpage Context Separation**: Note content separated from webpage metadata
- **URL-based Relationships**: Notes grouped and related by website/URL
- **Related Notes Discovery**: Visual indicators for notes from same page/domain

### API Endpoints
- `GET /health` - Server health check
- `GET /categories` - Retrieve all categories
- `POST /categories` - Add new category
- `PUT /categories/{index}` - Update category
- `DELETE /categories/{index}` - Delete category
- `POST /categorize` - AI categorize note content

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