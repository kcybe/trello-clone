"use client";

import { useMemo } from "react";
import { Board, Card } from "@/types";
import { CheckSquare, Clock, AlertCircle, Layers } from "lucide-react";
import { Card as UICard, CardContent } from "@/components/ui/card";

interface BoardStatisticsProps {
  board: Board | null;
}

export function BoardStatistics({ board }: BoardStatisticsProps) {
  const stats = useMemo(() => {
    if (!board) return null;

    const allCards = board.columns.flatMap((col) => col.cards);
    const totalCards = allCards.length;
    
    // Completed cards (cards in columns with "done" or "completed" in title)
    const completedCards = allCards.filter((card) => {
      const column = board.columns.find((col) => col.cards.includes(card));
      return column && /done|completed|finished/i.test(column.title);
    }).length;

    // Due soon cards (due within the next 3 days)
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const dueSoonCards = allCards.filter((card) => {
      if (!card.dueDate) return false;
      const dueDate = new Date(card.dueDate);
      return dueDate >= now && dueDate <= threeDaysFromNow;
    }).length;

    // Overdue cards (past due date)
    const overdueCards = allCards.filter((card) => {
      if (!card.dueDate) return false;
      const dueDate = new Date(card.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;

    // Cards per column breakdown
    const cardsPerColumn = board.columns.map((col) => ({
      id: col.id,
      title: col.title,
      count: col.cards.length,
    }));

    return {
      totalCards,
      completedCards,
      dueSoonCards,
      overdueCards,
      cardsPerColumn,
    };
  }, [board]);

  if (!stats || !board) {
    return null;
  }

  const completionPercentage = stats.totalCards > 0
    ? Math.round((stats.completedCards / stats.totalCards) * 100)
    : 0;

  return (
    <div className="border-t bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-6">
        {/* Overview Stats */}
        <div className="flex items-center gap-4">
          {/* Total Cards */}
          <UICard className="min-w-[100px]">
            <CardContent className="p-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{stats.totalCards}</p>
              </div>
            </CardContent>
          </UICard>

          {/* Completed Cards */}
          <UICard className="min-w-[100px]">
            <CardContent className="p-3 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-semibold">{stats.completedCards}</p>
              </div>
            </CardContent>
          </UICard>

          {/* Due Soon Cards */}
          <UICard className="min-w-[100px]">
            <CardContent className="p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Due Soon</p>
                <p className="text-lg font-semibold">{stats.dueSoonCards}</p>
              </div>
            </CardContent>
          </UICard>

          {/* Overdue Cards */}
          <UICard className="min-w-[100px]">
            <CardContent className="p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-lg font-semibold">{stats.overdueCards}</p>
              </div>
            </CardContent>
          </UICard>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium">{completionPercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cards Per Column */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">By Column:</span>
          <div className="flex gap-1">
            {stats.cardsPerColumn.map((col) => (
              <div
                key={col.id}
                className="flex items-center gap-1 px-2 py-1 bg-background rounded text-xs"
                title={col.title}
              >
                <span className="text-muted-foreground truncate max-w-[80px]">
                  {col.title}
                </span>
                <span className="font-medium">{col.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
