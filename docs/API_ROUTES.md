# API Routes Reference

This document describes all planned API endpoints for the Trello Clone backend.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints (unless specified as public) require authentication via BetterAuth session cookie.

### Authentication Headers

```http
Cookie: better-auth.session_token=your-session-token
```

---

## Boards

### Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/boards` | List all user's boards | Yes |
| POST | `/api/boards` | Create new board | Yes |
| GET | `/api/boards/[id]` | Get single board | Yes |
| PUT | `/api/boards/[id]` | Update board | Yes |
| DELETE | `/api/boards/[id]` | Delete board | Yes |
| POST | `/api/boards/[id]/duplicate` | Duplicate board | Yes |
| GET | `/api/boards/[id]/members` | List board members | Yes |
| POST | `/api/boards/[id]/members` | Add board member | Yes |
| DELETE | `/api/boards/[id]/members/[userId]` | Remove member | Yes |
| GET | `/api/boards/[id]/activities` | Get activity log | Yes |

---

### GET /api/boards

List all boards the authenticated user has access to.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by board name

**Request:**
```bash
curl -X GET "http://localhost:3000/api/boards?page=1&limit=10&search=project" \
  -H "Cookie: better-auth.session_token=your-token"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "boards": [
      {
        "id": "board_abc123",
        "name": "Project Alpha",
        "description": "Main project board",
        "isPublic": false,
        "ownerId": "user_xyz789",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-20T14:45:00Z",
        "_count": {
          "columns": 5,
          "members": 3
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

---

### POST /api/boards

Create a new board.

**Request Body:**
```json
{
  "name": "New Board Name",
  "description": "Board description (optional)",
  "isPublic": false,
  "template": "kanban"  // optional: "kanban", "scrum", "bug-tracking"
}
```

**Request:**
```bash
curl -X POST "http://localhost:3000/api/boards" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "name": "My New Board",
    "description": "A new project board",
    "template": "kanban"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "board_new123",
    "name": "My New Board",
    "description": "A new project board",
    "isPublic": false,
    "ownerId": "user_xyz789",
    "createdAt": "2024-01-20T15:00:00Z",
    "updatedAt": "2024-01-20T15:00:00Z",
    "columns": [
      {
        "id": "col_1",
        "title": "To Do",
        "position": 0
      },
      {
        "id": "col_2",
        "title": "In Progress",
        "position": 1
      },
      {
        "id": "col_3",
        "title": "Done",
        "position": 2
      }
    ]
  }
}
```

---

### GET /api/boards/[id]

Get a single board with all columns and cards.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/boards/board_abc123" \
  -H "Cookie: better-auth.session_token=your-token"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "board_abc123",
    "name": "Project Alpha",
    "description": "Main project board",
    "isPublic": false,
    "ownerId": "user_xyz789",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z",
    "columns": [
      {
        "id": "col_todo",
        "title": "To Do",
        "position": 0,
        "color": "#3b82f6",
        "cards": [
          {
            "id": "card_1",
            "title": "Design mockups",
            "description": "Create UI designs",
            "position": 0,
            "dueDate": null,
            "createdAt": "2024-01-16T09:00:00Z"
          }
        ],
        "archivedCards": []
      },
      {
        "id": "col_progress",
        "title": "In Progress",
        "position": 1,
        "cards": [],
        "archivedCards": []
      },
      {
        "id": "col_done",
        "title": "Done",
        "position": 2,
        "cards": [],
        "archivedCards": []
      }
    ],
    "members": [
      {
        "id": "member_1",
        "userId": "user_xyz789",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "OWNER",
        "image": null
      }
    ],
    "activities": [
      {
        "id": "activity_1",
        "type": "board_created",
        "description": "Board created",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### PUT /api/boards/[id]

Update board details.

**Request Body (all fields optional):**
```json
{
  "name": "Updated Board Name",
  "description": "Updated description",
  "isPublic": true
}
```

**Request:**
```bash
curl -X PUT "http://localhost:3000/api/boards/board_abc123" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "name": "Updated Board Name",
    "description": "New description"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "board_abc123",
    "name": "Updated Board Name",
    "description": "New description",
    "isPublic": false,
    "updatedAt": "2024-01-20T16:00:00Z"
  }
}
```

---

## Columns

### Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/boards/[id]/columns` | List columns | Yes |
| POST | `/api/boards/[id]/columns` | Create column | Yes |
| GET | `/api/boards/[id]/columns/[colId]` | Get column | Yes |
| PUT | `/api/boards/[id]/columns/[colId]` | Update column | Yes |
| PUT | `/api/boards/[id]/columns/reorder` | Reorder columns | Yes |
| DELETE | `/api/boards/[id]/columns/[colId]` | Delete column | Yes |

