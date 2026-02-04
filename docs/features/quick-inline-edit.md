# Quick Inline Edit

Edit card titles directly on the board without opening the card modal.

## Overview

Power users can quickly edit card titles by clicking on them directly.

## User Stories

- As a user, I want to click a card title to edit it inline
- As a user, I want to press Enter to save changes
- As a user, I want to press Escape to cancel editing

## UI Behavior

1. Click card title → transforms to input field
2. Type new title → changes saved on blur or Enter
3. Click elsewhere → save and close
4. Press Escape → cancel editing

## Implementation

### Component: QuickEditTitle

```typescript
interface QuickEditTitleProps {
  cardId: string;
  initialTitle: string;
  onSave: (title: string) => void;
}
```

### Implementation Steps

1. Add click handler to card title
2. Replace title with input field
3. Handle keyboard events (Enter, Escape)
4. Call API to update card title
5. Show loading state while saving

## Complexity: Easy
- Simple UI toggle
- API call for title update
- Error handling/revert on failure
