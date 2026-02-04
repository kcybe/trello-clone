'use client';

import {
  X,
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
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Activity } from '@/types';

import { useState, useEffect } from 'react';

interface ActivityPanelProps {
  activities: Activity[];
  onClose: () => void;
}

const activityIcons: Record<string, React.ReactNode> = {
  card_created: <Plus className="h-4 w-4 text-green-500" />,
  card_moved: <Move className="h-4 w-4 text-blue-500" />,
  card_edited: <Edit className="h-4 w-4 text-yellow-500" />,
  card_archived: <Archive className="h-4 w-4 text-gray-500" />,
  card_restored: <RotateCcw className="h-4 w-4 text-green-500" />,
  card_deleted: <Trash2 className="h-4 w-4 text-red-500" />,
  card_duplicated: <Copy className="h-4 w-4 text-purple-500" />,
  comment_added: <MessageCircle className="h-4 w-4 text-blue-400" />,
  due_date_set: <Calendar className="h-4 w-4 text-orange-500" />,
  due_date_changed: <Calendar className="h-4 w-4 text-orange-400" />,
  label_added: <Tag className="h-4 w-4 text-pink-500" />,
  member_assigned: <User className="h-4 w-4 text-indigo-500" />,
};

const activityDescriptions: Record<string, string> = {
  card_created: 'created this card',
  card_moved: 'moved this card',
  card_edited: 'edited this card',
  card_archived: 'archived this card',
  card_restored: 'restored this card',
  card_deleted: 'deleted this card',
  card_duplicated: 'duplicated this card',
  comment_added: 'added a comment',
  due_date_set: 'set due date',
  due_date_changed: 'changed due date',
  label_added: 'added a label',
  member_assigned: 'assigned a member',
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function ActivityPanel({ activities, onClose }: ActivityPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Activity Log</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedActivities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm">Actions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedActivities.map(activity => (
              <div key={activity.id} className="flex gap-3 text-sm">
                <div className="flex-shrink-0 mt-0.5">
                  {activityIcons[activity.type] || <Clock className="h-4 w-4 text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="font-medium">{activity.user}</span>
                    <span className="text-muted-foreground">
                      {activityDescriptions[activity.type] || activity.type}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate">{activity.cardTitle}</p>
                  {activity.type === 'card_moved' &&
                    activity.fromColumnName &&
                    activity.toColumnName && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <span className="bg-muted px-1.5 py-0.5 rounded">
                          {activity.fromColumnName}
                        </span>
                        <Move className="h-3 w-3" />
                        <span className="bg-muted px-1.5 py-0.5 rounded">
                          {activity.toColumnName}
                        </span>
                      </div>
                    )}
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
