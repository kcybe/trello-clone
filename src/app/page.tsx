"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, X, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Board, Column, Card as CardType } from "@/types";

const STORAGE_KEY = "trello-clone-board";

const initialBoard: Board = {
  columns: [
    {
      id: "todo",
      title: "To Do",
      cards: [
        { id: "c1", title: "Welcome to Trello Clone", description: "Try dragging this card!", createdAt: new Date() },
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
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddCardOpen, setIsAddCardOpen] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<{ id: string; title: string; description: string; columnId: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.columns.forEach((col: Column) => {
          col.cards.forEach((card: CardType) => {
            card.createdAt = new Date(card.createdAt);
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

  useEffect(() => {
    if (isLoaded && board) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    }
  }, [board, isLoaded]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (!board) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

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
                  ? { ...card, title: editingCard.title, description: editingCard.description }
                  : card
              ),
            }
          : col
      ),
    });

    setEditingCard(null);
  };

  if (!isLoaded || !board) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">Trello Clone</h1>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-4 h-[calc(100vh-80px)]">
          {board.columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 bg-muted/50 rounded-lg p-2"
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
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-medium">{card.title}</span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      setEditingCard({
                                        id: card.id,
                                        title: card.title,
                                        description: card.description || "",
                                        columnId: column.id,
                                      })
                                    }
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

      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent>
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
                />
              </div>
              <div className="flex justify-end gap-2">
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
