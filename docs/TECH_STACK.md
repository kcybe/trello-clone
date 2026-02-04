# Technology Stack

This document describes the technologies and libraries used in the Trello Clone project.

## Core Technologies

### Next.js 15

Next.js 15 is the primary React framework powering the application.

**Key Features Used:**

| Feature | Description | Usage |
|---------|-------------|-------|
| **App Router** | Modern file-based routing with `app/` directory | All pages and API routes use App Router |
| **Server Components** | React components that render on the server | Layouts, pages, data fetching |
| **Server Actions** | Direct function calls from client to server | Form submissions, mutations |
| **Route Handlers** | API endpoints using Web-standard Request/Response | `/api/*` endpoints |
| **Middleware** | Edge functions for request preprocessing | Authentication, redirects |
| **Streaming** | Progressive rendering of components | Loading states, Suspense |
| **Server-Side Rendering (SSR)** | Initial page renders on server | SEO, performance |
| **Incremental Static Regeneration (ISR)** | Static pages with periodic regeneration | Dashboard pages |

**Directory Structure:**
```
src/
├── app/
│   ├── page.tsx              # Home page (Kanban board)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/                  # API routes
│       └── auth/             # Authentication endpoints
├── components/              # React components
├── lib/                      # Utility libraries
└── types/                    # TypeScript definitions
```

**Example - Route Handler:**
```typescript
// src/app/api/boards/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const boards = await db.board.findMany({
    where: { members: { some: { userId: session.user.id } } }
  });
  
  return NextResponse.json({ boards });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const body = await request.json();
  const board = await db.board.create({
    data: {
      name: body.name,
      ownerId: session.user.id,
    }
  });
  
  return NextResponse.json({ board }, { status: 201 });
}
```

---

### TypeScript 5.x

TypeScript provides static typing for improved developer experience and code quality.

**Key Features Used:**
- **Generic Types**: Reusable data structures
- **Type Inference**: Automatic type detection
- **Strict Mode**: Enhanced type safety
- **Module System**: ES modules with path aliases
- **JSON Imports**: Direct JSON file imports

**Path Alias Configuration (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Database

### Prisma ORM

Prisma is a modern ORM for TypeScript and JavaScript.

**Why Prisma:**
- Type-safe database access
- Auto-generated migrations
- Intuitive data modeling
- Excellent developer experience
- Works with SQLite, PostgreSQL, MySQL

**Schema Definition Example:**
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Change to "postgresql" for production
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  boards        Board[]
  cards         Card[]
  comments      Comment[]
  activities    Activity[]
}

model Board {
  id          String   @id @default(cuid())
  name        String
  description String?
  isPublic    Boolean  @default(false)
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  owner       User     @relation(fields: [ownerId], references: [id])
  columns     Column[]
  members     BoardMember[]
  activities  Activity[]
}

model Column {
  id        String   @id @default(cuid())
  title     String
  position  Int
  color     String?
  boardId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards     Card[]
}

model Card {
  id          String    @id @default(cuid())
  title       String
  description String?
  position    Int
  color       String?
  dueDate     DateTime?
  isArchived  Boolean   @default(false)
  columnId    String
  boardId     String
  assigneeId  String?
  createdById String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  column      Column    @relation(fields: [columnId], references: [id], onDelete: Cascade)
  board       Board     @relation(fields: [boardId], references: [id], onDelete: Cascade)
  assignee    User?     @relation(fields: [assigneeId], references: [id])
  createdBy   User      @relation(fields: [createdById], references: [id])
  labels      CardLabel[]
  attachments Attachment[]
  checklists  Checklist[]
  comments    Comment[]
  activities  Activity[]
}

model CardLabel {
  id        String   @id @default(cuid())
  text      String
  color     String
  cardId    String
  createdAt DateTime @default(now())
  
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
}

model Attachment {
  id        String   @id @default(cuid())
  name      String
  url       String
  type      String
  size      Int?
  cardId    String
  createdAt DateTime @default(now())
  
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
}

model Checklist {
  id        String   @id @default(cuid())
  title     String
  position  Int
  cardId    String
  createdAt DateTime @default(now())
  
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  items     ChecklistItem[]
}

model ChecklistItem {
  id          String   @id @default(cuid())
  text        String
  isChecked   Boolean  @default(false)
  position    Int
  checklistId String
  
  checklist   Checklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)
}

