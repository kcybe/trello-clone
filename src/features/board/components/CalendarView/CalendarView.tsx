'use client';

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarViewProps } from '@/types';

import { useState } from 'react';

export function CalendarView({ board, onEditCard }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getCardsForDate = (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];

    const cardsWithDueDates: Array<{
      card: (typeof board.columns)[0]['cards'][0];
      columnId: string;
      columnName: string;
    }> = [];

    board.columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.dueDate) {
          const dueDateStr = new Date(card.dueDate).toISOString().split('T')[0];
          if (dueDateStr === dateStr) {
            cardsWithDueDates.push({ card, columnId: column.id, columnName: column.title });
          }
        }
      });
    });

    return cardsWithDueDates;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-28 border bg-muted/20" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const cards = getCardsForDate(day);
      const hasCards = cards.length > 0;

      days.push(
        <div
          key={day}
          className={`h-28 border p-1 cursor-pointer transition-colors hover:bg-muted/30 ${
            isToday(day) ? 'bg-primary/5' : ''
          } ${isSelected(day) ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setSelectedDate(new Date(year, month, day))}
        >
          <div
            className={`text-xs font-medium mb-1 ${
              isToday(day)
                ? 'bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center'
                : ''
            }`}
          >
            {day}
          </div>
          <div className="space-y-1 overflow-hidden">
            {cards.slice(0, 3).map((item, idx) => (
              <button
                key={idx}
                className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate ${
                  item.card.color || 'bg-primary/10 text-primary'
                }`}
                onClick={e => {
                  e.stopPropagation();
                  onEditCard(item.card, item.columnId);
                }}
                title={`${item.card.title} (${item.columnName})`}
              >
                {item.card.title}
              </button>
            ))}
            {cards.length > 3 && (
              <div className="text-xs text-muted-foreground px-1">+{cards.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // Get all cards with due dates for empty state
  const allCardsWithDueDates = board.columns.flatMap(column =>
    column.cards.filter(card => card.dueDate)
  );

  return (
    <div className="p-4 h-[calc(100vh-80px)] overflow-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">
            {monthNames[month]} {year}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center border rounded-lg">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-r-none">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="rounded-l-none border-l"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {allCardsWithDueDates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <CardContent className="text-center">
            <h3 className="text-lg font-medium mb-2">No cards with due dates</h3>
            <p className="text-muted-foreground mb-4">
              Add due dates to your cards to see them here on the calendar view.
            </p>
            <p className="text-sm text-muted-foreground">
              Cards with due dates will appear on their scheduled day.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px border bg-border">
            {dayNames.map(day => (
              <div
                key={day}
                className="bg-muted/50 py-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-px border bg-border">{renderCalendarDays()}</div>
        </>
      )}

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-4 p-4 border rounded-lg bg-card">
          <h3 className="font-medium mb-2">
            Cards for{' '}
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          {(() => {
            const cards = getCardsForDate(selectedDate.getDate());
            if (cards.length === 0) {
              return <p className="text-sm text-muted-foreground">No cards due on this day.</p>;
            }
            return (
              <div className="space-y-2">
                {cards.map((item, idx) => (
                  <Card key={idx} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${item.card.color || 'bg-primary'}`}
                        />
                        <span className="font-medium">{item.card.title}</span>
                        <span className="text-xs text-muted-foreground">({item.columnName})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCard(item.card, item.columnId)}
                      >
                        Edit
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
