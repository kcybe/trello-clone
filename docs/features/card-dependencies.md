# Card Dependencies (Blocking)

Track which cards depend on other cards being completed first.

## Overview

Card dependencies allow users to create blocking relationships between cards, preventing work on dependent tasks until prerequisites are complete.

## User Stories

- As a user, I want to mark a card as "blocking" another card
- As a user, I want to see visual indicators when a card has dependencies
- As a user, I want to filter to see only cards that are unblocked
- As a user, I want to be notified when a blocking card is completed

## UI Requirements

### Dependency Creation
- Click "Add dependency" button on card
- Search for and select the blocking card
- Visual indicator shows on both cards (arrow/chain icon)

### Visual Indicators
- Blocking card shows "Blocks: X cards"
- Blocked card shows "Blocked by: Card Name"
- Color-coded border (red = blocked, yellow = blocking others)

### Dependency View
- Board sidebar shows dependency graph
- Filter by "All", "Blocked only", "Blocking only"

## Data Model

```typescript
interface CardDependency {
  id: string;
  blockedCardId: string;
  blockingCardId: string;
  createdAt: Date;
}

interface Card {
  id: string;
  // ... existing fields
  blockingDependencies?: CardDependency[];
  blockedDependencies?: CardDependency[];
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cards/:id/dependencies` | Create dependency |
| DELETE | `/api/cards/:id/dependencies/:blockingId` | Remove dependency |
| GET | `/api/boards/:id/dependencies` | Get all dependencies |
| GET | `/api/cards/:id/blockers` | Get cards blocking this one |

## Frontend Components

1. `DependencySelector` - Search and select blocking cards
2. `DependencyBadge` - Show dependency status on card
3. `DependencyGraph` - Visual dependency tree
4. `DependencyFilter` - Filter controls in board sidebar

## Implementation Steps

### Phase 1: Basic Dependencies
1. Add database migration for CardDependency table
2. Create API endpoints
3. Add dependency selector to card modal
4. Display dependency badges on cards

### Phase 2: Visual Improvements
1. Add dependency graph visualization
2. Implement filter controls
3. Add drag-drop to establish dependencies

### Phase 3: Notifications
1. Notify users when blockers are resolved
2. Show blocked cards in "Due soon" views

## Complexity: Medium
- Database schema changes
- UI/UX design for visualization
- Circular dependency detection
