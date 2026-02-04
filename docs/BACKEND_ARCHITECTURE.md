# Backend Architecture Documentation

## Overview

This document describes the planned backend architecture for the Trello Clone application. The application is built as a full-stack solution using **Next.js 15** with the App Router, providing both frontend UI and backend API capabilities.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │   │
│  │  │  React   │  │  shadcn  │  │  Tailwind │  │  DND Kit   │  │   │
│  │  │ 19.x    │  │  UI     │  │  CSS     │  │ (@hello-   │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  │  pangea)   │  │   │
│  │                                          └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (REST API)
┌────────────────────────────┴──────────────────────────────────────┐
│                        API Layer (Next.js Route Handlers)           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  /api/                                                   │   │
│  │  ├── /auth/[...nextauth]  → Authentication endpoints     │   │
│  │  ├── /boards              → Board CRUD operations         │   │
│  │  ├── /columns             → Column CRUD operations        │   │
│  │  ├── /cards               → Card CRUD operations          │   │
│  │  ├── /labels              → Label management              │   │
│  │  ├── /attachments         → File upload/management        │   │
│  │  ├── /comments             → Comment operations           │   │
│  │  └── /checklists           → Checklist operations         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬──────────────────────────────────────┘
                           │
┌────────────────────────────┴──────────────────────────────────────┐
│                        Data Layer                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Prisma ORM                               │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │                   SQLite Database                   │   │   │
│  │  │  (PostgreSQL/MySQL for production)                 │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬──────────────────────────────────────┘
                           │
┌────────────────────────────┴──────────────────────────────────────┐
│                     Authentication Layer                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   BetterAuth                                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │
│  │  │   JWT       │  │  Session    │  │  OAuth Providers   │ │   │
│  │  │  Tokens    │  │  Management │  │  (Google, GitHub)  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Entity Relationship Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Users                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ id: String (PK)            email: String (unique)                      │
│ name: String               image: String?                               │
│ emailVerified: DateTime?   createdAt: DateTime                         │
│ updatedAt: DateTime        accounts: Account[]                          │
│ sessions: Session[]        boards: Board[]  ←──┐                       │
│ activities: Activity[]                    │       │                     │
└───────────────────────────────────────────┼───────┼─────────────────────┘
                                            │       │
                    ┌───────────────────────┘       │
                    │                               │
                    ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Boards                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ id: String (PK)            name: String                                │
│ description: String?       ownerId: String (FK → User.id)              │
│ isPublic: Boolean          createdAt: DateTime                         │
│ updatedAt: DateTime        columns: Column[]                            │
│                        cards: Card[]                                    │
│                        activities: Activity[]                          │
│                        members: BoardMember[]  ←──┐                    │
└─────────────────────────────────────────────────┼────┴────────────────────┘
                                                  │
                    ┌─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BoardMembers                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ id: String (PK)            role: Enum (OWNER, ADMIN, MEMBER, VIEWER)   │
│ boardId: String (FK → Board.id)   userId: String (FK → User.id)       │
│ addedAt: DateTime          permissions: Json?                           │
└─────────────────────────────────────────────────────────────────────────┘
                                                  │
                    ┌─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             Columns                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ id: String (PK)            title: String                               │
│ boardId: String (FK → Board.id)   position: Int                         │
│ color: String?             createdAt: DateTime                         │
│ updatedAt: DateTime        cards: Card[]                                │
│ archivedCards: Card[]                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                                  │
                    ┌─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Cards                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ id: String (PK)            title: String                               │
│ description: String?       columnId: String (FK → Column.id)           │
│ position: Int              dueDate: DateTime?                            │
│ color: String?             isArchived: Boolean                          │
│ createdAt: DateTime        updatedAt: DateTime                         │
│ assigneeId: String? (FK → User.id)    createdById: String (FK → User) │
│ labels: CardLabel[]        attachments: Attachment[]                   │
│ checklists: Checklist[]    comments: Comment[]                          │
│ activities: Activity[]                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                                  │
                    ┌─────────────────────────────┐
                    │                             │
                    ▼                             ▼