---

### GET /api/boards/[id]/columns

List all columns in a board.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/boards/board_abc123/columns" \
  -H "Cookie: better-auth.session_token=your-token"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "columns": [
      {
        "id": "col_todo",
        "title": "To Do",
        "position": 0,
        "color": "#3b82f6",
        "_count": {
          "cards": 5
        }
      }
    ]
  }
}
```

---

### POST /api/boards/[id]/columns

Create a new column.

**Request Body:**
```json
{
  "title": "New Column",
  "color": "#8b5cf6",
  "position": 2  // optional, appends to end if not provided
}
```

**Request:**
```bash
curl -X POST "http://localhost:3000/api/boards/board_abc123/columns" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "title": "Code Review",
    "color": "#8b5cf6"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "col_new456",
    "title": "Code Review",
    "color": "#8b5cf6",
    "position": 2,
    "boardId": "board_abc123",
    "createdAt": "2024-01-20T16:30:00Z"
  }
}
```

---

### PUT /api/boards/[id]/columns/reorder

Reorder columns (drag and drop).

**Request Body:**
```json
{
  "columnIds": ["col_todo", "col_done", "col_progress"]
}
```

**Request:**
```bash
curl -X PUT "http://localhost:3000/api/boards/board_abc123/columns/reorder" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "columnIds": ["col_todo", "col_done", "col_progress"]
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Columns reordered successfully"
  }
}
```

---

## Cards

### Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/boards/[id]/columns/[colId]/cards` | List cards in column | Yes |
| POST | `/api/boards/[id]/columns/[colId]/cards` | Create card | Yes |
| GET | `/api/boards/[id]/columns/[colId]/cards/[cardId]` | Get card | Yes |
| PUT | `/api/boards/[id]/columns/[colId]/cards/[cardId]` | Update card | Yes |
| PUT | `/api/boards/[id]/columns/[colId]/cards/[cardId]/move` | Move card | Yes |
| DELETE | `/api/boards/[id]/columns/[colId]/cards/[cardId]` | Delete card | Yes |

---

### GET /api/boards/[id]/columns/[colId]/cards

List all cards in a column.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/boards/board_abc123/columns/col_todo/cards" \
  -H "Cookie: better-auth.session_token=your-token"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": "card_1",
        "title": "Design mockups",
        "description": "Create UI designs for the dashboard",
        "position": 0,
        "dueDate": "2024-02-01T00:00:00Z",
        "isArchived": false,
        "assignee": {
          "id": "user_xyz789",
          "name": "John Doe",
          "email": "john@example.com",
          "image": null
        },
        "labels": [
          {
            "id": "label_1",
            "text": "Design",
            "color": "#ec4899"
          }
        ],
        "_count": {
          "comments": 3,
          "attachments": 2,
          "checklists": 1
        },
        "createdAt": "2024-01-16T09:00:00Z",
        "updatedAt": "2024-01-18T14:20:00Z"
      }
    ]
  }
}
```

---

### POST /api/boards/[id]/columns/[colId]/cards

Create a new card.

**Request Body:**
```json
{
  "title": "New Card Title",
  "description": "Card description (optional)",
  "position": 0,  // optional, appends to end
  "dueDate": "2024-02-15T00:00:00Z",  // ISO date string
  "assigneeId": "user_abc123"  // optional
}
```

**Request:**
```bash
curl -X POST "http://localhost:3000/api/boards/board_abc123/columns/col_todo/cards" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "title": "Implement authentication",
    "description": "Add user login and registration",
    "dueDate": "2024-02-15T00:00:00Z",
    "assigneeId": "user_abc123"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "card_new789",
    "title": "Implement authentication",
    "description": "Add user login and registration",
    "position": 0,
    "dueDate": "2024-02-15T00:00:00Z",
    "isArchived": false,
    "columnId": "col_todo",
    "boardId": "board_abc123",
    "createdById": "user_xyz789",
    "createdAt": "2024-01-20T17:00:00Z",
    "updatedAt": "2024-01-20T17:00:00Z"
  }
}
```

---

### PUT /api/boards/[id]/columns/[colId]/cards/[cardId]/move

Move a card to a different column or position.

**Request Body:**
```json
{
  "columnId": "col_progress",  // target column
  "position": 0  // new position in column (0-based)
}
```

**Request:**
```bash
curl -X PUT "http://localhost:3000/api/boards/board_abc123/columns/col_todo/cards/card_1/move" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "columnId": "col_progress",
    "position": 0
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "card_1",
    "title": "Design mockups",
    "columnId": "col_progress",
    "position": 0,
    "updatedAt": "2024-01-20T17:30:00Z"
  }
}
```

---

### PUT /api/boards/[id]/columns/[colId]/cards/[cardId]

Update card details.

**Request Body (all fields optional):**
```json
{
  "title": "Updated Card Title",
  "description": "Updated description",
  "dueDate": "2024-02-20T00:00:00Z",
  "assigneeId": null,
  "position": 1
}
```

**Request:**
```bash
curl -X PUT "http://localhost:3000/api/boards/board_abc123/columns/col_todo/cards/card_1" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "title": "Updated Card Title",
    "description": "New description"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "card_1",
    "title": "Updated Card Title",
    "description": "New description",
    "position": 0,
    "dueDate": null,
    "isArchived": false,
    "updatedAt": "2024-01-20T18:00:00Z"
  }
}
```

---

## Labels

### Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/boards/[id]/columns/[colId]/cards/[cardId]/labels` | List card labels | Yes |
| POST | `/api/boards/[id]/columns/[colId]/cards/[cardId]/labels` | Add label to card | Yes |
| PUT | `/api/boards/[id]/columns/[colId]/cards/[cardId]/labels/[labelId]` | Update label | Yes |
| DELETE | `/api/boards/[id]/columns/[colId]/cards/[cardId]/labels/[labelId]` | Remove label | Yes |

