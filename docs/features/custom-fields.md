# Custom Fields

Add custom data fields to cards beyond the standard fields.

## Overview

Create custom field types (text, number, date, dropdown, checkbox) for specific team needs.

## Field Types

| Type | Use Case |
|------|----------|
| Text | Custom notes, tracking numbers |
| Number | Priority, budget, count |
| Date | Start date, delivery date |
| Dropdown | Status, category, severity |
| Checkbox | Boolean flags, approvals |
| URL | Links to external resources |

## Data Model

```typescript
interface CustomFieldDefinition {
  id: string;
  boardId: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'url';
  options?: string[]; // For dropdown
  required: boolean;
}

interface CustomFieldValue {
  id: string;
  fieldId: string;
  cardId: string;
  value: string | number | boolean | Date | null;
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/boards/:id/fields` | Create field |
| PUT | `/api/fields/:id` | Update field |
| DELETE | `/api/fields/:id` | Delete field |
| PUT | `/api/cards/:id/fields/:fieldId` | Set field value |

## UI Components

1. `CustomFieldEditor` - Add/edit fields on board
2. `FieldRenderer` - Display field value on card
3. `FieldInput` - Edit field value
4. `FieldFilter` - Filter by custom fields

## Implementation Steps

### Phase 1: Basic Fields
1. Create CustomFieldDefinition model
2. Create CustomFieldValue model
3. Build field creation UI
4. Implement field value editing

### Phase 2: Filtering
1. Add filter UI for custom fields
2. Implement filter logic

### Phase 3: Advanced
1. Validation rules
2. Field permissions
3. Field templates

## Complexity: Hard
- Complex data model
- UI for multiple field types
- Filter integration
- Migration when deleting fields