┌──────────────────────────────┐  ┌──────────────────────────────────────┐
│        CardLabels             │  │           Attachments                │
├──────────────────────────────┤  ├──────────────────────────────────────┤
│ id: String (PK)              │  │ id: String (PK)                      │
│ cardId: String (FK → Card)  │  │ cardId: String (FK → Card)           │
│ text: String                │  │ name: String                         │
│ color: String               │  │ url: String                          │
│ createdAt: DateTime         │  │ type: String                         │
└──────────────────────────────┘  │ size: Int?                           │
                                 │ createdAt: DateTime                  │
                                 └──────────────────────────────────────┘
                                                  │
                    ┌─────────────────────────────┐
                    │                             │
                    ▼                             ▼
┌──────────────────────────────┐  ┌──────────────────────────────────────┐
│         Checklists            │  │            Comments                  │
├──────────────────────────────┤  ├──────────────────────────────────────┤
│ id: String (PK)              │  │ id: String (PK)                      │
│ cardId: String (FK → Card)  │  │ cardId: String (FK → Card)           │
│ title: String               │  │ authorId: String (FK → User.id)       │
│ position: Int               │  │ text: String                          │
│ items: ChecklistItem[]      │  │ createdAt: DateTime                  │
└──────────────────────────────┘  │ updatedAt: DateTime                  │
                                 └──────────────────────────────────────┘
                                                  │
                    ┌─────────────────────────────┐
                    │                             │
                    ▼                             ▼
┌──────────────────────────────┐  ┌──────────────────────────────────────┐
│       ChecklistItems          │  │            Activities                │
├──────────────────────────────┤  ├──────────────────────────────────────┤
│ id: String (PK)              │  │ id: String (PK)                      │
│ checklistId: String (FK)     │  │ type: Enum (15+ activity types)     │
│ text: String                │  │ cardId: String (FK → Card)           │
│ isChecked: Boolean           │  │ userId: String (FK → User.id)       │
│ position: Int               │  │ boardId: String (FK → Board)        │
│                             │  │ description: String?                │
│                             │  │ metadata: Json?                      │
│                             │  │ createdAt: DateTime                  │
└──────────────────────────────┘  └──────────────────────────────────────┘
```

---

## API Routes Structure

### Route Hierarchy

```
/api
├── /auth
│   └── /[...auth]           → BetterAuth endpoints
├── /boards
│   ├── GET                   → List all boards for user
│   ├── POST                  → Create new board
│   ├── /[id]                 → Board-specific operations
│   │   ├── GET               → Get single board
│   │   ├── PUT              → Update board
│   │   ├── DELETE            → Delete board
│   │   ├── /columns          → Column operations
│   │   │   ├── GET           → List columns
│   │   │   ├── POST         → Create column
│   │   │   └── /[colId]      → Column operations
│   │   │       ├── GET       → Get column
│   │   │       ├── PUT      → Update column
│   │   │       ├── DELETE   → Delete column
│   │   │       └── /cards    → Card operations
│   │   │           ├── GET   → List cards
│   │   │           ├── POST → Create card
│   │   │           └── /[cardId]
│   │   │               ├── GET       → Get card
│   │   │               ├── PUT      → Update card
│   │   │               ├── DELETE   → Delete card
│   │   │               ├── /labels  → Label operations
│   │   │               │   ├── GET  → List labels
│   │   │               │   ├── POST → Add label
│   │   │               │   └── /[labelId]
│   │   │               │       ├── DELETE → Remove label
│   │   │               ├── /attachments → Attachment operations
│   │   │               │   ├── POST → Upload attachment
│   │   │               │   └── /[attachId]
│   │   │               │       ├── GET       → Get attachment
│   │   │               │       ├── DELETE   → Delete attachment
│   │   │               ├── /comments → Comment operations
│   │   │               │   ├── GET   → List comments
│   │   │               │   ├── POST → Add comment
│   │   │               │   └── /[commentId]
│   │   │               │       ├── PUT      → Update comment
│   │   │               │       └── DELETE   → Delete comment
│   │   │               └── /checklists → Checklist operations
│   │   │                   ├── GET   → List checklists
│   │   │                   ├── POST → Create checklist
│   │   │                   └── /[checklistId]
│   │   │                       ├── GET       → Get checklist
│   │   │                       ├── PUT      → Update checklist
│   │   │                       ├── DELETE   → Delete checklist
│   │   │                       └── /items    → Item operations
│   │   │                           ├── POST → Add item
│   │   │                           └── /[itemId]
│   │   │                               ├── PUT      → Update item
│   │   │                               └── DELETE   → Delete item
│   │   ├── /members                 → Board member operations
│   │   │   ├── GET                 → List members
│   │   │   ├── POST                → Add member
│   │   │   └── /[userId]           → Member operations
│   │   │       ├── PUT            → Update role
│   │   │       └── DELETE         → Remove member
│   │   └── /activities             → Activity log operations
│   │       ├── GET                 → Get activities
│   │       └── POST                → Create activity (internal)
│   └── /[id]/duplicate             → Duplicate board
│
├── /search                         → Search across boards
│   └── GET                         → Search cards/boards
│
└── /users
    └── /[id]                       → User profile operations
        ├── GET                     → Get user profile
        └── PUT                     → Update profile
