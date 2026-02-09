# Card Dependencies and Relations

Track which cards depend on other cards and show blocking relationships between cards.

## Overview

Card dependencies allow users to create relationships between cards, preventing work on dependent tasks until prerequisites are complete. The system supports multiple relation types to model different dependency scenarios.

## Relation Types

| Type | Icon | Description | Visual Indicator |
|------|------|-------------|------------------|
| **Blocks** | ↑ (ArrowUp) | This card is blocking the target card | Red ring on blocking card |
| **Blocked by** | ↓ (ArrowDown) | This card is blocked by the target card | Red ring on blocked card |
| **Depends on** | ⧉ (GitFork) | This card depends on the target card | Yellow indicator |
| **Related to** | 🔗 (Link2) | This card is related to the target card | Blue badge |

## User Stories

- As a user, I want to link cards to show dependencies
- As a user, I want to see visual indicators when a card has dependencies
- As a user, I want to distinguish between blocking and blocked cards
- As a user, I want to see dependency information at a glance

## UI Requirements

### Dependency Indicators on Cards

Cards display dependency information directly on the card surface:

1. **Visual Status Rings**
   - **Red ring**: Card is blocked by another card
   - **Yellow ring**: Card is blocking other cards (but not blocked itself)
   - No ring: Card has no blocking relationships

2. **Dependency Badges**
   - Small colored badges showing relation type and target card title
   - Max 3 badges displayed on compact cards
   - Count indicator shown when more relations exist

3. **Stats Summary**
   - Summary text showing total blocking/blocked/depends/related counts
   - Displayed in card footer area

### Card Modal

The card edit modal includes a "Relations" section showing:
- All outgoing relations (cards this card points to)
- All incoming relations (cards that point to this card)
- Ability to add new relations
- Ability to remove existing relations

### Relation Creation

- Click "Add relation" button on card
- Search for and select the target card
- Select relation type (blocks, blocked_by, depends_on, related_to)
- Visual indicator shows on both cards

## Data Model

```typescript
type RelationType = 'blocks' | 'blocked_by' | 'depends_on' | 'related_to';

type CardSummary = {
  id: string;
  title: string;
  boardId: string;
  boardName: string;
  columnId: string;
  columnName: string;
};

type CardRelation = {
  id: string;
  sourceCardId: string;
  targetCardId: string;
  relationType: RelationType;
  createdAt: string;
  updatedAt: string;
  sourceCard?: CardSummary;
  targetCard?: CardSummary;
};

// Database model
model CardRelation {
  id            String   @id @default(cuid())
  sourceCardId  String
  targetCardId  String
  relationType  String   @default("blocks")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  sourceCard    Card     @relation("CardRelationsSource", ...)
  targetCard    Card     @relation("CardRelationsTarget", ...)
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards/[cardId]/relations` | Get all relations for a card |
| POST | `/api/cards/[cardId]/relations` | Create a new relation |
| DELETE | `/api/cards/[cardId]/relations?targetCardId=xxx` | Remove a relation |

### GET Response Format

```json
[
  {
    "id": "rel-123",
    "sourceCardId": "card-1",
    "targetCardId": "card-2",
    "relationType": "blocks",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "sourceCard": {
      "id": "card-1",
      "title": "Task A",
      "boardId": "board-1",
      "boardName": "Project Board",
      "columnId": "col-1",
      "columnName": "To Do"
    },
    "targetCard": {
      "id": "card-2",
      "title": "Task B",
      "boardId": "board-1",
      "boardName": "Project Board",
      "columnId": "col-2",
      "columnName": "In Progress"
    }
  }
]
```

### POST Request Format

```json
{
  "targetCardId": "card-2",
  "relationType": "blocks"
}
```

## Frontend Components

### DependencyIndicators

Main component for displaying dependency information:

```tsx
import { DependencyBadge, DependencyIndicators, DependencyStats } from './DependencyIndicators';

// Individual badge
<DependencyBadge 
  relation={cardRelation} 
  compact={false} 
/>;

// Collection of badges
<DependencyIndicators 
  relations={card.relations} 
  compact={false} 
  maxDisplay={3}
/>;

// Statistics summary
<DependencyStats relations={card.relations} />
```

### Helper Functions

```tsx
import { isCardBlocked, isCardBlocking } from './DependencyIndicators';

// Check if card is blocked by others
const blocked = isCardBlocked(card.relations);

// Check if card is blocking others
const blocking = isCardBlocking(card.relations);
```

## Implementation Status

### ✅ Completed Features

- [x] Database schema for CardRelation model
- [x] API endpoints for CRUD operations
- [x] TypeScript types for relations
- [x] Dependency indicator UI components
- [x] Visual status indicators on cards (colored rings)
- [x] Dependency badges with icons and colors
- [x] Helper functions for status checking
- [x] Unit tests for relation types and helpers
- [x] Cycle detection for preventing circular dependencies

### 🚧 In Progress

- [ ] Card modal integration for managing relations
- [ ] Relation selector/search component
- [ ] Cross-board linking support

### 📋 Future Enhancements

- [ ] Dependency graph visualization
- [ ] Filter by dependency status
- [ ] Bulk relation management
- [ ] Dependency notifications
- [ ] Export/import relations

## Testing

### Unit Tests

Tests are located in `tests/features/card-relations/card-relations.test.ts` and cover:

- Relation type definitions
- Card relation structure validation
- Create request validation
- Relation type labels and descriptions
- Filtering helpers (blocking, blocked by, depends on, related to)
- Self-reference prevention
- Cycle detection

Run tests with:
```bash
npx vitest run tests/features/card-relations/card-relations.test.ts
```

### Manual Testing Checklist

- [ ] Create a blocking relation between two cards
- [ ] Verify visual indicators appear on both cards
- [ ] Test each relation type (blocks, blocked_by, depends_on, related_to)
- [ ] Test relation deletion
- [ ] Test self-reference prevention
- [ ] Test circular dependency prevention
- [ ] Test cross-board card linking

## Complexity: Medium

- Database schema changes ✅ Complete
- API implementation ✅ Complete  
- UI/UX design for visualization ✅ Complete
- Circular dependency detection ✅ Complete
- Cross-board linking ✅ Pending

## Recent Changes

### Latest: Dependency Indicators Implementation (2024-01-15)

Added visual dependency indicators to cards:

- **Visual Status Rings**: Cards now display colored rings indicating their blocking status
  - Red ring when blocked by another card
  - Yellow ring when blocking other cards
  - No ring when no blocking relationships

- **Dependency Badges**: Small badges showing relation type and linked card
  - Color-coded by relation type
  - Icons indicate relation type
  - Truncated card titles for space efficiency

- **Stats Summary**: Optional summary showing total relations
  - Compact display of all relation counts
  - Helpful for understanding dependency landscape

- **Helper Functions**: Utility functions for common checks
  - `isCardBlocked()`: Check if card has any incoming blocks
  - `isCardBlocking()`: Check if card has any outgoing blocks
