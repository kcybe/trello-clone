'use client';

import React from 'react';
import {
  X,
  Tag,
  User,
  Paperclip,
  Link2,
  CheckSquare,
  MessageCircle,
  Calendar,
  Palette,
  Edit2,
  Eye,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import { CardModalProps } from '../../types';
import { LABEL_COLORS, MEMBER_SUGGESTIONS } from '../../hooks/useCards';

export function CardModal({
  isOpen,
  editingCard,
  descTab,
  newLabelText,
  newMemberName,
  showMemberSuggestions,
  newAttachmentUrl,
  newAttachmentName,
  newChecklistTitle,
  newChecklistItem,
  newCommentAuthor,
  newCommentText,
  onClose,
  updateCardTitle,
  updateCardDescription,
  setDescTab,
  addLabel,
  removeLabel,
  setNewLabelText,
  addMember,
  removeMember,
  setNewMemberName,
  setShowMemberSuggestions,
  addAttachment,
  removeAttachment,
  setNewAttachmentUrl,
  setNewAttachmentName,
  addChecklist,
  removeChecklist,
  setNewChecklistTitle,
  addChecklistItem,
  removeChecklistItem,
  toggleChecklistItem,
  setNewChecklistItem,
  addComment,
  deleteComment,
  setNewCommentAuthor,
  setNewCommentText,
  setColor,
  setDueDate,
  getChecklistProgress,
}: CardModalProps) {
  if (!editingCard) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={editingCard.title} onChange={(e) => updateCardTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Description</label>
              <div className="flex bg-muted rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => setDescTab('edit')}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-sm transition-colors ${
                    descTab === 'edit' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Edit2 className="h-3 w-3" />
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setDescTab('preview')}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-sm transition-colors ${
                    descTab === 'preview' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
              </div>
            </div>
            {descTab === 'edit' ? (
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={6}
                value={editingCard.description}
                onChange={(e) => updateCardDescription(e.target.value)}
                placeholder="Add a description... (Markdown supported)"
              />
            ) : (
              <div className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px] prose prose-sm dark:prose-invert max-w-none">
                {editingCard.description ? (
                  <ReactMarkdown>{editingCard.description}</ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground italic">No description</span>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Supports Markdown: **bold**, *italic*, - lists, # headings, etc.
            </p>
          </div>

          {/* Labels */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Labels
            </label>
            <div className="flex flex-wrap gap-1 mt-2">
              {editingCard.labels.map((label) => (
                <span
                  key={label.id}
                  className={`${label.color} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}
                >
                  {label.text}
                  <button onClick={() => removeLabel(label.id)} className="hover:text-red-200">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="New label..."
                value={newLabelText}
                onChange={(e) => setNewLabelText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLabel();
                  }
                }}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={addLabel}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {LABEL_COLORS.map((color) => (
                <button
                  key={color.value}
                  className={`${color.value} w-6 h-6 rounded-full border-2 border-transparent hover:border-white`}
                  onClick={() => {
                    const newLabel: typeof editingCard.labels[0] = {
                      id: `label-${Date.now()}`,
                      text: newLabelText || 'New',
                      color: color.value,
                    };
                    setEditingCard({
                      ...editingCard,
                      labels: [...editingCard.labels, newLabel],
                    });
                    setNewLabelText('');
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Members */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Members
            </label>
            {editingCard.assignee && (
              <div className="flex items-center gap-2 mt-2 bg-muted rounded-md px-3 py-2">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-medium">
                  {editingCard.assignee.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm">{editingCard.assignee}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeMember}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="relative mt-2">
              <Input
                placeholder="Add member..."
                value={newMemberName}
                onChange={(e) => {
                  setNewMemberName(e.target.value);
                  setShowMemberSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMember();
                  }
                }}
                onFocus={() => setShowMemberSuggestions(true)}
                className="flex-1"
              />
              {showMemberSuggestions && newMemberName && (
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1">
                  {MEMBER_SUGGESTIONS.filter((m) =>
                    m.toLowerCase().includes(newMemberName.toLowerCase())
                  ).map((member) => (
                    <button
                      key={member}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                      onClick={() => {
                        setNewMemberName(member);
                        setShowMemberSuggestions(false);
                        setEditingCard({ ...editingCard, assignee: member });
                      }}
                    >
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-medium">
                        {member.charAt(0).toUpperCase()}
                      </div>
                      {member}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments
            </label>
            {editingCard.attachments && editingCard.attachments.length > 0 && (
              <div className="space-y-1 mt-2">
                {editingCard.attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{att.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeAttachment(att.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                placeholder="Attachment name..."
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                className="col-span-2"
              />
              <Input
                placeholder="URL..."
                value={newAttachmentUrl}
                onChange={(e) => setNewAttachmentUrl(e.target.value)}
                className="col-span-2"
              />
              <Button
                variant="outline"
                size="sm"
                className="col-span-2"
                onClick={addAttachment}
                disabled={!newAttachmentUrl.trim()}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Add Attachment
              </Button>
            </div>
          </div>

          {/* Checklists */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Checklists
            </label>
            {editingCard.checklists && editingCard.checklists.length > 0 && (
              <div className="space-y-3 mt-2">
                {editingCard.checklists.map((checklist) => (
                  <div key={checklist.id} className="bg-muted rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{checklist.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeChecklist(checklist.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {checklist.items.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {checklist.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleChecklistItem(checklist.id, item.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span
                              className={`flex-1 text-sm ${
                                item.checked ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {item.text}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => removeChecklistItem(checklist.id, item.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {getChecklistProgress(checklist) && (
                      <div className="h-1.5 bg-background rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${
                              (getChecklistProgress(checklist)!.checked /
                                getChecklistProgress(checklist)!.total) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add item..."
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addChecklistItem(checklist.id);
                          }
                        }}
                        className="flex-1 h-8"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => addChecklistItem(checklist.id)}
                        disabled={!newChecklistItem.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2">
              <Input
                placeholder="New checklist title..."
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklist();
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={addChecklist}
                disabled={!newChecklistTitle.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Checklist
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comments ({editingCard.comments?.length || 0})
            </label>

            {/* Comment list */}
            {editingCard.comments && editingCard.comments.length > 0 && (
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {editingCard.comments.map((comment) => (
                  <div key={comment.id} className="bg-muted rounded-md p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{comment.author}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => deleteComment(comment.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <div className="space-y-2 mt-2">
              <Input
                placeholder="Your name..."
                value={newCommentAuthor}
                onChange={(e) => setNewCommentAuthor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCommentAuthor.trim() && newCommentText.trim()) {
                    e.preventDefault();
                    addComment();
                  }
                }}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Write a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCommentAuthor.trim() && newCommentText.trim()) {
                      e.preventDefault();
                      addComment();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={addComment} disabled={!newCommentAuthor.trim() || !newCommentText.trim()}>
                  Post
                </Button>
              </div>
            </div>
          </div>

          {/* Card color */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Card Color
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { name: 'None', value: '' },
                { name: 'Red', value: 'bg-red-100 dark:bg-red-900/30' },
                { name: 'Orange', value: 'bg-orange-100 dark:bg-orange-900/30' },
                { name: 'Yellow', value: 'bg-yellow-100 dark:bg-yellow-900/30' },
                { name: 'Green', value: 'bg-green-100 dark:bg-green-900/30' },
                { name: 'Blue', value: 'bg-blue-100 dark:bg-blue-900/30' },
                { name: 'Purple', value: 'bg-purple-100 dark:bg-purple-900/30' },
                { name: 'Pink', value: 'bg-pink-100 dark:bg-pink-900/30' },
              ].map((color) => (
                <button
                  key={color.name}
                  onClick={() => setColor(color.value)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    editingCard.color === color.value ? 'border-primary' : 'border-transparent'
                  } ${color.value || 'bg-muted'}`}
                  title={color.name}
                >
                  {color.name === 'None' && <X className="h-4 w-4 mx-auto text-muted-foreground" />}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date
            </label>
            <Input type="date" value={editingCard.dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-2" />
            {editingCard.dueDate && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-xs text-muted-foreground"
                onClick={() => setDueDate('')}
              >
                Clear due date
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => {}}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
