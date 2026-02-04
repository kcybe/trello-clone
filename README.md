# Trello Clone

A simple Kanban board for task management built with Next.js, shadcn/ui, and Tailwind CSS.

## Features

- 📋 Create, edit, and delete cards
- 📁 Create, edit, and delete columns
-  Drag and drop cards between columns
- 💾 Local storage persistence
- 🎨 Clean, modern UI with shadcn/ui components

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

- **Add a card:** Click "Add card" on any column
- **Edit a card:** Click the pencil icon on a card
- **Delete a card:** Click the X icon on a card
- **Move a card:** Drag and drop cards between columns
- **Add a column:** Click "Add column" at the right
- **Delete a column:** Click the trash icon on a column header

## Data Persistence

All data is stored in your browser's local storage. Your board will persist across page refreshes.

---

Built by the Builder Team 🚀
