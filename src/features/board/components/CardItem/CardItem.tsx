'use client';

import {
  Pencil,
  Archive,
  Copy,
  ArrowRight,
  Calendar,
  Paperclip,
  CheckSquare,
  MessageCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { CardItemProps } from '../../types';

export function CardItem({
  card,
  isCompact,
  isSelected,
  onSelect,
  onEdit,
  onArchive,
  onDuplicate,
  onMove,
}: CardItemProps) {
  const isOverdue = (date: Date | undefined | null) => {
    if (!date) return false;
    const due = new Date(date);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return due < now;
  };

  const getChecklistProgress = (checklist: { items: { checked: boolean }[] }) => {
    if (checklist.items.length === 0) return null;
    const checked = checklist.items.filter(i => i.checked).length;
    return { checked, total: checklist.items.length };
  };

  return (
    <Card
      onClick={onSelect}
      className={`cursor-grab active:cursor-grabbing ${card.color || ''} ${
        isSelected ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      <CardContent className={`${isCompact ? 'p-2' : 'p-3'}`}>
        {/* Labels */}
        {card.labels && card.labels.length > 0 && !isCompact && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map(label => (
              <span
                key={label.id}
                className={`${label.color} text-white text-xs px-2 py-0.5 rounded-full`}
              >
                {label.text}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium`}>{card.title}</span>
        </div>

        {/* Description preview (first 100 chars) */}
        {card.description && !isCompact && (
          <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {card.description.length > 100
              ? card.description.substring(0, 100) + '...'
              : card.description}
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mt-1">
          {isCompact ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 -mt-1"
              onClick={e => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={e => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={e => {
                  e.stopPropagation();
                  onArchive();
                }}
                title="Archive card"
              >
                <Archive className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={e => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                title="Duplicate card"
              >
                <Copy className="h-3 w-3" />
              </Button>

              {/* Move card button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={e => {
                  e.stopPropagation();
                  onMove();
                }}
                title="Move card"
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Member avatar */}
        {card.assignee && (
          <div className="flex items-center gap-1 mt-2">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-medium">
              {card.assignee.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground">{card.assignee}</span>
          </div>
        )}

        {/* Attachments */}
        {card.attachments && card.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {card.attachments.map(att => (
              <div
                key={att.id}
                className="flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Checklist progress */}
        {card.checklists && card.checklists.length > 0 && (
          <div className="mt-2 space-y-1">
            {card.checklists.map(checklist => {
              const progress = getChecklistProgress(checklist);
              if (!progress) return null;
              return (
                <div key={checklist.id} className="flex items-center gap-2">
                  <CheckSquare className="h-3 w-3 text-muted-foreground" />
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(progress.checked / progress.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {progress.checked}/{progress.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Due date */}
        {card.dueDate && (
          <div
            className={`flex items-center gap-1 mt-2 text-xs ${
              isOverdue(new Date(card.dueDate)) ? 'text-red-500' : 'text-muted-foreground'
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>{new Date(card.dueDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Comment count */}
        {card.comments && card.comments.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <MessageCircle className="h-3 w-3" />
            <span>{card.comments.length}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
