# Real-Time Collaboration Feature

This document describes the real-time collaboration implementation using WebSocket support in the Trello Clone project.

## Overview

The real-time collaboration feature enables multiple users to simultaneously edit the same board with automatic synchronization across all connected clients. This is achieved using Socket.IO for WebSocket communication.

## Features

### 1. Real-Time Synchronization
- **Instant Updates**: All board changes (cards, columns, moves) are immediately visible to all connected users
- **Room-based Broadcasting**: Users join specific board rooms and only receive updates for boards they're viewing
- **Connection Management**: Automatic reconnection with graceful handling of network interruptions

### 2. User Presence
- **Online Indicators**: See which users are currently viewing the board
- **Activity Tracking**: Users' last active timestamp is updated
- **Color-coded Users**: Each user is assigned a unique color for identification

### 3. Concurrent Edit Handling
- **Version Tracking**: Each card and column has a version number for conflict detection
- **Last-Write-Wins Strategy**: When conflicts occur, the most recent update takes precedence
- **Optimistic Updates**: Local changes are applied immediately for responsiveness

### 4. Editing Indicators
- **Active Editor Detection**: See which users are currently editing specific cards or columns
- **Visual Feedback**: Highlight cards being edited by other users
- **Lock-free Collaboration**: Multiple users can edit different cards simultaneously

### 5. Cursor Sharing (Optional)
- **Real-time Cursor Positions**: See other users' cursor locations on the board
- **Card Highlighting**: Hover effects when users have a card selected

## Architecture

### Client-Side Components

#### `useCollaborativeBoard` Hook
The main hook that integrates real-time collaboration with board state:

```typescript
const {
  isConnected,      // WebSocket connection status
  presence,         // Array of users currently viewing the board
  activeEditors,    // Map of entities being edited
  updateCursor,     // Function to update cursor position
  startEditing,     // Function to mark entity as being edited
  stopEditing,      // Function to mark editing as complete
  emitCardCreated,  // Emit card creation event
  emitCardUpdated,  // Emit card update event
  emitCardDeleted,  // Emit card deletion event
  emitCardMoved,    // Emit card move event
  emitColumnCreated, // Emit column creation event
  emitColumnDeleted, // Emit column deletion event
} = useCollaborativeBoard(boardId, currentBoard, updateBoard, userId, userName);
```

#### Socket Events

**Client → Server Events:**
- `board:join` - Join a board room
- `board:leave` - Leave a board room
- `presence:join` - Announce user presence
- `presence:leave` - Announce user departure
- `cursor:move` - Update cursor position
- `editing:begin` - Start editing an entity
- `editing:end` - Stop editing an entity
- `card:created` - Create a new card
- `card:updated` - Update an existing card
- `card:deleted` - Delete a card
- `card:move` - Move a card between columns
- `column:created` - Create a new column
- `column:deleted` - Delete a column

**Server → Client Events:**
- `user:joined` - A user joined the board
- `user:left` - A user left the board
- `presence:update` - Updated presence list
- `cursor:update` - Another user's cursor moved
- `editing:start` - A user started editing
- `editing:stop` - A user stopped editing
- `card:created` - A card was created
- `card:updated` - A card was updated
- `card:deleted` - A card was deleted
- `card:move` - A card was moved
- `column:created` - A column was created
- `column:deleted` - A column was deleted

### Server-Side Components

#### Standalone Socket Server
The Socket.IO server runs as a separate process on port 3001 (configurable via `SOCKET_PORT`):

```bash
npm run dev:socket
```

**Server Features:**
- Room-based message routing
- CORS configuration for cross-origin requests
- Automatic reconnection handling
- Graceful shutdown on SIGTERM/SIGINT

#### Conflict Resolution

The system uses a **Last-Write-Wins (LWW)** strategy with version tracking:

1. **Version Numbers**: Each entity (card/column) has a `_version` property
2. **Update Validation**: Incoming updates are only applied if their version is newer
3. **Automatic Increment**: Versions are incremented on each successful update

```typescript
// Example version check in handler
const currentVersion = entityVersions.get(`card:${data.cardId}`) || 0;
if (data.updates._version && data.updates._version < currentVersion) {
  // Skip outdated update
  return;
}
```

## Integration

### 1. Using in a Component

```typescript
'use client';

import { useCollaborativeBoard } from '@/lib/socket/useCollaborativeBoard';

export function MyBoardComponent({ boardId, user }) {
  const {
    isConnected,
    presence,
    activeEditors,
    emitCardCreated,
    // ... other functions
  } = useCollaborativeBoard(
    boardId,
    currentBoard,
    updateBoard,
    user?.id,
    user?.name
  );

  // Show presence indicators
  return (
    <div>
      {presence.map(user => (
        <UserBadge key={user.id} user={user} />
      ))}
      {/* Board content */}
    </div>
  );
}
```

