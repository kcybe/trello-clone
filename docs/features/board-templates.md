# Board Templates Implementation Guide

## Overview

Board Templates allow users to create pre-configured board layouts that can be reused to quickly set up new boards with predefined lists, cards, labels, and settings. This feature is essential for teams that frequently create similar project structures (e.g., sprint boards, Kanban workflows, content calendars).

## Data Structure for Templates

### BoardTemplate Model

```typescript
interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  coverImage?: string;
  authorId: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  config: BoardConfig;
}

interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

// Predefined categories: Project Management, Software Development, 
// Marketing, Sales, HR, Education, Personal, Other
```

### BoardConfig (The Template Content)

```typescript
interface BoardConfig {
  lists: ListConfig[];
  labels: LabelConfig[];
  cards: CardConfig[];
  settings: BoardSettings;
  automation?: AutomationRule[];
}

interface ListConfig {
  id: string;
  name: string;
  position: number;
  color?: string;
  isCollapsed: boolean;
}

interface LabelConfig {
  id: string;
  name: string;
  color: string; // hex code
  description?: string;
}

interface CardConfig {
  id: string;
  listId: string;
  name: string;
  description?: string;
  position: number;
  labels: string[]; // label IDs
  dueDate?: Date;
  assignees: string[]; // user IDs (for demo templates)
  checklist?: ChecklistConfig;
  attachments?: AttachmentConfig[];
}

interface ChecklistConfig {
  name: string;
  items: ChecklistItemConfig[];
}

interface ChecklistItemConfig {
  name: string;
  completed: boolean;
}

interface BoardSettings {
  backgroundColor?: string;
  backgroundImage?: string;
  permissionLevel: 'public' | 'private' | 'organization';
  votingEnabled: boolean;
  commentsEnabled: boolean;
  cardCoversEnabled: boolean;
  isArchived: boolean;
}

interface AutomationRule {
  id: string;
  trigger: string;
  action: string;
  conditions?: Record<string, any>;
}
```

### Sample Template JSON (Sprint Board)

```json
{
  "name": "Agile Sprint Board",
  "description": "A complete agile sprint setup with backlog, sprint columns, and tracking.",
  "category": "Software Development",
  "lists": [
    {"id": "l1", "name": "Backlog", "position": 0, "color": "#EBECF0"},
    {"id": "l2", "name": "Sprint Ready", "position": 1, "color": "#FFD700"},
    {"id": "l3", "name": "In Progress", "position": 2, "color": "#FF6B6B"},
    {"id": "l4", "name": "Code Review", "position": 3, "color": "#4ECDC4"},
    {"id": "l5", "name": "Done", "position": 4, "color": "#45B7D1"}
  ],
  "labels": [
    {"id": "lab1", "name": "Bug", "color": "#EB5A46"},
    {"id": "lab2", "name": "Feature", "color": "#61BD4F"},
    {"id": "lab3", "name": "Enhancement", "color": "#F2D600"},
    {"id": "lab4", "name": "Documentation", "color": "#C4C9CC"}
  ],
  "cards": [
    {
      "id": "c1",
      "listId": "l1",
      "name": "Sample User Story",
      "description": "Add sample cards to your sprint",
      "position": 0,
      "labels": ["lab2"],
      "assignees": [],
      "checklist": {
        "name": "Acceptance Criteria",
        "items": [
          {"name": "Define requirements", "completed": false},
          {"name": "Write tests", "completed": false}
        ]
      }
    }
  ],
  "settings": {
    "permissionLevel": "private",
    "votingEnabled": true,
    "commentsEnabled": true,
    "cardCoversEnabled": true
  }
}
```

---

## API Endpoints

### Template CRUD Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List all templates (with filters) |
| GET | `/api/templates/:id` | Get template details |
| POST | `/api/templates` | Create a new template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |
| POST | `/api/templates/:id/duplicate` | Create template from existing board |

### Template Usage

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/templates/:id/create-board` | Create a new board from template |
| GET | `/api/templates/:id/preview` | Get template preview (without internal IDs) |
| POST | `/api/templates/:id/favorite` | Mark template as favorite |
| DELETE | `/api/templates/:id/favorite` | Remove from favorites |

### Template Category Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates/categories` | List all categories |
| GET | `/api/templates/categories/:id` | Get category with templates |

### User Template Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me/templates` | Get user's created templates |
| GET | `/api/users/me/favorites` | Get user's favorite templates |
| GET | `/api/users/me/recent-templates` | Get recently used templates |

### Sample API Request/Response

**POST** `/api/templates/:id/create-board`

Request:
```json
{
  "boardName": "Q2 Sprint Board",
  "teamId": "team_123",
  "templateOptions": {
    "includeCards": true,
    "includeLabels": true,
    "includeSettings": true
  }
}
```

Response:
```json
{
  "board": {
    "id": "board_new_456",
    "name": "Q2 Sprint Board",
    "url": "/board/board_new_456"
  }
}
```

---

## UI Components

### 1. Template Gallery (`TemplateGallery`)
- Grid layout displaying available templates
- Filter by category
- Search functionality
- "Create from template" CTA on each card

### 2. Template Card (`TemplateCard`)
```jsx
<TemplateCard
  template={template}
  onSelect={() => handleSelect(template)}
  onPreview={() => openPreview(template)}
  onFavorite={() => toggleFavorite(template)}
  isFavorite={isFavorite}
/>
```
- Template preview image
- Title and description
- Category badge
- Usage count indicator
- Favorite button

