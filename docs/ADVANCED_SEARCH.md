# Advanced Search Feature

This document describes the advanced search functionality implemented for the Trello Clone application.

## Overview

The advanced search feature provides powerful filtering capabilities for searching cards across boards with support for:

- **Text Search**: Search by card title and description
- **Label Filtering**: Filter by card labels
- **Assignee Filtering**: Filter by assigned users
- **Due Date Filtering**: Filter by various date criteria
- **Relevance Scoring**: Results sorted by relevance to search query
- **Search History**: Track recent searches for quick access

## API Reference

### GET /api/search

Search cards with query parameters.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Text to search in card title and description |
| `labels` | string | Comma-separated list of label names to filter by |
| `assignees` | string | Comma-separated list of assignee emails/names/IDs |
| `dateFilter` | string | Date filter option: `any`, `today`, `tomorrow`, `thisWeek`, `nextWeek`, `thisMonth`, `overdue`, `noDate`, `specific` |
| `specificDate` | string | ISO date string for specific date filter |
| `boardId` | string | Filter results to specific board |
| `limit` | number | Maximum number of results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response:**

```json
{
  "cards": [
    {
      "id": "card-123",
      "title": "Card Title",
      "description": "Card description",
      "labels": [],
      "assignee": "User Name",
      "assignees": [{ "id": "1", "name": "User", "email": "user@example.com", "image": null }],
      "dueDate": "2024-01-15T00:00:00.000Z",
      "columnId": "col-1",
      "columnName": "To Do",
      "boardId": "board-1",
      "boardName": "My Board",
      "matchedFields": ["title", "description"],
      "relevanceScore": 5
    }
  ],
  "totalCount": 25,
  "hasMore": true
}
```

### POST /api/search

Advanced search with request body for complex queries.

**Request Body:**

```json
{
  "query": "search text",
  "labels": ["Bug", "Urgent"],
  "assignees": ["alice@example.com"],
  "dateFilter": "overdue",
  "specificDate": "2024-01-15T00:00:00.000Z",
  "boardId": "board-123",
  "limit": 20,
  "offset": 0
}
```

## Components

### AdvancedSearch

Main search component with UI and filtering capabilities.

```tsx
import { AdvancedSearch } from '@/features/search';

function MyComponent() {
  const handleSearch = (results) => {
    console.log('Search results:', results);
  };

  return (
    <AdvancedSearch
      boardId="board-123"
      onSearch={handleSearch}
      onSelectCard={(card) => navigateToCard(card)}
      placeholder="Search cards..."
    />
  );
}
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `boardId?` | string | Optional board ID to restrict search |
| `onSearch` | function | Callback when search results are returned |
| `onSelectCard?` | function | Callback when a search result is clicked |
| `placeholder?` | string | Placeholder text for search input |

### FilterPanel

Reusable filter panel component for advanced filtering.

```tsx
import { FilterPanel } from '@/features/search/components/FilterPanel';

<FilterPanel
  filters={currentFilters}
  onApplyFilters={handleApplyFilters}
  onRemoveFilter={handleRemoveFilter}
/>
```

## Hooks

### useSearch

Custom hook for managing search state and actions.

```tsx
import { useSearch } from '@/features/search';

function SearchComponent() {
  const {
    isLoading,
    results,
    searchHistory,
    search,
    clearSearch,
    clearHistory,
    loadMore,
  } = useSearch({ boardId: 'board-123' });

  const handleSearch = async () => {
    await search({
      text: 'my query',
      labels: ['Bug'],
      assignees: ['alice@example.com'],
      dateFilter: 'overdue',
    });
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {results && <p>Found {results.totalCount} results</p>}
    </div>
  );
}
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `isLoading` | boolean | Whether search is in progress |
| `results` | SearchResult | Current search results |
| `searchHistory` | SearchHistoryItem[] | Recent searches |
| `search` | function | Execute search with filters |
| `clearSearch` | function | Clear current search results |
| `clearHistory` | function | Clear search history |
| `loadMore` | function | Load more results (pagination) |

## Types

### SearchFilters

```typescript
interface SearchFilters {
  text?: string;
  labels?: string[];
  assignees?: string[];
  dateFilter?: DateFilterOption;
  specificDate?: Date;
}
```

### DateFilterOption

```typescript
type DateFilterOption = 
  | 'any'
  | 'today'
  | 'tomorrow'
  | 'thisWeek'
  | 'nextWeek'
  | 'thisMonth'
  | 'overdue'
  | 'noDate'
  | 'specific';
```

### SearchResult

```typescript
interface SearchResult {
  cards: CardSearchResult[];
  totalCount: number;
  hasMore: boolean;
}
```

### CardSearchResult

```typescript
interface CardSearchResult {
  id: string;
  title: string;
  description?: string;
  labels: CardLabel[];
  assignee?: string;
  assignees: Array<{
    id: string;
    name: string;
    email: string;
    image?: string | null;
  }>;
  dueDate?: Date | string | null;
  columnId: string;
  columnName: string;
  boardId: string;
  boardName: string;
  matchedFields?: string[];
  relevanceScore?: number;
}
```

## Date Filtering Logic

### Today
Due date between start of today and start of tomorrow.

### Tomorrow
Due date between start of tomorrow and start of day after.

### This Week
Due date between now and end of current week (Friday).

### Next Week
Due date between start of next week and end of following week.

### This Month
Due date between now and end of current month.

### Overdue
Due date in the past (before today).

### No Date
Cards without a due date set.

### Specific Date
Due date matches the specified date exactly.

## Usage Examples

### Basic Text Search
```tsx
<AdvancedSearch
  onSearch={(results) => console.log(results)}
/>
```

### Filter by Labels
```tsx
<AdvancedSearch
  onSearch={(results) => {
    // Results filtered by "Bug" label
  }}
/>
```

### Complex Filter
```tsx
<AdvancedSearch
  boardId="board-123"
  onSearch={(results) => {
    // Results matching all criteria:
    // - Contains "urgent"
    // - Has "Bug" or "Urgent" label
    // - Assigned to Alice or Bob
    // - Overdue
  }}
/>
```

## Testing

Run tests for the search feature:

```bash
# Run search component tests
npm test -- --testPathPattern="AdvancedSearch.test"

# Run API route tests
npm test -- --testPathPattern="api/search/route.test"

# Run all search-related tests
npm test -- --testPathPattern="search"
```

## Performance Considerations

- Search results are paginated with default limit of 50
- Text search uses simple substring matching (case-insensitive)
- Filters are combined with AND logic
- Consider adding Elasticsearch/Algolia for production at scale
