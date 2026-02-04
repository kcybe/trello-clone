'use client';

import { BoardFooterProps } from '../../types';

export function BoardFooter({ currentBoard }: BoardFooterProps) {
  const isOverdue = (date: Date | undefined | null) => {
    if (!date) return false;
    const due = new Date(date);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return due < now;
  };

  if (!currentBoard) return null;

  const totalCards = currentBoard.columns.reduce((acc, col) => acc + col.cards.length, 0);
  const totalColumns = currentBoard.columns.length;
  const overdueCards = currentBoard.columns.reduce(
    (acc, col) => acc + col.cards.filter(c => c.dueDate && isOverdue(new Date(c.dueDate))).length,
    0
  );
  const completedCards = currentBoard.columns.reduce(
    (acc, col) =>
      acc +
      col.cards.filter(c => {
        if (!c.dueDate) return false;
        const now = new Date();
        const due = new Date(c.dueDate);
        due.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        return due <= now;
      }).length,
    0
  );

  return (
    <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Cards:</span>
        <span className="font-medium">{totalCards}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Columns:</span>
        <span className="font-medium">{totalColumns}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Overdue:</span>
        <span className="font-medium text-red-500">{overdueCards}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Completed:</span>
        <span className="font-medium text-green-500">{completedCards}</span>
      </div>
    </div>
  );
}
