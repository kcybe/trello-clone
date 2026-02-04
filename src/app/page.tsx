"use client";

import { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, X, Trash2, Pencil, Calendar, Tag, Search, Moon, Sun, Keyboard, Paperclip, CheckSquare, User, Link2, Trash, MessageCircle, Grid, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Board, Column, Card as CardType, CardLabel, CardAttachment, Checklist, ChecklistItem, Comment } from "@/types";

const STORAGE_KEY = "trello-clone-board";

// Label colors
const LABEL_COLORS = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Purple", value: "bg-purple-500" },
];

// Keyboard shortcuts
const SHORTCUTS = {
  n: "New card",
  f: "Search",
  "/": "Focus search",
 Escape: "Close dialog",
  ArrowUp: "Navigate up",
  ArrowDown: "Navigate down",
};

const initialBoard: Board = {
  columns: [
    {
      id: "todo",
      title: "To Do",
      cards: [
        { 
          id: "c1", 
          title: "Welcome to Trello Clone", 
          description: "Try dragging this card! Use keyboard shortcuts (n, f, /).",
          createdAt: new Date(),
          labels: [{ id: "l1", text: "Welcome", color: "bg-green-500" }],
          assignee: "Demo User",
          attachments: [{ id: "a1", name: "Readme.md", url: "#", type: "document" }],
          checklists: [{ id: "cl1", title: "Getting Started", items: [{ id: "i1", text: "Try dragging cards", checked: true }, { id: "i2", text: "Add new members", checked: false }, { id: "i3", text: "Attach files", checked: false }] }],
          dueDate: new Date(Date.now() + 86400000 * 2),
          comments: [],
        },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      cards: [],
    },
    {
      id: "done",
      title: "Done",
      cards: [],
    },
  ],
};

// Calendar helper functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function getAllCards(boardData: Board | null): CardType[] {
  if (!boardData) return [];
  return boardData.columns.flatMap(col => col.cards);
}

function getCardsByDate(boardData: Board | null): Record<string, CardType[]> {
  const cards = getAllCards(boardData);
  const byDate: Record<string, CardType[]> = {};
  cards.forEach(card => {
    if (card.dueDate) {
      const dateKey = new Date(card.dueDate).toISOString().split("T")[0];
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(card);
    }
  });
  return byDate;
}

function getNoDateCards(boardData: Board | null): CardType[] {
  return getAllCards(boardData).filter(card => !card.dueDate);
}

