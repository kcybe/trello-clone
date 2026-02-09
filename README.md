# Trello Clone

A simple Kanban board for task management built with Next.js, shadcn/ui, and Tailwind CSS.

## Features

### Core Features
- 📋 Create, edit, and delete cards
- 📁 Create, edit, and delete columns
- 🎯 Drag and drop cards between columns
- 💾 Local storage persistence
- 🎨 Clean, modern UI with shadcn/ui components

### Enhanced Features ✨
- 🏷️ **Labels/Tags** - Add colorful labels to categorize cards
- 📅 **Due Dates** - Set and track due dates on cards with overdue indicators
- 🔍 **Search** - Filter cards by title, description, or labels
- 🌙 **Dark Mode** - Toggle between light and dark themes
- ⌨️ **Keyboard Shortcuts** - Work faster with keyboard shortcuts
- 💬 **Comments** - Add, edit, and delete comments on cards
- 📊 **Activity Feed** - Track all changes to cards and boards

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Drag & Drop:** @hello-pangea/dnd
- **Icons:** lucide-react
- **Language:** TypeScript
- **Database:** SQLite with Prisma ORM
- **Authentication:** Better Auth

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
trello-clone/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── comments/       # Comments API routes
│   │   │   ├── activities/    # Activity feed API routes
│   │   │   └── ...
│   │   ├── globals.css         # Global styles with Tailwind
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx          # Kanban board page
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── ActivityLog/      # Activity feed component
│   │   └── CommentsThread/   # Comments thread component
│   ├── features/
│   │   ├── board/
│   │   │   ├── components/   # Board-specific components
│   │   │   ├── hooks/        # Board-specific hooks
│   │   │   └── types/        # Board-specific types
│   │   └── ...
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── index.ts          # TypeScript types
├── prisma/
│   └── schema.prisma        # Database schema
├── tests/
│   └── features/            # Feature tests
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## API Routes

### Comments API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments` | List all comments (with filters) |
| POST | `/api/comments` | Create a new comment |
| GET | `/api/comments/[id]` | Get a single comment |
| PUT | `/api/comments/[id]` | Update a comment |
| DELETE | `/api/comments/[id]` | Delete a comment |
| GET | `/api/cards/[id]/comments` | Get comments for a card |

### Activities API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activities` | List all activities (with filters) |
| POST | `/api/activities` | Create a new activity |
| GET | `/api/activities/[id]` | Get a single activity |
| PUT | `/api/activities/[id]` | Update an activity (admin) |
| DELETE | `/api/activities/[id]` | Delete an activity (admin) |

## Usage

### Basic
- **Add a card:** Click "Add card" on any column
- **Edit a card:** Click the pencil icon on a card
- **Delete a card:** Click the X icon on a card
- **Move a card:** Drag and drop cards between columns
- **Add a column:** Click "Add column" at the right
- **Delete a column:** Click the trash icon on the column header

### Enhanced Features

#### Labels/Tags
1. Click the pencil icon on any card
2. In the label section, type a label name and press Enter
3. Click a color to add it to your label
4. Click the X on a label to remove it

#### Due Dates
1. Click the pencil icon on any card
2. In the Due Date section, pick a date
3. Cards with due dates show a calendar icon
4. Overdue cards show dates in red

#### Search
1. Use the search bar in the header
2. Search by card title, description, or labels
3. Click X or press Escape to clear search

#### Comments 💬
1. Open a card by clicking on it
2. Scroll to the Comments section
3. Type your comment and press Enter or click "Post Comment"
4. Edit or delete your comments using the menu (⋮) button
5. Comments are visible to all board members

**Keyboard shortcuts in comments:**
- **Enter:** Submit comment
- **Shift+Enter:** New line

#### Activity Feed 📊
1. Open a card by clicking on it
2. View the Activity section to see all changes
3. Activity includes:
   - Card created/moved/edited/archived
   - Comments added/edited/deleted
   - Labels added
   - Members assigned
   - Due dates set/changed

Each activity shows:
- User who performed the action
- Type of action with icon
- Timestamp (relative, e.g., "2h ago")
- Additional details (e.g., column moves)

#### Dark Mode
1. Click the moon/sun icon in the header
2. Your preference is saved automatically

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `n` | Open "Add card" dialog |
| `f` | Focus search bar |
| `/` | Focus search bar (when not in input) |
| `Esc` | Close any dialog |
| `?` | Show all shortcuts |

## Activity Types

The following activity types are tracked:

| Type | Description |
|------|-------------|
| `card_created` | Card was created |
| `card_moved` | Card was moved between columns |
| `card_edited` | Card details were updated |
| `card_archived` | Card was archived |
| `card_restored` | Card was restored from archive |
| `card_deleted` | Card was permanently deleted |
| `card_duplicated` | Card was duplicated |
| `comment_added` | A comment was added |
| `comment_updated` | A comment was edited |
| `comment_deleted` | A comment was removed |
| `due_date_set` | Due date was set |
| `due_date_changed` | Due date was modified |
| `label_added` | A label was added |
| `member_assigned` | A member was assigned |

## Testing

Run tests:
```bash
npm run test
```

Run specific test files:
```bash
npm run test -- tests/features/board/useComments.test.ts
npm run test -- tests/features/board/useActivities.test.ts
```

## Data Persistence

All data is stored in SQLite database with Prisma ORM. Board data, comments, and activities are persisted in the database.

---

Built by the Builder Team 🚀
