# Knowledge Weaver

Knowledge Weaver is a Chrome extension designed to help you capture, organize, and connect your ideas as you browse the web. It aims to be a powerful tool for personal knowledge management, leveraging AI to automatically categorize your notes and build a knowledge graph.

## Phase 1: Core Functionality (In Progress)

This initial phase focuses on building the core features of the extension, allowing for local use and basic note-taking.

### Current Features

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

**Usage**

1.  Navigate to any webpage.
2.  Navigate to any webpage.
3.  Press `Ctrl+Shift+Y` or click the extension icon to open the popup.
4.  The title, URL, and summary of the page will be pre-filled in the note area.
5.  Add your notes below the title.
6.  Click "Save Note" or press `Enter` to save the note and close the popup.
7.  Click "View Notes" to see all your saved notes.
8.  Click "Export Notes" to save all your notes to a single Markdown file.

## Future Development

### Phase 2: Advanced Features

*   **External Database:** Integrate with a database solution for more robust storage.
*   **LLM Integration:** Connect to a Large Language Model (local or cloud-based) to automatically categorize notes and extract entities for the knowledge graph.
*   **Knowledge Graph Visualization:** Create a way to visualize the connections between your notes.

### Phase 3: Public Release

*   **User Accounts:** Allow users to create accounts and store their notes in the cloud.
*   **Collaboration:** Enable sharing and collaboration on knowledge graphs.
