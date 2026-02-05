'use client';

import {
  Clock,
  Plus,
  Move,
  Edit,
  Archive,
  RotateCcw,
  Trash2,
  Copy,
  MessageCircle,
  Calendar,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Activity, ActivityType } from '@/types';

interface ActivityLogProps {
  activities: Activity[];
  maxItems?: number;
  className?: string;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  card_created: <Plus className="h-4 w-4" />,
  card_moved: <Move className="h-4 w-4" />,
  card_edited: <Edit className="h-4 w-4" />,
  card_archived: <Archive className="h-4 w-4" />,
  card_restored: <RotateCcw className="h-4 w-4" />,
  card_deleted: <Trash2 className="h-4 w-4" />,
  card_duplicated: <Copy className="h-4 w-4" />,
  comment_added: <MessageCircle className="h-4 w-4" />,
  due_date_set: <Calendar className="h-4 w-4" />,
  due_date_changed: <Calendar className="h-4 w-4" />,
  label_added: <Plus className="h-4 w-4" />,
  member_assigned: <Plus className="h-4 w-4" />,
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  card_created: 'created',
  card_moved: 'moved',
  card_edited: 'edited',
  card_archived: 'archived',
  card_restored: 'restored',
  card_deleted: 'deleted',
  card_duplicated: 'duplicated',
  comment_added: 'commented on',
  due_date_set: 'set due date for',
  due_date_changed: 'changed due date for',
  label_added: 'added label to',
  member_assigned: 'assigned member to',
};

function formatTimestamp(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function getActivityDescription(activity: Activity): string {
  switch (activity.type) {
    case 'card_moved':
      if (activity.fromColumnName && activity.toColumnName) {
        return `moved "${activity.cardTitle}" from ${activity.fromColumnName} to ${activity.toColumnName}`;
      }
      return `moved "${activity.cardTitle}"`;
    case 'card_created':
      return `created "${activity.cardTitle}"`;
    case 'card_edited':
      return `edited "${activity.cardTitle}"`;
    case 'card_archived':
      return `archived "${activity.cardTitle}"`;
    case 'card_restored':
      return `restored "${activity.cardTitle}"`;
    case 'card_deleted':
      return `deleted "${activity.cardTitle}"`;
    case 'card_duplicated':
      return `duplicated "${activity.cardTitle}"`;
    case 'comment_added':
      return `commented on "${activity.cardTitle}"`;
    case 'due_date_set':
      return `set due date for "${activity.cardTitle}"`;
    case 'due_date_changed':
      return `changed due date for "${activity.cardTitle}"`;
    case 'label_added':
      return `added label to "${activity.cardTitle}"`;
    case 'member_assigned':
      return `assigned member to "${activity.cardTitle}"`;
    default:
      return `performed action on "${activity.cardTitle}"`;
  }
}

export function ActivityLog({ activities, maxItems = 50, className }: ActivityLogProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {displayActivities.map(activity => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          {/* User Avatar */}
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            {activity.user ? (
              <span className="text-xs font-medium text-primary">
                {activity.user.charAt(0).toUpperCase()}
              </span>
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="font-medium text-sm truncate">{activity.user || 'Unknown'}</span>
              <span className="text-xs text-muted-foreground">
                {ACTIVITY_LABELS[activity.type]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {getActivityDescription(activity)}
            </p>
            {activity.description && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                &quot;{activity.description}&quot;
              </p>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTimestamp(activity.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
