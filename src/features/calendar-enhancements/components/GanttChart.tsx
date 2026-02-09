'use client';

import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flag,
  Link2,
  Settings,
  ZoomIn,
  ZoomOut,
  Today,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Board, Card as CardType } from '@/types';

import { useMemo, useState, useCallback } from 'react';

import {
  GanttTask,
  GanttViewOptions,
  GanttDateRange,
  DateDependency,
  Milestone,
  CalendarConfig,
} from '../types';

interface GanttChartProps {
  board: Board;
  dependencies: DateDependency[];
  milestones: Milestone[];
  onEditCard: (card: CardType, columnId: string) => void;
  onNavigateToCard: (cardId: string) => void;
}

const DEFAULT_CONFIG: CalendarConfig = {
  startDayOfWeek: 0,
  workingHours: { start: 9, end: 17 },
  holidays: [],
  weekendDays: [0, 6],
};

const DEFAULT_OPTIONS: GanttViewOptions = {
  showDependencies: true,
  showProgress: true,
  showMilestones: true,
  dateFormat: 'week',
  workDaysOnly: false,
};

export function GanttChart({
  board,
  dependencies,
  milestones,
  onEditCard,
  onNavigateToCard,
}: GanttChartProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [config] = useState<CalendarConfig>(DEFAULT_CONFIG);
  const [options, setOptions] = useState<GanttViewOptions>(DEFAULT_OPTIONS);
  const [zoom, setZoom] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // Generate tasks from board cards
  const tasks = useMemo(() => {
    return board.columns.flatMap(column =>
      column.cards
        .filter(card => card.dueDate)
        .map(card => ({
          id: card.id,
          title: card.title,
          startDate: new Date(card.createdAt),
          endDate: new Date(card.dueDate!),
          progress: 0,
          color: card.color || getColumnColor(column.id),
          dependencies: dependencies
            .filter(d => d.targetCardId === card.id)
            .map(d => d.sourceCardId),
          columnId: column.id,
          cardId: card.id,
          isMilestone: false,
        }))
    );
  }, [board, dependencies]);

  // Calculate date range
  const dateRange = useMemo((): GanttDateRange => {
    const allDates = tasks.flatMap(t => [t.startDate, t.endDate]);
    milestones.forEach(m => allDates.push(m.date));

    if (allDates.length === 0) {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 14);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 28);
      return generateDateRange(startDate, endDate, config, options.dateFormat);
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return generateDateRange(minDate, maxDate, config, options.dateFormat);
  }, [tasks, milestones, config, options.dateFormat]);

  // Get tasks for a specific column
  const getTasksForColumn = useCallback(
    (columnId: string) => {
      return tasks.filter(task => task.columnId === columnId);
    },
    [tasks]
  );

  // Calculate task position and width
  const getTaskStyle = useCallback(
    (task: GanttTask) => {
      const startOffset = getDateOffset(
        task.startDate,
        dateRange.startDate,
        config,
        options.workDaysOnly
      );
      const endOffset = getDateOffset(
        task.endDate,
        dateRange.startDate,
        config,
        options.workDaysOnly
      );
      const width = Math.max(endOffset - startOffset, 1);

      return {
        left: `${startOffset * zoom}rem`,
        width: `${width * zoom}rem`,
      };
    },
    [dateRange, config, options.workDaysOnly, zoom]
  );

  // Get critical path dependencies
  const criticalPathTasks = useMemo(() => {
    const taskIds = new Set<string>();
    const findPath = (taskId: string) => {
      taskIds.add(taskId);
      const deps = dependencies.filter(d => d.targetCardId === taskId && d.isCriticalPath);
      deps.forEach(dep => findPath(dep.sourceCardId));
    };
    tasks.filter(t => t.dependencies.length === 0).forEach(t => findPath(t.id));
    return taskIds;
  }, [tasks, dependencies]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Gantt Chart</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2 w-16 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center border rounded-lg">
            <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
              <Today className="h-4 w-4 mr-1" />
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Settings */}
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b bg-muted/50">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.showDependencies}
                onChange={e => setOptions({ ...options, showDependencies: e.target.checked })}
                className="rounded"
              />
              <Link2 className="h-4 w-4" />
              Show Dependencies
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.showProgress}
                onChange={e => setOptions({ ...options, showProgress: e.target.checked })}
                className="rounded"
              />
              Show Progress
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.showMilestones}
                onChange={e => setOptions({ ...options, showMilestones: e.target.checked })}
                className="rounded"
              />
              <Flag className="h-4 w-4" />
              Show Milestones
            </label>
          </div>
        </div>
      )}

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Task List */}
          <div className="w-64 flex-shrink-0 border-r bg-background">
            <div className="h-12 border-b bg-muted/50 px-4 flex items-center font-medium">Task</div>
            {board.columns.map(column => (
              <div key={column.id}>
                <div className="h-10 px-4 flex items-center bg-muted/30 font-medium text-sm border-b">
                  {column.title}
                </div>
                {getTasksForColumn(column.id).map(task => (
                  <div
                    key={task.id}
                    className="h-10 px-4 flex items-center border-b cursor-pointer hover:bg-muted/50"
                    onClick={() => onNavigateToCard(task.cardId)}
                  >
                    <span className="truncate text-sm">{task.title}</span>
                  </div>
                ))}
                {options.showMilestones &&
                  milestones
                    .filter(m =>
                      m.cardIds.some(id => getTasksForColumn(column.id).some(t => t.cardId === id))
                    )
                    .map(milestone => (
                      <div
                        key={milestone.id}
                        className="h-10 px-4 flex items-center border-b bg-muted/20"
                      >
                        <Flag className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="truncate text-sm text-muted-foreground">
                          {milestone.title}
                        </span>
                      </div>
                    ))}
              </div>
            ))}
          </div>

          {/* Timeline */}
          <ScrollArea className="flex-1">
            {/* Date Headers */}
            <div className="sticky top-0 z-10 bg-background">
              <div className="flex h-12 border-b bg-muted/50">
                {dateRange.weeks.map((week, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 border-r px-2 flex flex-col justify-center"
                    style={{ width: `${7 * zoom}rem` }}
                  >
                    <span className="text-xs font-medium">Week {week.weekNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {week.startDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
              {/* Day Headers */}
              <div className="flex h-8 border-b bg-muted/30">
                {dateRange.weeks.flatMap(week =>
                  week.days.map((day, idx) => (
                    <div
                      key={`${week.weekNumber}-${idx}`}
                      className={`flex-shrink-0 border-r flex items-center justify-center text-xs ${
                        day.isWeekend ? 'bg-muted/50' : ''
                      } ${day.isToday ? 'bg-primary/10 font-medium' : ''}`}
                      style={{ width: `${zoom}rem` }}
                    >
                      {day.date.getDate()}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Task Bars */}
            {board.columns.map(column => (
              <div key={column.id} className="relative">
                <div className="h-10 border-b bg-muted/30" />
                {getTasksForColumn(column.id).map(task => (
                  <div
                    key={task.id}
                    className="h-10 border-b relative"
                    onClick={() => {
                      const card = column.cards.find(c => c.id === task.cardId);
                      if (card) onEditCard(card, column.id);
                    }}
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {dateRange.weeks.flatMap(week =>
                        week.days.map((day, idx) => (
                          <div
                            key={`${week.weekNumber}-${idx}`}
                            className={`flex-shrink-0 border-r h-full ${
                              day.isWeekend ? 'bg-muted/20' : ''
                            } ${day.isToday ? 'bg-primary/5' : ''}`}
                            style={{ width: `${zoom}rem` }}
                          />
                        ))
                      )}
                    </div>

                    {/* Task bar */}
                    <div
                      className={`absolute top-1 h-8 rounded cursor-pointer transition-all hover:opacity-80 ${
                        criticalPathTasks.has(task.id) ? 'ring-2 ring-orange-500' : ''
                      }`}
                      style={{
                        ...getTaskStyle(task),
                        backgroundColor: task.color,
                      }}
                    >
                      <div className="h-full flex items-center px-2 overflow-hidden">
                        <span className="text-xs font-medium text-white truncate">
                          {task.title}
                        </span>
                      </div>

                      {/* Progress indicator */}
                      {options.showProgress && task.progress > 0 && (
                        <div className="absolute inset-0 rounded overflow-hidden pointer-events-none">
                          <div
                            className="h-full bg-black/20"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Milestones */}
                {options.showMilestones &&
                  milestones
                    .filter(m =>
                      m.cardIds.some(id => getTasksForColumn(column.id).some(t => t.cardId === id))
                    )
                    .map(milestone => (
                      <div key={milestone.id} className="h-10 border-b relative">
                        {(() => {
                          const offset = getDateOffset(
                            milestone.date,
                            dateRange.startDate,
                            config,
                            options.workDaysOnly
                          );
                          return (
                            <div
                              className="absolute top-1/2 -translate-y-1/2"
                              style={{ left: `${offset * zoom}rem` }}
                            >
                              <Flag
                                className={`h-5 w-5 ${
                                  milestone.completed ? 'text-green-500' : 'text-red-500'
                                }`}
                              />
                            </div>
                          );
                        })()}
                      </div>
                    ))}
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>Task</span>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-green-500" />
          <span>Completed Milestone</span>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-red-500" />
          <span>Pending Milestone</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-orange-500" />
          <span>Critical Path</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-slate-400" />
          <span>Dependency</span>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function generateDateRange(
  startDate: Date,
  endDate: Date,
  config: CalendarConfig,
  format: 'week' | 'month' | 'quarter'
): GanttDateRange {
  const weeks: Array<{
    weekNumber: number;
    startDate: Date;
    endDate: Date;
    days: Array<{
      date: Date;
      isWeekend: boolean;
      isHoliday: boolean;
      isToday: boolean;
    }>;
  }> = [];
  let currentDate = new Date(startDate);

  // Align to week start
  while (currentDate.getDay() !== config.startDayOfWeek) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const days: Array<{
      date: Date;
      isWeekend: boolean;
      isHoliday: boolean;
      isToday: boolean;
    }> = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(currentDate);
      dayDate.setDate(dayDate.getDate() + i);
      days.push({
        date: dayDate,
        isWeekend: config.weekendDays.includes(dayDate.getDay()),
        isHoliday: config.holidays.some(h => h.toDateString() === dayDate.toDateString()),
        isToday: isSameDay(dayDate, new Date()),
      });
    }

    weeks.push({
      weekNumber: getWeekNumber(weekStart),
      startDate: weekStart,
      endDate: weekEnd,
      days,
    });

    currentDate = new Date(weekEnd);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { startDate, endDate, weeks };
}

function getDateOffset(
  date: Date,
  rangeStart: Date,
  config: CalendarConfig,
  workDaysOnly: boolean
): number {
  const diffTime = date.getTime() - rangeStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (workDaysOnly) {
    let weeks = Math.floor(diffDays / 7);
    let remainingDays = diffDays % 7;
    // Subtract weekend days
    const rangeStartDay = rangeStart.getDay();
    for (let i = 0; i < remainingDays; i++) {
      if (config.weekendDays.includes((rangeStartDay + i) % 7)) {
        weeks -= 1 / 7;
      }
    }
    return weeks + remainingDays * (5 / 7);
  }

  return diffDays;
}

function getColumnColor(columnId: string): string {
  const colors = [
    '#3b82f6',
    '#8b5cf6',
    '#f59e0b',
    '#22c55e',
    '#ef4444',
    '#ec4899',
    '#14b8a6',
    '#f97316',
  ];
  const hash = columnId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function navigateDate(direction: number): void {
  // Implementation for navigating the Gantt chart date range
}
