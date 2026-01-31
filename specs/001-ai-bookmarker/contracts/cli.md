# CLI Contracts: AI-Powered Bookmarking Service

This document defines the command-line interface for the application.

## `bookmark` command

### `bookmark add <url>`

Adds a new bookmark.

- **Arguments**:
  - `url` (required): The URL of the page to bookmark.
- **Process**:
  1. The application receives the URL.
  2. It scrapes the content of the URL.
  3. If the content is not HTML, it saves the bookmark with an empty summary and tags.
  4. If the content is HTML, it sends the content to the local `lmstudio` server.
  5. The AI generates a summary and a list of tags.
  6. The application creates a new bookmark object with a unique ID, the URL, summary, tags, and the current timestamp.
  7. The new bookmark is appended to the `bookmarks.json` file.
- **Output**:
  - Success: "Bookmark for `<url>` added successfully."
  - Error: "Error: Could not process `<url>`. Please ensure it is a valid and accessible URL."

### `bookmark list`

Lists all saved bookmarks.

- **Arguments**: None
- **Process**:
  1. The application reads the `bookmarks.json` file.
  2. It parses the JSON array.
  3. It formats the list of bookmarks for display in the console.
- **Output**:
  - A formatted list of all bookmarks, showing the URL, summary, and tags for each. If no bookmarks exist, it will display "No bookmarks found."
