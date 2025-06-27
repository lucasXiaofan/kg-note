# Knowledge Weaver

Knowledge Weaver is a Chrome extension designed to help you capture, organize, and connect your ideas as you browse the web. It aims to be a powerful tool for personal knowledge management, leveraging AI to automatically categorize your notes and build a knowledge graph.

## Phase 1: Core Functionality (In Progress)

This initial phase focuses on building the core features of the extension, allowing for local use and basic note-taking.

### Current Features

#### Core Note-Taking
*   **Note-Taking Popup:** A simple popup allows you to jot down notes quickly.
*   **Hotkey Access:** Use `Ctrl+Shift+Y` to open the note-taking popup.
*   **Contextual Notes:** The title, URL, and summary (if available) of the current webpage are automatically added to your note.
*   **Auto-Focus:** The note-taking area is automatically focused when the popup is opened, allowing you to start typing immediately.
*   **Enter to Save & Close:** Press `Enter` in the note area to quickly save your note and close the popup.
*   **Modern UI:** A sleek, modern interface built with Tailwind CSS featuring a dark theme, smooth animations, and intuitive design.
*   **Local Storage:** Notes are saved to the extension's local storage.
*   **View Notes:** You can view all your notes on a dedicated page.
*   **Edit and Delete Notes:** You can easily edit and delete your notes from the "View Notes" page. Editing is done in a new, centered pop-up window for a better experience.
*   **Export Notes:** You can export all your notes as a single Markdown file.

#### Advanced Category Management
*   **Enhanced Categories UI:** Comprehensive category management interface with modern design
*   **Manual Category Creation:** Add new categories with custom names and definitions
*   **Category CRUD Operations:** Create, Read, Update, and Delete categories through the UI
*   **Modal Editing:** Edit categories in a sleek modal interface
*   **Automatic Categorization:** Notes are automatically categorized using a local FastAPI server powered by the DeepSeek API
*   **Category Testing:** Test the categorization API directly from the UI with sample content
*   **Real-time Server Status:** Monitor API server status with visual indicators
*   **Category Storage:** Categories are stored in `categories/categories.json` file

#### API Features & Testing
*   **FastAPI Automatic Documentation:** Access interactive API docs at `http://localhost:8000/docs`
*   **Built-in API Tester:** Test categorization directly from the categories page
*   **CORS Support:** Proper CORS configuration for browser-based API access
*   **Health Check Endpoint:** Monitor server health and availability
*   **RESTful API Design:** Full REST API with proper HTTP methods and status codes

### FastAPI Server

A local FastAPI server handles automatic categorization and category management. This project uses `pdm` for Python package management.

#### Setup & Installation
1.  Install `pdm` if you haven't already: `pip install pdm`
2.  Install the dependencies: `pdm install`
3.  Create a `.env` file in the root of the project and add your DeepSeek API key: `DEEPSEEK_API_KEY=your_api_key`
4.  Run the server: `pdm run python api/api.py`

The server will run on `http://localhost:8000`.

#### API Endpoints
*   `GET /health` - Health check endpoint
*   `GET /categories` - Get all categories
*   `POST /categories` - Add a new category
*   `PUT /categories/{index}` - Update a category by index
*   `DELETE /categories/{index}` - Delete a category by index
*   `POST /categorize` - Categorize a note using AI
*   `GET /docs` - Interactive API documentation (Swagger UI)

#### Using the API Documentation
1.  Start the FastAPI server
2.  Visit `http://localhost:8000/docs` in your browser
3.  Explore and test all API endpoints interactively
4.  View request/response schemas and try out different API calls

### Storage Limits

This extension uses `chrome.storage.local` to store your notes. This storage is not unlimited and has the following restrictions:

*   **Total storage:** 5 MB
*   **Individual item size:** 8 KB
*   **Number of items:** 512

If you plan to store a large number of notes, you may eventually hit these limits. Future versions of the extension will offer alternative storage options, such as a dedicated database.

### How to Use

**Installation**

1.  Clone the repository.
2.  Install the dependencies: `npm install`
3.  Build the CSS file: `npm run build`
4.  Load the extension into Chrome by navigating to `chrome://extensions`, enabling "Developer mode", and clicking "Load unpacked". Select the project directory.

**Basic Usage**

1.  Navigate to any webpage.
2.  Press `Ctrl+Shift+Y` or click the extension icon to open the popup.
3.  The title, URL, and summary of the page will be pre-filled in the note area.
4.  Add your notes below the title.
5.  Click "Save Note" or press `Enter` to save the note and close the popup.
6.  Click "View Notes" to see all your saved notes.
7.  Click "Export Notes" to save all your notes to a single Markdown file.

**Category Management**

1.  Navigate to the Categories page from the extension
2.  Add new categories manually using the "Add New Category" form
3.  Test the AI categorization with the "Test Categorization API" section
4.  Edit or delete existing categories using the action buttons
5.  Monitor server status in real-time
6.  Access the API documentation via the "API Docs" button