// Calendar View Component
function CalendarView({ board, onEditCard }: { board: Board; onEditCard: (card: CardType, columnId: string) => void }) {
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const days = [];
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cardsByDate = getCardsByDate(board);
  const noDateCards = getNoDateCards(board);
  
  // Previous month button
  const prevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };
  
  // Next month button  
  const nextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-28 border bg-muted/20" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = new Date(year, month, day).toISOString().split("T")[0];
    const dayCards = cardsByDate[dateKey] || [];
    const isToday = dateKey === new Date().toISOString().split("T")[0];
    
    days.push(
      <div key={day} className={`h-28 border p-1 ${isToday ? "bg-primary/10" : ""}`}>
        <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
          {day}
        </div>
        <div className="space-y-1 overflow-y-auto max-h-20">
          {dayCards.map(card => (
            <button
              key={card.id}
              onClick={() => {
                // Find the column this card belongs to
                const column = board.columns.find(col => col.cards.some(c => c.id === card.id));
                if (column) {
                  onEditCard(card, column.id);
                }
              }}
              className="w-full text-left text-xs p-1 bg-primary/10 hover:bg-primary/20 rounded truncate"
            >
              {card.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {calendarDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <X className="h-4 w-4 rotate-45" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <X className="h-4 w-4 -rotate-45" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border border rounded-lg overflow-hidden">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}
        {/* Calendar days */}
        {days}
      </div>

      {/* No date cards */}
      {noDateCards.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            No Due Date ({noDateCards.length} cards)
          </h3>
          <div className="flex flex-wrap gap-2">
            {noDateCards.map(card => (
              <button
                key={card.id}
                onClick={() => {
                  const column = board.columns.find(col => col.cards.some(c => c.id === card.id));
                  if (column) {
                    onEditCard(card, column.id);
                  }
                }}
                className="px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded text-sm"
              >
                {card.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddCardOpen, setIsAddCardOpen] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "calendar">("board");
  
  // Edit card state
  const [editingCard, setEditingCard] = useState<{
    id: string;
    title: string;
    description: string;
    labels: CardLabel[];
    assignee: string | undefined;
    attachments: CardAttachment[];
    checklists: Checklist[];
    dueDate: string;
    columnId: string;
    comments: Comment[];
  } | null>(null);

  // New label input
  const [newLabelText, setNewLabelText] = useState("");

  // Member input
  const [newMemberName, setNewMemberName] = useState("");
  const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
  const MEMBER_SUGGESTIONS = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];

  // Attachment inputs
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [newAttachmentName, setNewAttachmentName] = useState("");

  // Checklist inputs
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");

  // Comment inputs
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  // Load dark mode preference
  useEffect(() => {
    const savedDark = localStorage.getItem("trello-clone-dark");
    if (savedDark) {
      setIsDark(JSON.parse(savedDark));
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDark(true);
    }
  }, []);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("trello-clone-dark", JSON.stringify(isDark));
  }, [isDark]);

  // Load board from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.columns.forEach((col: Column) => {
          col.cards.forEach((card: CardType) => {
            card.createdAt = new Date(card.createdAt);
            if (card.dueDate) card.dueDate = new Date(card.dueDate);
            // Ensure new fields exist for backward compatibility
            if (!card.assignee) card.assignee = undefined;
            if (!card.attachments) card.attachments = [];
            if (!card.checklists) card.checklists = [];
            if (!card.comments) card.comments = [];
          });
        });
        setBoard(parsed);
      } catch (e) {
        setBoard(initialBoard);
      }
    } else {
      setBoard(initialBoard);
    }
    setIsLoaded(true);
  }, []);

  // Save board to local storage
  useEffect(() => {
    if (isLoaded && board) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    }
  }, [board, isLoaded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "/" && !e.target.value) {
          e.preventDefault();
          document.getElementById("search-input")?.focus();
        }
        return;
      }

      if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Open first add card dialog
        setIsAddCardOpen(board?.columns[0]?.id || null);
      }
      if (e.key === "f" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [board]);

  // Filter cards based on search
  const filteredBoard = useMemo(() => {
    if (!board || !searchQuery.trim()) return board;
    
    const query = searchQuery.toLowerCase();
    return {
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        cards: col.cards.filter(card => 
          card.title.toLowerCase().includes(query) ||
          card.description?.toLowerCase().includes(query) ||
          card.labels?.some(l => l.text.toLowerCase().includes(query))
        )
      }))
    };
  }, [board, searchQuery]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || !board) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = board.columns.find((col) => col.id === source.droppableId);
    const destColumn = board.columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    if (source.droppableId === destination.droppableId) {
      const newCards = Array.from(sourceColumn.cards);
      const [removed] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removed);

      setBoard({
        ...board,
        columns: board.columns.map((col) =>
          col.id === source.droppableId ? { ...col, cards: newCards } : col
        ),
      });
    } else {
      const sourceCards = Array.from(sourceColumn.cards);
      const destCards = Array.from(destColumn.cards);
      const [removed] = sourceCards.splice(source.index, 1);
      destCards.splice(destination.index, 0, removed);

      setBoard({
        ...board,
        columns: board.columns.map((col) =>
          col.id === source.droppableId
            ? { ...col, cards: sourceCards }
            : col.id === destination.droppableId
            ? { ...col, cards: destCards }
            : col
        ),
      });
    }
  };

  const addCard = (columnId: string) => {
    if (!newCardTitle.trim() || !board) return;

    const newCard: CardType = {
      id: `card-${Date.now()}`,
      title: newCardTitle.trim(),
      createdAt: new Date(),
      labels: [],
      assignee: undefined,
      attachments: [],
      checklists: [],
      dueDate: null,
      comments: [],
    };

    setBoard({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col
      ),
    });

    setNewCardTitle("");
    setIsAddCardOpen(null);
  };

  const deleteCard = (columnId: string, cardId: string) => {
    if (!board) return;

    setBoard({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) }
          : col
      ),
    });
  };

  const addColumn = () => {
    if (!newColumnTitle.trim() || !board) return;

    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title: newColumnTitle.trim(),
      cards: [],
    };

    setBoard({
      ...board,
      columns: [...board.columns, newColumn],
    });

    setNewColumnTitle("");
  };

  const deleteColumn = (columnId: string) => {
    if (!board) return;

    setBoard({
      ...board,
      columns: board.columns.filter((col) => col.id !== columnId),
    });
  };

  const updateCard = () => {
    if (!editingCard || !board) return;

    setBoard({
      ...board,
      columns: board.columns.map((col) =>
        col.id === editingCard.columnId
          ? {
              ...col,
              cards: col.cards.map((card) =>
                card.id === editingCard.id
                  ? { 
                      ...card, 
                      title: editingCard.title, 
                      description: editingCard.description,
                      labels: editingCard.labels,
                      assignee: editingCard.assignee || undefined,
                      attachments: editingCard.attachments,
                      checklists: editingCard.checklists,
                      dueDate: editingCard.dueDate ? new Date(editingCard.dueDate) : null,
                      comments: editingCard.comments
                    }
                  : card
              ),
            }
          : col
      ),
    });

    setEditingCard(null);
  };

  // Comment functions
  const addComment = () => {
    if (!newCommentText.trim() || !newCommentAuthor.trim() || !editingCard) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: newCommentAuthor.trim(),
      text: newCommentText.trim(),
      createdAt: new Date(),
    };
    setEditingCard({
      ...editingCard,
      comments: [...(editingCard.comments || []), newComment],
    });
    setNewCommentText("");
  };

  const deleteComment = (commentId: string) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      comments: editingCard.comments.filter(c => c.id !== commentId),
    });
  };

  const addLabel = () => {
    if (!newLabelText.trim() || !editingCard) return;
    
    const newLabel: CardLabel = {
      id: `label-${Date.now()}`,
      text: newLabelText.trim(),
      color: LABEL_COLORS[editingCard.labels.length % LABEL_COLORS.length].value,
    };
    
    setEditingCard({
      ...editingCard,
      labels: [...editingCard.labels, newLabel],
    });
    setNewLabelText("");
  };

  const removeLabel = (labelId: string) => {
    if (!editingCard) return;
    
    setEditingCard({
      ...editingCard,
      labels: editingCard.labels.filter(l => l.id !== labelId),
    });
  };

  // Member functions
  const addMember = () => {
    if (!newMemberName.trim() || !editingCard) return;
    setEditingCard({ ...editingCard, assignee: newMemberName.trim() });
    setNewMemberName("");
    setShowMemberSuggestions(false);
  };

  const removeMember = () => {
    if (!editingCard) return;
    setEditingCard({ ...editingCard, assignee: undefined });
  };

  // Attachment functions
  const addAttachment = () => {
    if (!newAttachmentUrl.trim() || !editingCard) return;
    const newAttachment: CardAttachment = {
      id: `attach-${Date.now()}`,
      name: newAttachmentName.trim() || "Attachment",
      url: newAttachmentUrl.trim(),
      type: "link",
    };
    setEditingCard({
      ...editingCard,
      attachments: [...(editingCard.attachments || []), newAttachment],
    });
    setNewAttachmentUrl("");
    setNewAttachmentName("");
  };

  const removeAttachment = (attachmentId: string) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      attachments: editingCard.attachments.filter(a => a.id !== attachmentId),
    });
  };

  // Checklist functions
  const addChecklist = () => {
    if (!newChecklistTitle.trim() || !editingCard) return;
    const newChecklist: Checklist = {
      id: `check-${Date.now()}`,
      title: newChecklistTitle.trim(),
      items: [],
    };
    setEditingCard({
      ...editingCard,
      checklists: [...(editingCard.checklists || []), newChecklist],
    });
    setNewChecklistTitle("");
  };

  const removeChecklist = (checklistId: string) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      checklists: editingCard.checklists.filter(c => c.id !== checklistId),
    });
  };

  const addChecklistItem = (checklistId: string) => {
    if (!newChecklistItem.trim() || !editingCard) return;
    setEditingCard({
      ...editingCard,
      checklists: editingCard.checklists.map(c =>
        c.id === checklistId
          ? { ...c, items: [...c.items, { id: `item-${Date.now()}`, text: newChecklistItem.trim(), checked: false }] }
          : c
      ),
    });
    setNewChecklistItem("");
  };

  const removeChecklistItem = (checklistId: string, itemId: string) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      checklists: editingCard.checklists.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.filter(i => i.id !== itemId) }
          : c
      ),
    });
  };

  const toggleChecklistItem = (checklistId: string, itemId: string) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      checklists: editingCard.checklists.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
          : c
      ),
    });
  };

  const getChecklistProgress = (checklist: Checklist) => {
    if (checklist.items.length === 0) return null;
    const checked = checklist.items.filter(i => i.checked).length;
    return { checked, total: checklist.items.length };
  };

  const openEditCard = (card: CardType, columnId: string) => {
    setEditingCard({
      id: card.id,
      title: card.title,
      description: card.description || "",
      labels: card.labels || [],
      assignee: card.assignee || "",
      attachments: card.attachments || [],
      checklists: card.checklists || [],
      dueDate: card.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : "",
      columnId,
      comments: card.comments || [],
    });
  };

  const isOverdue = (date: Date | undefined | null) => {
    if (!date) return false;
    const due = new Date(date);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return due < now;
  };

  if (!isLoaded || !filteredBoard) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Trello Clone</h1>
        
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={view === "board" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("board")}
              className="gap-1"
            >
              <Layout className="h-4 w-4" />
              Board
            </Button>
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
              className="gap-1"
            >
              <Grid className="h-4 w-4" />
              Calendar
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-input"
              placeholder="Search cards..."
              className="pl-8 w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {/* Shortcuts help */}
          <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (?)">
            <Keyboard className="h-5 w-5" />
          </Button>
          
          {/* Dark mode toggle */}
          <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-background rounded-lg p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {Object.entries(SHORTCUTS).map(([key, desc]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{desc}</span>
                  <kbd className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-4 h-[calc(100vh-80px)]">
          {filteredBoard.columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 bg-muted/50 dark:bg-muted/20 rounded-lg p-2"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-sm">{column.title}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => deleteColumn(column.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-col gap-2 min-h-[100px]"
                  >
                    {column.cards.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No cards found
                      </div>
                    )}
                    {column.cards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-grab active:cursor-grabbing ${
                              snapshot.isDragging ? "shadow-lg rotate-2" : ""
                            }`}
                          >
                            <CardContent className="p-3">
                              {/* Labels */}
                              {card.labels && card.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {card.labels.map((label) => (
                                    <span
                                      key={label.id}
                                      className={`${label.color} text-white text-xs px-2 py-0.5 rounded-full`}
                                    >
                                      {label.text}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-medium">{card.title}</span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => openEditCard(card, column.id)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive"
                                    onClick={() => deleteCard(column.id, card.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Member avatar */}
                              {card.assignee && (
                                <div className="flex items-center gap-1 mt-2">
                                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-medium">
                                    {card.assignee.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{card.assignee}</span>
                                </div>
                              )}

                              {/* Attachments */}
                              {card.attachments && card.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {card.attachments.map((att) => (
                                    <div
                                      key={att.id}
                                      className="flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded"
                                    >
                                      <Paperclip className="h-3 w-3" />
                                      <span className="truncate max-w-[100px]">{att.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Checklist progress */}
                              {card.checklists && card.checklists.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {card.checklists.map((checklist) => {
                                    const progress = getChecklistProgress(checklist);
                                    if (!progress) return null;
                                    return (
                                      <div key={checklist.id} className="flex items-center gap-2">
                                        <CheckSquare className="h-3 w-3 text-muted-foreground" />
                                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${(progress.checked / progress.total) * 100}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {progress.checked}/{progress.total}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Due date */}
                              {card.dueDate && (
                                <div className={`flex items-center gap-1 mt-2 text-xs ${
                                  isOverdue(card.dueDate) ? "text-red-500" : "text-muted-foreground"
                                }`}>
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(card.dueDate).toLocaleDateString()}</span>
                                </div>
                              )}

                              {/* Comment count */}
                              {card.comments && card.comments.length > 0 && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <MessageCircle className="h-3 w-3" />
                                  <span>{card.comments.length}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <Dialog
                open={isAddCardOpen === column.id}
                onOpenChange={(open) => setIsAddCardOpen(open ? column.id : null)}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Card</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Card title..."
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCard(column.id)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddCardOpen(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => addCard(column.id)}>Add</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}

          <div className="flex-shrink-0 w-72">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add column
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Column</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Column title..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addColumn()}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setNewColumnTitle("")}>
                    Cancel
                  </Button>
                  <Button onClick={addColumn}>Add</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </DragDropContext>

      {/* Calendar View */}
      {view === "calendar" && (
        <CalendarView board={filteredBoard} onEditCard={openEditCard} />
      )}

      {/* Edit card dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingCard.title}
                  onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={editingCard.description}
                  onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                  placeholder="Add a description..."
                />
              </div>

              {/* Labels */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Labels
                </label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {editingCard.labels.map((label) => (
                    <span
                      key={label.id}
                      className={`${label.color} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}
                    >
                      {label.text}
                      <button onClick={() => removeLabel(label.id)} className="hover:text-red-200">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="New label..."
                    value={newLabelText}
                    onChange={(e) => setNewLabelText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLabel())}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={addLabel}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`${color.value} w-6 h-6 rounded-full border-2 border-transparent hover:border-white`}
                      onClick={() => {
                        const newLabel: CardLabel = {
                          id: `label-${Date.now()}`,
                          text: newLabelText || "New",
                          color: color.value,
                        };
                        setEditingCard({
                          ...editingCard,
                          labels: [...editingCard.labels, newLabel],
                        });
                        setNewLabelText("");
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Members/Assignee */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Members
                </label>
                {editingCard.assignee && (
                  <div className="flex items-center gap-2 mt-2 bg-muted rounded-md px-3 py-2">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-medium">
                      {editingCard.assignee.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm">{editingCard.assignee}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeMember}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="relative mt-2">
                  <Input
                    placeholder="Add member..."
                    value={newMemberName}
                    onChange={(e) => {
                      setNewMemberName(e.target.value);
                      setShowMemberSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMember();
                      }
                    }}
                    onFocus={() => setShowMemberSuggestions(true)}
                    className="flex-1"
                  />
                  {showMemberSuggestions && newMemberName && (
                    <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1">
                      {MEMBER_SUGGESTIONS.filter(m => 
                        m.toLowerCase().includes(newMemberName.toLowerCase())
                      ).map((member) => (
                        <button
                          key={member}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                          onClick={() => {
                            setNewMemberName(member);
                            setShowMemberSuggestions(false);
                            setEditingCard({ ...editingCard, assignee: member });
                          }}
                        >
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-medium">
                            {member.charAt(0).toUpperCase()}
                          </div>
                          {member}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </label>
                {editingCard.attachments && editingCard.attachments.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {editingCard.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 bg-muted rounded-md px-3 py-2"
                      >
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm truncate">{att.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeAttachment(att.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    placeholder="Attachment name..."
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    className="col-span-2"
                  />
                  <Input
                    placeholder="URL..."
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    className="col-span-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="col-span-2"
                    onClick={addAttachment}
                    disabled={!newAttachmentUrl.trim()}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Add Attachment
                  </Button>
                </div>
              </div>

              {/* Checklists */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Checklists
                </label>
                {editingCard.checklists && editingCard.checklists.length > 0 && (
                  <div className="space-y-3 mt-2">
                    {editingCard.checklists.map((checklist) => (
                      <div key={checklist.id} className="bg-muted rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{checklist.title}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeChecklist(checklist.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {checklist.items.length > 0 && (
                          <div className="space-y-1 mb-2">
                            {checklist.items.map((item) => {
                              const progress = getChecklistProgress(checklist);
                              return (
                                <div key={item.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => toggleChecklistItem(checklist.id, item.id)}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                  <span className={`flex-1 text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                                    {item.text}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => removeChecklistItem(checklist.id, item.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {progress && (
                          <div className="h-1.5 bg-background rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(progress.checked / progress.total) * 100}%` }}
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add item..."
                            value={newChecklistItem}
                            onChange={(e) => setNewChecklistItem(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addChecklistItem(checklist.id);
                              }
                            }}
                            className="flex-1 h-8"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => addChecklistItem(checklist.id)}
                            disabled={!newChecklistItem.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <Input
                    placeholder="New checklist title..."
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChecklist();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={addChecklist}
                    disabled={!newChecklistTitle.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Checklist
                  </Button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Comments ({editingCard.comments?.length || 0})
                </label>
                
                {/* Comment list */}
                {editingCard.comments && editingCard.comments.length > 0 && (
                  <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                    {editingCard.comments.map((comment) => (
                      <div key={comment.id} className="bg-muted rounded-md p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{comment.author}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => deleteComment(comment.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                <div className="space-y-2 mt-2">
                  <Input
                    placeholder="Your name..."
                    value={newCommentAuthor}
                    onChange={(e) => setNewCommentAuthor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCommentAuthor.trim() && newCommentText.trim()) {
                        e.preventDefault();
                        addComment();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Write a comment..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCommentAuthor.trim() && newCommentText.trim()) {
                          e.preventDefault();
                          addComment();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={addComment}
                      disabled={!newCommentAuthor.trim() || !newCommentText.trim()}
                    >
                      Post
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Comments ({editingCard.comments?.length || 0})
                </label>
                {editingCard.comments && editingCard.comments.length > 0 && (
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {editingCard.comments.map((comment) => (
                      <div key={comment.id} className="bg-muted rounded-md p-2 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{comment.author}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-muted-foreground">{comment.text}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input
                    placeholder="Your name..."
                    value={newCommentAuthor}
                    onChange={(e) => setNewCommentAuthor(e.target.value)}
                    className="col-span-1 h-8"
                  />
                  <Input
                    placeholder="Add comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCommentText.trim() && newCommentAuthor.trim()) {
                        addComment();
                      }
                    }}
                    className="col-span-2 h-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={addComment}
                  disabled={!newCommentText.trim() || !newCommentAuthor.trim()}
                >
                  Add Comment
                </Button>
              </div>

              {/* Due date */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </label>
                <Input
                  type="date"
                  value={editingCard.dueDate}
                  onChange={(e) => setEditingCard({ ...editingCard, dueDate: e.target.value })}
                  className="mt-2"
                />
                {editingCard.dueDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-xs text-muted-foreground"
                    onClick={() => setEditingCard({ ...editingCard, dueDate: "" })}
                  >
                    Clear due date
                  </Button>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingCard(null)}>
                  Cancel
                </Button>
                <Button onClick={updateCard}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