```

---

## Authentication Flow

### BetterAuth Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Authentication Flow                            │
└─────────────────────────────────────────────────────────────────────────┘

1. User Registration / Sign Up
   ┌─────────────┐
   │   Client    │
   └──────┬──────┘
          │
          ▼ POST /api/auth/sign-up
          │
          ▼
   ┌─────────────┐
   │  BetterAuth │
   │  Handler    │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐     ┌─────────────┐
   │  Validate   │────▶│   Create     │
   │  Input      │     │   User       │
   └──────┬──────┘     └──────┬──────┘
          │                   │
          │                   ▼
          │           ┌─────────────┐
          │           │  Generate    │
          │           │  Session     │
          │           └──────┬──────┘
          │                  │
          │                  ▼
          │           ┌─────────────┐
          │           │  Return      │
          │           │  Session     │
          │           │  Token       │
          └───────────└─────────────┘
                      │
                      ▼
              Set Session Cookie
              (httpOnly, secure)

2. User Login
   ┌─────────────┐
   │   Client    │
   └──────┬──────┘
          │
          ▼ POST /api/auth/sign-in
          │
          ▼
   ┌─────────────┐
   │  BetterAuth │
   │  Handler    │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐     ┌─────────────┐
   │  Validate   │────▶│  Verify      │
   │  Credentials│     │  Password    │
   └──────┬──────┘     └──────┬──────┘
          │                   │
          │          ┌────────┴────────┐
          │          │                 │
          ▼          ▼                 ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │   Invalid   │ │   Success   │ │   OAuth     │
   │              │ │              │ │   Flow      │
   └─────────────┘ └──────┬──────┘ └─────────────┘
                          │
                          ▼
                  ┌─────────────┐
                  │  Generate    │
                  │  Session     │
                  └──────┬──────┘
                         │
                         ▼
                 Set Session Cookie

3. Protected Request Flow
   ┌─────────────┐
   │   Client    │
   └──────┬──────┘
          │
          ▼ (with session cookie)
          │
          ▼
   ┌─────────────┐
   │   Next.js   │
   │   Route     │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐     ┌─────────────┐
   │  Extract    │────▶│  Validate   │
   │  Session    │     │  Session    │
   │  Cookie     │     │  Token      │
   └──────┬──────┘     └──────┬──────┘
          │                   │
          │          ┌────────┴────────┐
          │          │                 │
          ▼          ▼                 ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │  Continue   │ │  401 Error  │ │  403 Error  │
   │  Handler    │ │             │ │             │
   └─────────────┘ └─────────────┘ └─────────────┘
```

