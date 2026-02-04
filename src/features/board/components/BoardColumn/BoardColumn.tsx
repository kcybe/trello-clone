'use client';

import { Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Trash2, Plus, Archive, RotateCcw, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { BoardColumnProps } from '../../types';
import { CardItem } from '../CardItem';

export function BoardColumn({
  column,
  cards,
  isCompact,
  isAddCardOpen,
  moveCardOpen,
  selectedCardId,
  onAddCard,
  onDeleteColumn,
  onArchiveCard,
  onDuplicateCard,
  onMoveCard,
  onOpenAddCard,
  onCloseAddCard,
  onSetNewCardTitle,
  onSetMoveCardOpen,
  onSelectCard,
  onEditCard,
  onUnarchiveCard,
  onPermanentlyDeleteCard,
}: BoardColumnProps) {
  const onDragEnd = (result: DropResult) => {
    // This is handled by the parent component
  };

  return (
    <div className="flex-shrink-0 w-72 bg-muted/50 dark:bg-muted/20 rounded-lg p-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-sm">{column.title}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onDeleteColumn(column.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Droppable droppableId={column.id}>
        {provided => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex flex-col gap-2 min-h-[100px]"
          >
            {cards.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">No cards found</div>
            )}
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onSelectCard(card, column.id, index)}
                  >
                    <CardItem
                      card={card}
                      index={index}
                      isCompact={isCompact}
                      isSelected={selectedCardId === card.id}
                      onSelect={() => onSelectCard(card, column.id, index)}
                      onEdit={() => onEditCard(card, column.id)}
                      onArchive={() => onArchiveCard(column.id, card.id)}
                      onDuplicate={() => onDuplicateCard(column.id, card.id)}
                      onMove={() => onSetMoveCardOpen(moveCardOpen === card.id ? null : card.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <Dialog
        open={isAddCardOpen === column.id}
        onOpenChange={open => (open ? onOpenAddCard(column.id) : onCloseAddCard())}
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
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                onAddCard(column.id);
              }
            }}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onCloseAddCard}>
              Cancel
            </Button>
            <Button onClick={() => onAddCard(column.id)}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archived Cards */}
      {column.archivedCards && column.archivedCards.length > 0 && (
        <div className="mt-4 border-t pt-2">
          <details open>
            <summary className="text-sm font-medium cursor-pointer flex items-center gap-2 text-muted-foreground">
              <Archive className="h-4 w-4" />
              Archived ({column.archivedCards.length})
            </summary>
            <div className="mt-2 space-y-2">
              {column.archivedCards.map(card => (
                <Card key={card.id} className="opacity-60">
                  <CardContent className="p-2 flex items-center justify-between">
                    <span className="text-sm truncate flex-1">{card.title}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUnarchiveCard(column.id, card.id)}
                        title="Restore"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => onPermanentlyDeleteCard(column.id, card.id)}
                        title="Delete permanently"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