---

### POST /api/boards/[id]/columns/[colId]/cards/[cardId]/labels

Add a label to a card.

**Request Body:**
```json
{
  "text": "Bug",
  "color": "#ef4444"
}
```

**Available Colors:**
- `#ef4444` - Red
- `#f97316` - Orange
- `#eab308` - Yellow
- `#22c55e` - Green
- `#3b82f6` - Blue
- `#8b5cf6` - Purple
- `#ec4899` - Pink

**Request:**
```bash
curl -X POST "http://localhost:3000/api/boards/board_abc123/columns/col_todo/cards/card_1/labels" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "text": "Bug",
    "color": "#ef4444"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "label_new101",
    "text": "Bug",
    "color": "#ef4444",
    "cardId": "card_1",
    "createdAt": "2024-01-20T18:30:00Z"
  }
}
```

---

## Comments

### Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/boards/[id]/columns/[colId]/cards/[cardId]/comments` | List comments | Yes |
| POST | `/api/boards/[id]/columns/[colId]/cards/[cardId]/comments` | Add comment | Yes |
| PUT | `/api/boards/[id]/columns/[colId]/cards/[cardId]/comments/[commentId]` | Update comment | Yes |
| DELETE | `/api/boards/[id]/columns/[colId]/cards/[cardId]/comments/[commentId]` | Delete comment | Yes |

---

### POST /api/boards/[id]/columns/[colId]/cards/[cardId]/comments

Add a comment to a card.

**Request Body:**
```json
{
  "text": "This looks great! Let's move forward."
}
```

**Request:**
```bash
curl -X POST "http://localhost:3000/api/boards/board_abc123/columns/col_todo/cards/card_1/comments" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "text": "This looks great! Let'"'"'s move forward."
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "comment_abc123",
    "text": "This looks great! Let's move forward.",
    "cardId": "card_1",
    "authorId": "user_xyz789",
    "createdAt": "2024-01-20T19:00:00Z",
    "updatedAt": "2024-01-20T19:00:00Z"
  }
}
```

---

## Attachments

### Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/boards/[id]/columns/[colId]/cards/[cardId]/attachments` | Upload attachment | Yes |
| GET | `/api/boards/[id]/columns/[colId]/cards/[cardId]/attachments/[attachId]` | Get attachment | Yes |
| DELETE | `/api/boards/[id]/columns/[colId]/cards/[cardId]/attachments/[attachId]` | Delete attachment | Yes |

---

### POST /api/boards/[id]/columns/[colId]/cards/[cardId]/attachments

Upload an attachment to a card.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: The file to upload (max 10MB)
- `name` (optional): Custom name for the file

