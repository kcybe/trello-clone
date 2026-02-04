# Checklist Templates

Reusable checklist templates for common recurring tasks.

## Overview

Create and save checklist templates that can be applied to new cards.

## User Stories

- As a user, I want to save a checklist as a template
- As a user, I want to apply a template to a card
- As a user, I want to manage my templates

## Data Model

```typescript
interface ChecklistTemplate {
  id: string;
  userId: string; // or boardId for shared
  name: string;
  items: {
    text: string;
    isChecked?: boolean;
  }[];
}

interface Checklist {
  id: string;
  cardId: string;
  templateId?: string; // If created from template
  items: {
    text: string;
    isChecked: boolean;
  }[];
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/templates/checklists` | Create template |
| GET | `/api/templates/checklists` | List templates |
| POST | `/api/cards/:id/checklist-from-template` | Apply template |

## UI Components

1. `TemplateManager` - CRUD for templates
2. `TemplateCard` - Display template preview
3. `TemplateSelector` - Choose template when adding checklist

## Implementation Steps

### Phase 1: Personal Templates
1. Create ChecklistTemplate model
2. Add "Save as template" option
3. Build template management UI
4. Apply template to cards

### Phase 2: Shared Templates
1. Share templates at board level
2. Template library

## Complexity: Medium
- Template CRUD
- UI for template selection
- Card integration