model Comment {
  id        String   @id @default(cuid())
  text      String
  cardId    String
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])
}

model Activity {
  id          String   @id @default(cuid())
  type        String
  description String?
  metadata    String?  // JSON string for additional data
  cardId      String
  boardId     String
  userId      String
  createdAt   DateTime @default(now())
  
  card        Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  board       Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])
}

model BoardMember {
  id        String   @id @default(cuid())
  role      String   @default("MEMBER")  // OWNER, ADMIN, MEMBER, VIEWER
  boardId   String
  userId    String
  addedAt   DateTime @default(now())
  
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  
  @@unique([boardId, userId])
}

// BetterAuth models
model Account {
  id                String  @id @default(cuid())
  userId            String
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  accessTokenExpiresAt DateTime?
  refreshTokenExpiresAt DateTime?
  password          String?
  scope             String?
  idToken           String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([providerId, accountId])
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([token])
}
```

**Prisma Client Usage:**
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

**Common Prisma Operations:**
```typescript
// Create
const card = await db.card.create({
  data: {
    title: 'New Card',
    columnId: 'col_123',
    boardId: 'board_456',
    createdById: 'user_789',
  },
});

// Read with relations
const board = await db.board.findUnique({
  where: { id: 'board_123' },
  include: {
    columns: {
      include: {
        cards: {
          include: {
            labels: true,
            assignee: true,
          },
        },
      },
    },
  },
});

// Update
await db.card.update({
  where: { id: 'card_123' },
  data: {
    title: 'Updated Title',
    position: 0,
  },
});

// Delete
await db.card.delete({
  where: { id: 'card_123' },
});

// List with pagination
const cards = await db.card.findMany({
  where: { columnId: 'col_123' },
  orderBy: { position: 'asc' },
  skip: 0,
  take: 20,
});
```

---

## Authentication

### BetterAuth

BetterAuth is a modern authentication framework for TypeScript.

**Features:**
- Session-based authentication
- OAuth providers (Google, GitHub, etc.)
- Email/password authentication
- Two-factor authentication (2FA)
- Account linking
- Password reset
- Email verification

**Configuration:**
```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "sqlite",  // or "postgresql", "mysql"
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 24,       // 1 day
  },
  cookies: {
    secure: process.env.NODE_ENV === "production",
  },
  advanced: {
    cookiePrefix: "trello-clone",
  },
});
```

**Auth API Routes:**
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { auth } from "@/lib/auth";
import { fetchRequestHandler } from "@better-auth/fetch";

export const GET = (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/auth",
    req: request,
    auth,
  });
};

export const POST = (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/auth",
    req: request,
    auth,
  });
};
```

**Using Authentication in Components:**
```typescript
// Using server actions
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

async function createBoard(formData: FormData) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  const name = formData.get("name") as string;
  // Create board logic...
}

// Using auth in API routes
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: session.user });
}
```

---

## Styling

### Tailwind CSS

Tailwind CSS provides utility-first styling for rapid UI development.

**Configuration (`tailwind.config.ts`):**
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

**Utility Function:**
```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Example Usage:**
```tsx
// Button component
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
          "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
          "border border-input bg-background hover:bg-accent": variant === "outline",
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "h-10 px-4 py-2": size === "default",
          "h-9 rounded-md px-3": size === "sm",
          "h-11 rounded-md px-8": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