### 2. Using with useBoardSocket

The existing `useBoardSocket` hook can be extended with collaborative features:

```typescript
import { useBoardSocket } from '@/features/board/hooks/useBoardSocket';
import { useCollaborativeBoard } from '@/lib/socket/useCollaborativeBoard';

// In your component
const boardActions = useBoardSocket(user);
const { presence, activeEditors, startEditing, stopEditing } = useCollaborativeBoard(
  boardActions.currentBoard?.id,
  boardActions.currentBoard,
  boardActions.updateCurrentBoard,
  user?.id,
  user?.name
);
```

## Configuration

### Environment Variables

```env
# Socket server port
SOCKET_PORT=3001

# Frontend URL for CORS
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Socket URL (frontend)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### CORS Configuration

The Socket.IO server is configured with CORS to allow connections from the Next.js app:

```typescript
{
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
}
```

## Performance Considerations

### 1. Room Management
- Users only join rooms for boards they're viewing
- Efficient leave/join handling to prevent memory leaks

### 2. Event Batching
- Multiple rapid updates can be batched for efficiency
- Debouncing can be added for cursor updates

### 3. Connection Pooling
- Single socket connection per client
- Automatic reconnection with exponential backoff

## Error Handling

### 1. Connection Errors
- Automatic reconnection attempts (up to 5 times)
- Connection status exposed via `isConnected`

### 2. Event Errors
- Errors in event handlers don't crash the server
- Console logging for debugging

### 3. Conflict Resolution
- Outdated updates are silently skipped
- Local state remains consistent

## Testing

### Unit Tests

Tests for the collaboration features are located in `/src/lib/socket/__tests__/`:

```typescript
// Example test
describe('useCollaborativeBoard', () => {
  it('should update presence when users join', () => {
    // Test presence tracking
  });

  it('should handle concurrent edits correctly', () => {
    // Test version-based conflict resolution
  });

  it('should emit events correctly', () => {
    // Test event emission
  });
});
```

### Integration Tests

Test the full real-time flow:

```typescript
describe('Real-time Collaboration', () => {
  it('should sync card creation across clients', async () => {
    // Test full sync flow
  });

  it('should handle user presence correctly', async () => {
    // Test presence management
  });
});
```

## Future Enhancements

### 1. Operational Transformation (OT)
For more complex conflict resolution, implement OT:
- Transform concurrent edits
- Preserve user intent
- Support real-time text editing

### 2. Cursor Sharing
- Track cursor positions in real-time
- Show other users' cursors on the board
- Highlight cards being hovered

### 3. Offline Support
- Queue changes when offline
- Sync when connection is restored
- Handle merge conflicts gracefully

### 4. Presence Awareness
- Show user avatars in header
- Indicate currently active users
- Filter activity by user

## Troubleshooting

### Common Issues

1. **Socket not connecting**
   - Check if socket server is running
   - Verify CORS configuration
   - Check network connectivity

2. **Updates not syncing**
   - Ensure all clients are on the same board
   - Check version numbers
   - Verify event listeners are set up

3. **Presence not updating**
   - Check presence join/leave events
   - Verify user data is being passed correctly

### Debug Mode

Enable debug logging by setting:

```typescript
process.env.DEBUG = 'socket.io:*';
```

## Security Considerations

### 1. Authentication
- Socket connections should be authenticated
- Validate user identity on connection

### 2. Authorization
- Check board access permissions
- Validate user can perform actions

### 3. Rate Limiting
- Implement rate limiting for events
- Prevent spam attacks

### 4. Input Validation
- Sanitize all incoming data
- Validate event payloads

## Related Files

- `/src/lib/socket/client.ts` - Socket client implementation
- `/src/lib/socket/server-only.ts` - Server-side socket logic
- `/src/lib/socket/server-standalone.ts` - Standalone server entry point
- `/src/lib/socket/emitter.ts` - Event emitter utilities
- `/src/lib/socket/hooks.ts` - Socket hooks
- `/src/lib/socket/real-time.ts` - Real-time sync utilities
- `/src/lib/socket/collaboration.ts` - Collaboration types and utilities
- `/src/lib/socket/useCollaborativeBoard.ts` - Main collaborative hook
- `/src/features/board/hooks/useBoardSocket.ts` - Board integration hook