### 3. Template Preview Modal (`TemplatePreviewModal`)
- Full template content preview
- Expandable lists and cards
- "Use this template" button
- "Create custom template from this" option

### 4. Template Creator (`TemplateCreator`)
- Step-by-step wizard for creating templates
- Import from existing board option
- Edit template configuration
- Category and cover image selection

### 5. Create Board from Template Flow
```
1. User clicks "Create from Template"
           ↓
2. Template Gallery modal opens
           ↓
3. User selects template
           ↓
4. Optional: Edit board name, team
           ↓
5. Loading state while creating
           ↓
6. Redirect to new board
```

### 6. Template Management Page (Admin)
- List of user's templates
- Edit/Delete actions
- Analytics (usage count)
- Public/Private toggle

---

## Database Schema Changes

### PostgreSQL Schema

```sql
-- Templates table
CREATE TABLE board_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES template_categories(id),
    cover_image TEXT,
    author_id UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template categories table
CREATE TABLE template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false
);

-- User favorites (templates)
CREATE TABLE user_template_favorites (
    user_id UUID REFERENCES users(id),
    template_id UUID REFERENCES board_templates(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, template_id)
);

-- Template usage analytics
CREATE TABLE template_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES board_templates(id),
    user_id UUID REFERENCES users(id),
    board_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_templates_category ON board_templates(category_id);
CREATE INDEX idx_templates_author ON board_templates(author_id);
CREATE INDEX idx_templates_public ON board_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_templates_usage ON board_templates(usage_count DESC);
CREATE INDEX idx_template_favorites_user ON user_template_favorites(user_id);
```

### MongoDB Schema (Alternative)

```javascript
// BoardTemplate collection
{
  _id: ObjectId,
  name: String,
  description: String,
  category: {
    id: ObjectId,
    name: String,
    icon: String
  },
  coverImage: String,
  authorId: ObjectId,
  isPublic: Boolean,
  usageCount: Number,
  config: {
    lists: [{
      id: String,
      name: String,
      position: Number,
      color: String,
      isCollapsed: Boolean
    }],
    labels: [{
      id: String,
      name: String,
      color: String,
      description: String
    }],
    cards: [{
      id: String,
      listId: String,
      name: String,
      description: String,
      position: Number,
      labels: [String],
      dueDate: Date,
      assignees: [ObjectId],
      checklist: {
        name: String,
        items: [{
          name: String,
          completed: Boolean
        }]
      }
    }],
    settings: {
      backgroundColor: String,
      backgroundImage: String,
      permissionLevel: String,
      votingEnabled: Boolean,
      commentsEnabled: Boolean,
      cardCoversEnabled: Boolean
    }
  },
  createdAt: Date,
  updatedAt: Date
}

// TemplateCategory collection
{
  _id: ObjectId,
  name: String,
  icon: String,
  sortOrder: Number,
  isDefault: Boolean
}

// User favorites (embedded in user document or separate)
{
  userId: ObjectId,
  templateId: ObjectId,
  createdAt: Date
}
```

---

## Implementation Steps

### Phase 1: Foundation
1. Create database migrations for new tables
2. Build backend API endpoints for template CRUD
3. Implement template storage with JSONB config
4. Create seed data for default templates

### Phase 2: Template Creation
1. Add "Save as Template" feature from existing boards
2. Build template editor UI
3. Implement board-to-template conversion logic
4. Add template preview functionality

### Phase 3: Template Gallery
1. Build template gallery component
2. Implement category filtering
3. Add search functionality
4. Create template preview modal

### Phase 4: Board Creation from Template
1. Implement template-to-board cloning
2. Handle ID mapping between template and board
3. Add loading states and progress indicators
4. Redirect to new board after creation

### Phase 5: Enhancements
1. Add template favorites functionality
2. Implement template analytics
3. Add template recommendations
4. Enable public template sharing
5. Add template rating/reviews

---

## Best Practices

### 1. Template Design Guidelines
- Keep templates focused on a specific use case
- Include example cards to demonstrate usage
- Use consistent color coding for labels
- Provide clear, descriptive names
- Add helpful descriptions explaining template purpose

### 2. Performance Considerations
- Cache frequently accessed templates
- Use pagination for template galleries
- Lazy load template previews
- Optimize JSONB queries with indexes

### 3. User Experience
- Show template preview before creation
- Allow template customization during creation
- Provide empty state guidance
- Include tips for template usage

### 4. Data Integrity
- Validate template JSON structure on save
- Handle missing references gracefully
- Use transactions for template-to-board creation
- Implement soft delete for templates

### 5. Security
- Validate template ownership before edits
- Sanitize template JSON to prevent XSS
- Implement rate limiting for template creation
- Check template permissions before cloning

---

## Migration Strategy

```sql
-- Add default categories
INSERT INTO template_categories (name, icon, sort_order, is_default) VALUES
('Project Management', '📊', 1, true),
('Software Development', '💻', 2, true),
('Marketing', '📣', 3, true),
('Sales', '💰', 4, true),
('HR', '👥', 5, true),
('Education', '📚', 6, true),
('Personal', '🏠', 7, true),
('Other', '📦', 8, false);
```

---

## Testing Requirements

1. **Unit Tests**: Template CRUD operations, validation
2. **Integration Tests**: Template-to-board cloning flow
3. **E2E Tests**: Complete template gallery experience
4. **Performance Tests**: Gallery load time with many templates
5. **Security Tests**: Template ownership and permissions

---

## Related Features

- Board sharing and permissions
- Label management
- Card automation
- Team workspaces
- Activity logging