**API Testing**

1.  Start the FastAPI server: `pdm run python api/api.py`
2.  Open the Categories page in your extension
3.  Use the built-in API tester to experiment with categorization
4.  Or visit `http://localhost:8000/docs` for full API documentation
5.  Test endpoints directly from the Swagger UI interface

## Project Structure

The codebase has been organized into logical directories:

```
kg-note/
├── api/                    # FastAPI server
│   └── api.py             # Main API server file
├── background/            # Chrome extension background scripts
│   └── background.js      # Service worker
├── categories/            # Category management
│   ├── categories.html    # Categories UI
│   ├── categories.js      # Categories logic
│   └── categories.json    # Categories data
├── content/               # Content scripts
│   └── content.js         # Page interaction script
├── edit/                  # Note editing interface
│   ├── edit.html          # Edit page UI
│   └── edit.js           # Edit page logic
├── notes/                 # Notes management
│   ├── notes.html         # Notes viewing UI
│   └── notes.js          # Notes viewing logic
├── popup/                 # Extension popup
│   ├── popup.html         # Popup UI
│   └── popup.js          # Popup logic
├── static/               # Static assets
│   ├── css/              # Compiled CSS
│   └── icons/            # Extension icons
├── dist/                 # Build output
├── manifest.json         # Extension manifest
└── README.md            # This file
```

## Recent Updates

### Version 0.1.1 - Enhanced Category Management
*   ✅ Comprehensive category management UI
*   ✅ Manual category creation and editing
*   ✅ Real-time API testing interface
*   ✅ Server status monitoring
*   ✅ Enhanced FastAPI server with full CRUD operations
*   ✅ Interactive API documentation
*   ✅ Improved error handling and user feedback
*   ✅ Organized project structure

### Version 0.1.2 - Structured AI Output
*   ✅ Implemented structured JSON output using OpenAI JSON schema
*   ✅ Eliminated JSON parsing errors from AI responses
*   ✅ Enhanced reliability of AI categorization
*   ✅ Better duplicate category detection
*   ✅ Improved error handling and fallback mechanisms

### Version 0.1.3 - Enhanced Note Management
*   ✅ Automatic categorization when saving new notes
*   ✅ Bulk categorization button for existing uncategorized notes
*   ✅ Inline category editing - click any category to modify it
*   ✅ Real-time categorization feedback in popup
*   ✅ Progress tracking during bulk categorization
*   ✅ Improved user experience with visual feedback

### Version 0.1.4 - Multiple Categories Support
*   ✅ **Multiple categories per note** - each note can have multiple category tags
*   ✅ **Tag-based interface** - categories displayed as interactive tags
*   ✅ **Add new categories** - "+ Add" button to assign additional categories
*   ✅ **Remove categories** - "×" button on each tag to remove individual categories
*   ✅ **Edit categories inline** - click any category tag to edit it directly
*   ✅ **Backward compatibility** - existing single-category notes automatically supported
*   ✅ **Visual feedback** - hover effects and smooth transitions for better UX

### Version 0.1.5 - Enhanced Navigation and AI Improvements
*   ✅ **Note sorting** - toggle between newest first and oldest first with "🔄" button
*   ✅ **Creative AI categorization** - LLM encouraged to assign 1-4 meaningful categories per note
*   ✅ **No more "Uncategorized"** - AI finds relevant categories for all content, uses "General" only for errors
*   ✅ **Multi-category AI responses** - AI can suggest multiple categories and create new ones automatically
*   ✅ **Enhanced prompting** - AI discovers connections users might not see by analyzing themes and concepts
*   ✅ **API error handling** - better debugging and error recovery for categorization failures

### Version 0.1.6 - Storage Management
*   ✅ **Storage usage dashboard** - visual display of Chrome local storage usage with progress bar
*   ✅ **Component breakdown** - separate tracking for notes and categories storage
*   ✅ **Real-time updates** - storage usage refreshes automatically after operations
*   ✅ **Color-coded alerts** - progress bar changes color (blue/yellow/red) based on usage percentage
*   ✅ **Manual refresh** - "🔄 Refresh" button to update storage statistics
*   ✅ **Future-ready** - storage tracking designed to work with external databases when implemented

## Future Development

### Phase 2: Advanced Features

*   **External Database:** Integrate with a database solution for more robust storage.
*   **Knowledge Graph Visualization:** Create a way to visualize the connections between your notes.
*   **Note Relationships:** AI-powered detection of relationships between notes
*   **Search & Filtering:** Advanced search capabilities across notes and categories
*   **Bulk Operations:** Import/export multiple notes and categories

### Phase 3: Public Release

*   **User Accounts:** Allow users to create accounts and store their notes in the cloud.
*   **Collaboration:** Enable sharing and collaboration on knowledge graphs.
*   **Mobile Support:** Extend functionality to mobile browsers
*   **Plugin System:** Allow third-party integrations and extensions
