"use client";

import { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, X, Trash2, Pencil, Calendar, Tag, Search, Moon, Sun, Keyboard } from "lucide-react";
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
import type { Board, Column, Card as CardType, CardLabel } from "@/types";

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
          dueDate: new Date(Date.now() + 86400000 * 2)
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

export default function Home() {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddCardOpen, setIsAddCardOpen] = useState<string | null>(null);
  
  // Edit card state
  const [editingCard, setEditingCard] = useState<{
    id: string;
    title: string;
    description: string;
    labels: CardLabel[];
    dueDate: string;
    columnId: string;
  } | null>(null);

  // New label input
  const [newLabelText, setNewLabelText] = useState("");

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
      dueDate: null,
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
                      dueDate: editingCard.dueDate ? new Date(editingCard.dueDate) : null
                    }
                  : card
              ),
            }
          : col
      ),
    });

    setEditingCard(null);
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

  const openEditCard = (card: CardType, columnId: string) => {
    setEditingCard({
      id: card.id,
      title: card.title,
      description: card.description || "",
      labels: card.labels || [],
      dueDate: card.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : "",
      columnId,
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

                              {/* Due date */}
                              {card.dueDate && (
                                <div className={`flex items-center gap-1 mt-2 text-xs ${
                                  isOverdue(card.dueDate) ? "text-red-500" : "text-muted-foreground"
                                }`}>
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(card.dueDate).toLocaleDateString()}</span>
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

      {/* Edit card dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="max-w-md">
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

              <div className="flex justify-end gap-2-t">
                 pt-4 border<Button variant="outline" onClick={() => setEditingCard(null)}>
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
