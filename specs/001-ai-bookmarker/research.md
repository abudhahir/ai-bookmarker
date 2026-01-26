# Research & Decisions for AI Bookmarker

This document summarizes the research and decisions made to resolve the "NEEDS CLARIFICATION" items in the implementation plan.

## 1. Application Framework

- **Decision**: A command-line interface (CLI) application built with Node.js will be created. The `commander` library will be used for parsing commands and arguments.
- **Rationale**: The user's request, which overrode the "Chrome Extension First" principle, points to a simple, local application. A CLI is the most direct way to fulfill the requirements of accepting a URL, interacting with the local file system (`bookmarks.json`), and making HTTP requests to a local AI server. It avoids the overhead of a full GUI application (like one built with Electron), which is not necessary for this feature.
- **Alternatives considered**:
  - **Electron**: Rejected as overly complex for the current scope.
  - **Standard Node.js script**: A simple script without a dedicated CLI library would be less user-friendly and harder to extend with new commands in the future.

## 2. AI Integration with `lmstudio`

- **Decision**: The application will use `langchain-js` with an `OpenAI` connector configured to point to the local `lmstudio` server's endpoint, which defaults to `http://localhost:1234/v1`. The API key can be a placeholder string as it is not required by `lmstudio`.
- **Rationale**: `lmstudio` provides an OpenAI-compatible API, making it easy to integrate with popular libraries like `langchain-js`. This approach allows the application to remain agnostic to the specific model running in `lmstudio`, as long as it supports summarization and tagging tasks.
- **Alternatives considered**:
  - **Direct HTTP requests**: Making direct `fetch` or `axios` calls without `langchain-js` would require more boilerplate code to format requests and handle responses. `langchain-js` provides a higher-level abstraction that simplifies interaction with LLMs.

## 3. Data Structure for `bookmarks.json`

- **Decision**: The `bookmarks.json` file will be structured as a JSON array, where each element is an object representing a bookmark. The application will use Node.js's built-in `fs` module for all file read/write operations.
- **Rationale**: A simple array of objects is the most intuitive and readable structure for a list of items. It maps directly to a JavaScript array, making it easy to parse and manipulate. For the expected scale of this application (up to 1,000 bookmarks as per success criteria), the performance of iterating through an array is perfectly acceptable.
- **Alternatives considered**:
  - **Object with ID keys**: This would provide faster lookups but is unnecessarily complex for the current requirements and makes ordered listing less straightforward.
  - **Top-level object with metadata**: This is not needed as the current requirements do not include metadata about the collection itself.
