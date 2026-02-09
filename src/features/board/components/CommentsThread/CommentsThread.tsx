'use client';

import { MessageCircle, Send, Edit2, Trash2, X, MoreVertical } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Comment } from '@/types';

import { useState, useEffect, useCallback } from 'react';

interface CommentsThreadProps {
  cardId: string;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  onEditComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  currentUser?: {
    id: string;
    name: string;
    image?: string | null;
  };
}

function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCommentDate(date: Date | string): string {
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
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

function CommentItem({ comment, currentUserId, onEdit, onDelete }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.text);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (editContent.trim() && editContent !== comment.text) {
      await onEdit(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(comment.text);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.user?.image} alt={comment.author || 'User'} />
        <AvatarFallback className="text-xs">
          {getUserInitials(comment.author || '?')}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.author || 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">
              {formatCommentDate(comment.createdAt)}
            </span>
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>

          {(currentUserId === comment.userId || currentUserId) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isEditing && currentUserId === comment.userId && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              rows={3}
              placeholder="Edit your comment..."
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={!editContent.trim()}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.text}</p>
        )}
      </div>
    </div>
  );
}

export function CommentsThread({
  cardId,
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  currentUser,
}: CommentsThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  // Update local comments when prop changes
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    await onEditComment(commentId, content);
  };

  const handleDelete = async (commentId: string) => {
    await onDeleteComment(commentId);
    setLocalComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-semibold">Comments</h3>
        <span className="text-sm text-muted-foreground">({localComments.length})</span>
      </div>

      {/* Comments List */}
      {localComments.length > 0 ? (
        <div className="space-y-2">
          {localComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUser?.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet</p>
          <p className="text-xs">Be the first to comment</p>
        </div>
      )}

      {/* Add Comment Form */}
      <div className="flex gap-3 pt-4 border-t">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={currentUser?.image || undefined} alt={currentUser?.name || 'User'} />
          <AvatarFallback className="text-xs">
            {currentUser ? getUserInitials(currentUser.name) : '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
            rows={3}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Press Enter to submit, Shift+Enter for new line
            </p>
            <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim() || isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export types
export type { CommentsThreadProps };
