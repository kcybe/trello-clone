# Board Filters and Views

Filter and customize how boards are displayed.

## Overview

Users can filter cards by various criteria and save custom views for different use cases.

## User Stories

- As a user, I want to filter cards by label
- As a user, I want to filter cards by member
- As a user, I want to filter cards by due date
- As a user, I want to save filter configurations as views

## Filter Types

1. **Label Filter** - Show cards with specific labels
2. **Member Filter** - Show cards assigned to specific members
3. **Due Date Filter** - Show cards due today, this week, overdue
4. **Text Search** - Search card titles and descriptions
5. **Custom Fields Filter** - Filter by custom field values

## UI Components

1. `FilterBar` - Filter controls above board
2. `FilterDropdown` - Select filter values
3. `SavedView` - Saved filter configurations
4. `ViewSwitcher` - Toggle between views

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/boards/:id/views` | Save a view |
| GET | `/api/boards/:id/views` | Get saved views |
| PUT | `/api/views/:id` | Update view |
| DELETE | `/api/views/:id` | Delete view |

## Data Model

```typescript
interface BoardView {
  id: string;
  boardId: string;
  name: string;
  filters: {
    labels?: string[];
    members?: string[];
    dueDate?: 'today' | 'week' | 'overdue' | null;
    text?: string;
  };
  sortBy?: string;
  createdBy: string;
}
```

## Implementation Steps

### Phase 1: Basic Filters
1. Add filter state management
2. Create filter UI components
3. Implement filtering logic
4. Apply filters to card rendering

### Phase 2: Saved Views
1. Add BoardView model
2. Create view CRUD APIs
3. Build view management UI
4. Add view switcher to board header

## Complexity: Medium
- Frontend state management
- Filter logic complexity
- Saved views persistence
