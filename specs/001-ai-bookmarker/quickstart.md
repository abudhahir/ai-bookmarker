# Quickstart: AI Bookmarker CLI

This guide explains how to use the AI Bookmarker CLI application.

## Prerequisites

1.  **Node.js**: Ensure you have Node.js installed on your system.
2.  **LM Studio**: You must have LM Studio installed and running with a loaded model.
    - Start the local inference server in LM Studio (usually at `http://localhost:1234/v1`).

## Installation

```bash
# (Instructions to be added once the package is created)
# For now, run from the source code:
npm install
```

## Commands

### Adding a Bookmark

To save and analyze a new bookmark, use the `add` command:

```bash
node bookmark.js add <URL>
```

**Example**:

```bash
node bookmark.js add https://www.theverge.com/2023/5/25/23733351/ai-artificial-intelligence-regulation-rules-government
```

The application will then fetch the content, generate a summary and tags, and save it to your `bookmarks.json` file.

### Listing Bookmarks

To see all of your saved bookmarks, use the `list` command:

```bash
node bookmark.js list
```

This will display a formatted list of all the bookmarks you have saved.