**Request:**
```bash
curl -X POST "http://localhost:3000/api/boards/board_abc123/columns/col_todo/cards/card_1/attachments" \
  -H "Cookie: better-auth.session_token=your-token" \
  -F "file=@/path/to/document.pdf" \
  -F "name=Requirements Doc"
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "attach_xyz789",
    "name": "Requirements Doc",
    "url": "/uploads/board_abc123/card_1/requirements-1705777200.pdf",
    "type": "application/pdf",
    "size": 245760,
    "cardId": "card_1",
    "createdAt": "2024-01-20T19:30:00Z"
  }
}
```

---

## Checklists

### Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/boards/[id]/columns/[colId]/cards/[cardId]/checklists` | List checklists | Yes |
| POST | `/api/boards/[id]/columns/[colId]/cards/[cardId]/checklists` | Create checklist | Yes |
| GET | `/api/boards/[id]/columns/[colId]/cards/[cardId]/checklists/[checklistId]` | Get checklist | Yes |
| PUT | `/api/boards/[id]/columns/[colId]/cards/[cardId]/checklists/[checklistId]` | Update checklist | Yes |
| DELETE | `/api/boards/[id]/columns/[colId]/cards/[cardId]/checklists/[checklistId]` | Delete checklist | Yes |
| POST | `/api/boards/[id]/columns/[colId]/cards/[cardId]/checklists/[checklistId]/items` | Add checklist item | Yes |
| PUT | `/api/boards/[id]/columns/[colId]/cards/[cardId]/checklists/[checklistId]/items/[itemId]` | Update item | Yes |
| DELETE | `/api/boards/[id]/columns/[colId]/cards/[cardId]/checklists/[checklistId]/items/[itemId]` | Delete item | Yes |

---

### POST /api/boards/[id]/columns/[colId]/cards/[cardId]/checklists

Create a checklist on a card.

**Request Body:**
```json
{
  "title": "To-Do List",
  "items": [
    { "text": "First item", "isChecked": false },
    { "text": "Second item", "isChecked": false }
  ]
}
```

**Request:**
```bash
curl -X POST "http://localhost:3000/api/boards/board_abc123/columns/col_todo/cards/card_1/checklists" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "title": "To-Do List",
    "items": [
      { "text": "Set up project", "isChecked": true },
      { "text": "Configure database", "isChecked": false }
    ]
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "checklist_def456",
    "title": "To-Do List",
    "cardId": "card_1",
    "position": 0,
    "items": [
      {
        "id": "item_1",
        "text": "Set up project",
        "isChecked": true,
        "position": 0
      },
      {
        "id": "item_2",
        "text": "Configure database",
        "isChecked": false,
        "position": 1
      }
    ],
    "progress": {
      "total": 2,
      "checked": 1,
      "percentage": 50
    }
  }
}
```

---

## Search

### GET /api/search

Search across all boards.

**Query Parameters:**
- `q`: Search query (required)
- `type` (optional): Filter by type - "cards", "boards", "all" (default: "all")
- `boardId` (optional): Limit search to specific board
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Request:**
```bash
curl -X GET "http://localhost:3000/api/search?q=authentication&type=cards&limit=10" \
  -H "Cookie: better-auth.session_token=your-token"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "card",
        "boardId": "board_abc123",
        "boardName": "Project Alpha",
        "columnId": "col_todo",
        "columnName": "To Do",
        "card": {
          "id": "card_1",
          "title": "Implement authentication",
          "description": "Add user login and registration",
          "labels": [
            {
              "text": "Backend",
              "color": "#3b82f6"
            }
          ],
          "dueDate": "2024-02-15T00:00:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    },
    "meta": {
      "query": "authentication",
      "type": "cards"
    }
  }
}
```

---

## Users

### GET /api/users/[id]

Get user profile information.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/users/user_xyz789" \
  -H "Cookie: better-auth.session_token=your-token"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_xyz789",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://gravatar.com/avatar/abc123",
    "createdAt": "2024-01-01T00:00:00Z",
    "_count": {
      "ownedBoards": 5,
      "memberBoards": 12
    }
  }
}
```

---

## Error Responses

All errors return a consistent format:

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in to perform this action"
  }
}
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Board not found"
  }
}
```

**Response (400 Validation Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "title": ["Title is required"],
      "dueDate": ["Invalid date format"]
    }
  }
}
```

**Response (500 Internal Error):**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

| Endpoint Type | Limit |
|--------------|-------|
| General API | 100 requests/minute |
| Auth endpoints | 10 requests/minute |
| Upload endpoints | 5 requests/minute |

---

*API reference documentation for Trello Clone backend*