```

---

### shadcn/ui Components

shadcn/ui provides beautifully designed components built with Radix UI primitives and Tailwind CSS.

**Available Components:**

| Component | Description | Usage |
|-----------|-------------|-------|
| `Button` | Interactive button with variants | `<Button>Click me</Button>` |
| `Input` | Text input field | `<Input placeholder="Enter text" />` |
| `Card` | Container for grouped content | Card, CardHeader, CardContent |
| `Dialog` | Modal dialog | `<Dialog><DialogTrigger>Open</DialogTrigger>...</Dialog>` |
| `DropdownMenu` | Menu with nested items | `<DropdownMenu><DropdownMenuItem>Action</DropdownMenuItem></DropdownMenu>` |
| `Select` | Select dropdown | `<Select><SelectItem>Option</SelectItem></Select>` |
| `Tabs` | Tabbed interface | `<Tabs><TabList><Tab>Tab 1</Tab></TabList>...</Tabs>` |
| `Avatar` | User avatar display | `<Avatar><AvatarImage src="..." /></Avatar>` |
| `Tooltip` | Hover tooltip | `<Tooltip><TooltipTrigger>Hover</TooltipTrigger><TooltipContent>Tip</TooltipContent></Tooltip>` |
| `Separator` | Visual divider | `<Separator />` |
| `Label` | Form label | `<Label htmlFor="input">Label</Label>` |

**Example - Card Component:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KanbanColumn({ title, cards }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {cards.map((card) => (
            <div key={card.id} className="p-3 border rounded-lg bg-card">
              {card.title}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Example - Dialog for Card Edit:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateCardDialog({ columnId, onCreate }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add Card</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Card</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            onCreate({
              title: formData.get("title"),
              description: formData.get("description"),
              columnId,
            });
          }}
        >
          <div className="grid gap-4 py-4">
            <Input
              id="title"
              name="title"
              placeholder="Card title"
              required
            />
            <Input
              id="description"
              name="description"
              placeholder="Description (optional)"
            />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Drag and Drop

### @hello-pangea/dnd

A React DnD library (fork of react-beautiful-dnd) for drag and drop interactions.

**Usage Example:**
```tsx
"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Card {
  id: string;
  title: string;
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export function KanbanBoard({ initialColumns }: { initialColumns: Column[] }) {
  const [columns, setColumns] = useState(initialColumns);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // Moving within same column
    if (source.droppableId === destination.droppableId) {
      const newCards = Array.from(sourceColumn.cards);
      const [removed] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removed);

      setColumns(
        columns.map((col) =>
          col.id === source.droppableId ? { ...col, cards: newCards } : col
        )
      );
    } else {
      // Moving to different column
      const sourceCards = Array.from(sourceColumn.cards);
      const destCards = Array.from(destColumn.cards);
      const [removed] = sourceCards.splice(source.index, 1);
      destCards.splice(destination.index, 0, removed);

      setColumns(
        columns.map((col) => {
          if (col.id === source.droppableId) {
            return { ...col, cards: sourceCards };
          }
          if (col.id === destination.droppableId) {
            return { ...col, cards: destCards };
          }
          return col;
        })
      );
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-80 flex-shrink-0 bg-secondary rounded-lg p-4"
              >
                <h3 className="font-semibold mb-4">{column.title}</h3>
                <div className="space-y-2">
                  {column.cards.map((card, index) => (
                    <Draggable key={card.id} draggableId={card.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-card p-3 rounded shadow-sm border"
                        >
                          {card.title}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
```

---

## Icons

### lucide-react

A beautiful icon set for React.

**Usage:**
```tsx
import { 
  Plus, 
  X, 
  Trash2, 
  Edit2, 
  Calendar, 
  Tag, 
  Search, 
  Moon, 
  Sun,
  MoreHorizontal,
  GripVertical,
  Archive,
  Clock,
  Paperclip,
  MessageCircle,
  CheckSquare,
  User,
} from "lucide-react";

// Basic icon
<Plus className="h-4 w-4" />

// With styles
<Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />

// Spinning icon
<Loader2 className="h-4 w-4 animate-spin" />
```

---

## Additional Libraries

### class-variance-authority (CVA

Manages component variants with TypeScript.

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### react-markdown

Renders Markdown content safely.

```tsx
import ReactMarkdown from "react-markdown";

export function CardDescription({ content }: { content: string }) {
  return (
    <div className="prose prose-sm">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
```

### tailwind-merge

Merges Tailwind CSS classes intelligently.

```tsx
import { twMerge } from "tailwind-merge";

function clsx(...classes: (string | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(" "));
}
```

---

## Development Tools

### TypeScript ESLint

Linting for TypeScript code.

**Configuration:**
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Prettier

Code formatting.

**Configuration:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## Environment Configuration

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-32-character-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Trello Clone"
```

---

## Summary Table

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | Next.js | 15.x | Full-stack React framework |
| Language | TypeScript | 5.x | Type-safe JavaScript |
| Database | SQLite | 3.x | Development database |
| ORM | Prisma | 5.x | Database ORM |
| Auth | BetterAuth | 0.x | Authentication framework |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| UI Components | shadcn/ui | Latest | Component library |
| DnD | @hello-pangea/dnd | 18.x | Drag and drop |
| Icons | lucide-react | 0.x | Icon library |
| Utilities | clsx, tailwind-merge | Latest | Class merging |

---

*Technology stack documentation for Trello Clone*
