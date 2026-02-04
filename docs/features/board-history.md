# Board History/Versions

Track changes made to boards over time with the ability to restore previous states.

## Overview

Audit trail and version history for boards, allowing users to see what changed and optionally restore.

## User Stories

- As a user, I want to see a history of changes to the board
- As a user, I want to see who made each change
- As a user, I want to restore a previous board state
- As a user, I want to filter history by action type

## Change Types

| Action | Description |
|--------|-------------|
| CARD_CREATE | New card added |
| CARD_MOVE | Card moved between lists |
| CARD_UPDATE | Card fields changed |
| CARD_DELETE | Card archived |
| LIST_CREATE | New list added |
| LIST_UPDATE | List renamed/reordered |
| LIST_DELETE | List archived |

## Data Model

```typescript
interface BoardHistoryEntry {
  id: string;
  boardId: string;
  userId: string;
  action: string;
  entityType: 'card' | 'list' | 'label' | 'member';
  entityId: string;
  previousValue?: any;
  newValue?: any;
  timestamp: Date;
}

interface BoardSnapshot {
  id: string;
  boardId: string;
  snapshot: any; // Full board state
  createdAt: Date;
  reason: 'manual' | 'scheduled';
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards/:id/history` | Get history entries |
| GET | `/api/boards/:id/snapshots` | Get snapshots |
| POST | `/api/boards/:id/snapshots` | Create snapshot |
| POST | `/api/boards/:id/restore` | Restore from snapshot |

## UI Components

1. `HistoryTimeline` - Visual timeline of changes
2. `HistoryEntry` - Individual change display
3. `SnapshotManager` - View and restore snapshots
4. `DiffViewer` - Show before/after comparison

## Implementation Steps

### Phase 1: Activity Log
1. Create BoardHistoryEntry model
2. Add hooks to record changes
3. Build history viewer UI
4. Filter by user/date/action

### Phase 2: Snapshots
1. Create BoardSnapshot model
2. Implement snapshot creation (cron)
3. Build restore functionality
4. Add diff visualization

## Complexity: Hard
- Change tracking across all entities
- Storage for snapshots
- Restore logic
- Performance optimization
