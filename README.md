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

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Drag & Drop:** @hello-pangea/dnd
- **Icons:** lucide-react
- **Language:** TypeScript

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
│   │   ├── globals.css      # Global styles with Tailwind
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Kanban board page
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── input.tsx
│   ├── lib/
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── index.ts         # TypeScript types
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

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

## Data Persistence

All data is stored in your browser's local storage. Your board will persist across page refreshes.

---

Built by the Builder Team 🚀
