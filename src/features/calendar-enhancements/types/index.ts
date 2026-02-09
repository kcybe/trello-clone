// Calendar Enhancement Types
import { Card } from '@/types';

// Gantt Chart Types
export interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  color: string;
  dependencies: string[];
  columnId: string;
  cardId: string;
  isMilestone: boolean;
  milestoneDate?: Date;
}

export interface GanttViewOptions {
  showDependencies: boolean;
  showProgress: boolean;
  showMilestones: boolean;
  dateFormat: 'week' | 'month' | 'quarter';
  workDaysOnly: boolean;
}

export interface GanttColumn {
  id: string;
  name: string;
  tasks: GanttTask[];
}

export interface GanttDateRange {
  startDate: Date;
  endDate: Date;
  weeks: GanttWeek[];
}

export interface GanttWeek {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: GanttDay[];
}

export interface GanttDay {
  date: Date;
  isWeekend: boolean;
  isHoliday: boolean;
  isToday: boolean;
}

// Milestone Types
export interface Milestone {
  id: string;
  title: string;
  date: Date;
  description?: string;
  color: string;
  completed: boolean;
  cardIds: string[];
  boardId: string;
}

export interface MilestoneStatus {
  onTrack: boolean;
  atRisk: boolean;
  missed: boolean;
  completed: boolean;
}

export interface MilestoneProgress {
  milestoneId: string;
  totalCards: number;
  completedCards: number;
  percentage: number;
  status: MilestoneStatus;
}

// Date Dependency Types
export interface DateDependency {
  id: string;
  sourceCardId: string;
  sourceCardTitle: string;
  targetCardId: string;
  targetCardTitle: string;
  dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lagDays: number;
  isCriticalPath: boolean;
}

export interface DependencyChain {
  id: string;
  cards: Array<{
    cardId: string;
    title: string;
    startDate?: Date;
    endDate?: Date;
    columnId: string;
    columnName: string;
  }>;
  totalDuration: number;
  criticalPath: boolean;
}

export interface DateViolation {
  type: 'circular' | 'missing_date' | 'future_start' | 'dependency_gap';
  message: string;
  cards: string[];
  severity: 'error' | 'warning' | 'info';
}

// Calendar Enhancement State
export interface CalendarEnhancementState {
  viewMode: 'calendar' | 'gantt' | 'timeline';
  dateRange: GanttDateRange;
  options: GanttViewOptions;
  milestones: Milestone[];
  dependencies: DateDependency[];
  selectedTaskId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Utility Types
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  cards: CardWithColumn[];
  milestoneCount: number;
}

export interface CardWithColumn {
  card: Card;
  columnId: string;
  columnName: string;
  columnColor: string;
}

export interface CalendarHeatmapData {
  date: Date;
  cardCount: number;
  completedCount: number;
  overdueCount: number;
  intensity: number; // 0-1
}

// View Configuration
export interface CalendarConfig {
  startDayOfWeek: number; // 0 = Sunday, 1 = Monday
  workingHours: {
    start: number; // 9
    end: number; // 17
  };
  holidays: Date[];
  weekendDays: number[]; // [0, 6] = Saturday, Sunday
}

// Chart Types
export interface BurndownData {
  date: Date;
  planned: number;
  actual: number;
  remaining: number;
}

export interface VelocityData {
  sprint: string;
  planned: number;
  completed: number;
}
