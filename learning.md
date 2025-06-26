# Learning Log: Knowledge Weaver Extension

This document tracks the key concepts and technologies used in the development of the Knowledge Weaver Chrome extension.

## Phase 1: Core Functionality

### Chrome Extension Development

*   **`manifest.json`**: The heart of the extension. This JSON file defines the extension's properties, such as its name, version, permissions, and the scripts it uses. It's the entry point that tells Chrome how to handle the extension.
*   **Content Scripts (`content.js`)**: These are JavaScript files that run in the context of a web page. They can read and manipulate the DOM of the page, which is how we get the page title, URL, and summary.
*   **Background Scripts (`background.js`)**: These scripts run in the background, independent of any web page. They are used for long-running tasks and for coordinating different parts of the extension. In our case, the background script handles saving notes, exporting notes, and managing the hotkey.
*   **Popup (`popup.html`, `popup.js`, `popup.css`)**: The UI that appears when you click the extension's icon. It's a standard HTML page that can be styled with CSS and controlled with JavaScript.
*   **`chrome.*` APIs**: A set of JavaScript APIs that allow extensions to interact with the browser. We've used several of these:
    *   **`chrome.action`**: Controls the extension's icon in the toolbar, including opening the popup.
    *   **`chrome.commands`**: Defines and listens for keyboard shortcuts (hotkeys).
    *   **`chrome.downloads`**: Programmatically initiates downloads, which we use for the export feature.
    *   **`chrome.runtime`**: Provides various utility functions, including message passing between different parts of the extension.
    *   **`chrome.storage`**: Allows the extension to store data locally. We use `chrome.storage.local` for a small amount of data that persists across browser sessions.
    *   **`chrome.tabs`**: Interacts with the browser's tab system, allowing us to get information about the active tab and send messages to its content script.

### Web Development Fundamentals

*   **HTML (HyperText Markup Language)**: The standard markup language for creating web pages. We use it to structure the popup and the "View Notes" page.
*   **CSS (Cascading Style Sheets)**: Used to style the HTML elements. We started with basic CSS and then moved to a more advanced framework.
*   **JavaScript**: The programming language of the web. We use it to add interactivity to our HTML pages and to control the extension's logic.
*   **DOM (Document Object Model)**: A programming interface for web documents. It represents the page so that programs can change the document structure, style, and content. Our content script and popup script both interact with the DOM.

### Frontend Build Tools

*   **Node.js and npm (Node Package Manager)**: Node.js is a JavaScript runtime that allows us to run JavaScript outside of a browser. npm is the default package manager for Node.js, and we use it to install and manage project dependencies like Tailwind CSS.
*   **Tailwind CSS**: A utility-first CSS framework that provides a set of pre-defined classes that can be used to build custom designs directly in the HTML. This is a more modern and efficient way to style web pages compared to writing custom CSS from scratch.
*   **`package.json`**: A file that contains metadata about the project and its dependencies. It also defines scripts that can be run with npm, such as our `build` script for compiling the CSS.
*   **`tailwind.config.js`**: The configuration file for Tailwind CSS. It allows us to customize the framework and specify which files to scan for CSS classes.

### Version Control

*   **Git**: A distributed version control system for tracking changes in source code during software development.
*   **`.gitignore`**: A file that tells Git which files or directories to ignore in a project. This is important for keeping the repository clean and avoiding committing unnecessary files like `node_modules`.
