# Data Model: AI-Powered Bookmarking Service

This document defines the data structures for the features, based on the `Bookmark` entity identified in the feature specification.

## Bookmark Entity

Represents a single saved bookmark.

**Storage**: This entity will be stored as a JSON object within the `bookmarks.json` file, which is an array of these objects.

### Fields

| Field         | Type            | Description                                         | Validation Rules            |
| :------------ | :-------------- | :-------------------------------------------------- | :-------------------------- |
| `id`          | `string`        | A unique identifier for the bookmark (e.g., a UUID). | Required, Unique            |
| `url`         | `string`        | The original URL of the bookmarked page.            | Required, Must be a valid URL |
| `summary`     | `string`        | The AI-generated summary of the page content.       | Can be empty (for non-HTML) |
| `tags`        | `Array<string>` | A list of AI-generated tags.                        | Can be empty (for non-HTML) |
| `createdAt`   | `string`        | The ISO 8601 timestamp of when the bookmark was created. | Required, Valid ISO 8601 date |

### Example JSON Object

```json
{
  "id": "c7a6b2f0-1e9a-4f1a-b8e0-3d7f9e8d4c9b",
  "url": "https://example.com/some-article",
  "summary": "This is a summary of the article at the provided URL.",
  "tags": ["technology", "ai", "web"],
  "createdAt": "2026-01-26T10:00:00Z"
}
```