### Session Management

- **Session Cookie**: `better-auth.session_token`
- **Cookie Attributes**:
  - `httpOnly`: true (prevents XSS)
  - `secure`: true (HTTPS only in production)
  - `sameSite`: "lax" (CSRF protection)
  - `maxAge`: 7 days (configurable)

### OAuth Providers

Supported OAuth providers:
- **Google**: `https://accounts.google.com`
- **GitHub**: `https://github.com/login/oauth`
- **More providers available via BetterAuth plugins**

---

## Key Files and Their Purposes

### Prisma Schema (`prisma/schema.prisma`)

```prisma
// Main database schema definition
// Contains all models: User, Board, Column, Card, etc.
// Migrations are applied from this file
```

### Database Client (`src/lib/db.ts`)

```typescript
// Prisma client singleton instance
// Exports typed database client for use in API routes
// Handles connection pooling
```

### Authentication (`src/lib/auth.ts`)

```typescript
// BetterAuth configuration
// Exports auth instance with configured providers
// Session management utilities
```

### API Routes

| File | Purpose |
|------|---------|
| `src/app/api/auth/[...auth]/route.ts` | BetterAuth handler for all auth endpoints |
| `src/app/api/boards/route.ts` | Board CRUD endpoints |
| `src/app/api/boards/[id]/route.ts` | Single board operations |
| `src/app/api/boards/[id]/columns/route.ts` | Column management |
| `src/app/api/boards/[id]/cards/route.ts` | Card management |
| `src/app/api/search/route.ts` | Global search functionality |

### Middleware (`src/middleware.ts`)

```typescript
// Next.js middleware for authentication
// Protects routes based on session
// Handles redirects for unauthenticated users
```

### Types (`src/types/index.ts`)

```typescript
// TypeScript type definitions
// Frontend types matching backend schemas
// API response types
```

---

## Data Flow Examples

### Creating a Card

```
1. Client sends POST /api/boards/[boardId]/columns/[columnId]/cards
   with body: { title, description, etc. }

2. Middleware validates session cookie

3. API handler:
   a. Validates request body
   b. Checks board/column existence
   c. Verifies user has permission
   d. Creates card via Prisma
   e. Creates activity log entry
   f. Returns created card

4. Client updates UI optimistically
```

### Moving a Card Between Columns

```
1. Client sends PUT /api/boards/[boardId]/columns/[fromColId]/cards/[cardId]
   with body: { columnId: "newColumnId", position: 5 }

2. Middleware validates session

3. API handler:
   a. Verifies card and columns exist
   b. Updates card position
   c. Reorders remaining cards
   d. Creates activity log
   e. Returns updated card

4. WebSocket broadcasts update to other clients
```

---

## Error Handling

All API errors follow a consistent format:

```typescript
interface APIError {
  success: false;
  error: {
    code: string;        // e.g., "UNAUTHORIZED", "NOT_FOUND"
    message: string;     // Human-readable message
    details?: unknown;   // Additional error details
  };
}

interface APISuccess<T> {
  success: true;
  data: T;
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"  # SQLite for dev, postgres://... for prod

# Authentication
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Performance Considerations

1. **Prisma Middleware** for soft deletes and auditing
2. **Pagination** for list endpoints (limit/offset)
3. **Optimistic Updates** on client side
4. **WebSockets** for real-time collaboration
5. **CDN** for static assets
6. **Database Indexing** on frequently queried fields

---

## Security Measures

1. **CSRF Protection** via SameSite cookies
2. **XSS Prevention** via httpOnly cookies
3. **Input Validation** using Zod schemas
4. **Rate Limiting** on sensitive endpoints
5. **Permission Checks** on all resource operations
6. **HTTPS** enforced in production
7. **Audit Logging** for sensitive actions

---

*Document generated for Trello Clone backend architecture documentation*
