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
  Tag,
  User,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Activity, ActivityType } from '@/types';

interface ActivityLogProps {
  activities: Activity[];
  maxItems?: number;
  className?: string;
  compact?: boolean;
  showCardTitle?: boolean;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  card_created: <Plus className="h-4 w-4 text-green-500" />,
  card_moved: <Move className="h-4 w-4 text-blue-500" />,
  card_edited: <Edit className="h-4 w-4 text-yellow-500" />,
  card_archived: <Archive className="h-4 w-4 text-gray-500" />,
  card_restored: <RotateCcw className="h-4 w-4 text-green-500" />,
  card_deleted: <Trash2 className="h-4 w-4 text-red-500" />,
  card_duplicated: <Copy className="h-4 w-4 text-purple-500" />,
  comment_added: <MessageCircle className="h-4 w-4 text-blue-400" />,
  comment_updated: <Edit className="h-4 w-4 text-yellow-400" />,
  comment_deleted: <Trash2 className="h-4 w-4 text-red-400" />,
  due_date_set: <Calendar className="h-4 w-4 text-orange-500" />,
  due_date_changed: <Calendar className="h-4 w-4 text-orange-400" />,
  label_added: <Tag className="h-4 w-4 text-pink-500" />,
  member_assigned: <User className="h-4 w-4 text-indigo-500" />,
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
  comment_updated: 'updated comment on',
  comment_deleted: 'deleted comment from',
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
  const cardTitle = activity.cardTitle || 'Unknown card';

  switch (activity.type) {
    case 'card_moved':
      if (activity.fromColumnName && activity.toColumnName) {
        return `moved "${cardTitle}" from ${activity.fromColumnName} to ${activity.toColumnName}`;
      }
      return `moved "${cardTitle}"`;
    case 'card_created':
      return `created "${cardTitle}"`;
    case 'card_edited':
      return `edited "${cardTitle}"`;
    case 'card_archived':
      return `archived "${cardTitle}"`;
    case 'card_restored':
      return `restored "${cardTitle}"`;
    case 'card_deleted':
      return `deleted "${cardTitle}"`;
    case 'card_duplicated':
      return `duplicated "${cardTitle}"`;
    case 'comment_added':
      return `commented on "${cardTitle}"`;
    case 'comment_updated':
      return `updated comment on "${cardTitle}"`;
    case 'comment_deleted':
      return `deleted comment from "${cardTitle}"`;
    case 'due_date_set':
      return `set due date for "${cardTitle}"`;
    case 'due_date_changed':
      return `changed due date for "${cardTitle}"`;
    case 'label_added':
      return `added label to "${cardTitle}"`;
    case 'member_assigned':
      return `assigned member to "${cardTitle}"`;
    default:
      return `performed action on "${cardTitle}"`;
  }
}

function getUserInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ActivityLog({
  activities,
  maxItems = 50,
  className,
  compact = false,
  showCardTitle = true,
}: ActivityLogProps) {
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
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={activity.user?.image} alt={activity.user?.name || 'User'} />
            <AvatarFallback className="text-xs">
              {getUserInitials(activity.user?.name)}
            </AvatarFallback>
          </Avatar>

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="font-medium text-sm truncate">
                {activity.user?.name || 'Unknown'}
              </span>
              <span className="text-xs text-muted-foreground">
                {ACTIVITY_LABELS[activity.type]}
              </span>
            </div>
            {showCardTitle && activity.cardTitle && (
              <p className="text-xs text-muted-foreground truncate font-medium">
                {getActivityDescription(activity)}
              </p>
            )}
            {!showCardTitle && (
              <p className="text-xs text-muted-foreground truncate">
                {getActivityDescription(activity)}
              </p>
            )}
            {activity.description && (
              <p className="text-xs text-muted-foreground mt-1 italic border-l-2 border-muted pl-2">
                "{activity.description}"
              </p>
            )}
            {activity.type === 'card_moved' && activity.fromColumnName && activity.toColumnName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span className="bg-muted px-1.5 py-0.5 rounded">{activity.fromColumnName}</span>
                <Move className="h-3 w-3" />
                <span className="bg-muted px-1.5 py-0.5 rounded">{activity.toColumnName}</span>
              </div>
            )}
          </div>

          {/* Activity Type Icon */}
          {!compact && <div className="flex-shrink-0">{ACTIVITY_ICONS[activity.type]}</div>}

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

interface ActivityFeedProps extends ActivityLogProps {
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export function ActivityFeed({
  activities,
  maxItems = 50,
  className,
  compact = false,
  showCardTitle = true,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: ActivityFeedProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <ActivityLog
        activities={activities}
        maxItems={maxItems}
        compact={compact}
        showCardTitle={showCardTitle}
      />
      {hasMore && (
        <div className="flex justify-center p-2">
          <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
