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
  sourceCardTitle?: string;
  targetCardId: string;
  targetCardTitle?: string;
  dependencyType: DependencyType;
  lagDays: number;
  isCriticalPath: boolean;
}

export type DependencyType =
  | 'finish_to_start'
  | 'start_to_start'
  | 'finish_to_finish'
  | 'start_to_finish';

export interface DateViolation {
  type: ViolationType;
  message: string;
  cards: string[];
  severity: 'error' | 'warning' | 'info';
}

export type ViolationType = 'circular' | 'missing_date' | 'future_start' | 'dependency_gap';

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

// Calendar Configuration Types
export interface CalendarConfig {
  startDayOfWeek: number;
  workingHours: {
    start: number;
    end: number;
  };
  holidays: Date[];
  weekendDays: number[];
}

// Calendar Heatmap Types
export interface HeatmapData {
  date: Date;
  cardCount: number;
  completedCount: number;
  intensity: number;
}

export interface HeatmapConfig {
  startDate?: Date;
  endDate?: Date;
  showLabels: boolean;
  intensityScale: 'linear' | 'logarithmic';
}

// Utility types for component props
export interface CalendarEnhancementsProps {
  board: Board;
  dependencies: DateDependency[];
  milestones: Milestone[];
  onEditCard: (card: CardType, columnId: string) => void;
  onNavigateToCard: (cardId: string) => void;
}

export interface Board {
  id: string;
  title: string;
  columns: ColumnType[];
}

export interface ColumnType {
  id: string;
  title: string;
  cards: CardType[];
}

export interface CardType {
  id: string;
  title: string;
  dueDate?: string;
  createdAt: string;
  color?: string;
}
