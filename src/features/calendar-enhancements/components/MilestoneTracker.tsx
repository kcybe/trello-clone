'use client';

import {
  Calendar as CalendarIcon,
  Flag,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Board, Card as CardType } from '@/types';

import { useState, useMemo, useCallback } from 'react';

import { Milestone, MilestoneProgress, MilestoneStatus } from '../types';

interface MilestoneTrackerProps {
  board: Board;
  onEditCard: (card: CardType, columnId: string) => void;
  onAddMilestone?: (milestone: Omit<Milestone, 'id'>) => void;
  onUpdateMilestone?: (milestone: Milestone) => void;
  onDeleteMilestone?: (milestoneId: string) => void;
  onCompleteMilestone?: (milestoneId: string) => void;
}

export function MilestoneTracker({
  board,
  onEditCard,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onCompleteMilestone,
}: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    date: '',
    description: '',
    color: '#3b82f6',
  });

  // Get cards for milestone
  const getMilestoneProgress = useCallback(
    (milestone: Milestone): MilestoneProgress => {
      const cards = milestone.cardIds
        .map(id => {
          for (const column of board.columns) {
            const card = column.cards.find(c => c.id === id);
            if (card) {
              return { ...card, columnId: column.id, columnName: column.title };
            }
          }
          return null;
        })
        .filter(
          (c): c is { id: string; title: string; columnId: string; columnName: string } =>
            c !== null
        );

      const completedCards = cards.filter(c => {
        // Card is considered complete if it's in a "Done" column
        const column = board.columns.find(col => col.id === c.columnId);
        return column?.title.toLowerCase() === 'done';
      }).length;

      const today = new Date();
      const isPast = new Date(milestone.date) < today && !milestone.completed;
      const isNear =
        milestone.date && !milestone.completed
          ? (new Date(milestone.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 7
          : false;

      return {
        milestoneId: milestone.id,
        totalCards: cards.length,
        completedCards,
        percentage: cards.length > 0 ? Math.round((completedCards / cards.length) * 100) : 0,
        status: {
          completed: milestone.completed,
          onTrack: !isPast && !isNear && completedCards < cards.length,
          atRisk: isNear && completedCards < cards.length,
          missed: isPast && !milestone.completed,
        },
      };
    },
    [board]
  );

  // Add milestone
  const handleAddMilestone = () => {
    if (!newMilestone.title.trim() || !newMilestone.date) return;

    const milestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title: newMilestone.title,
      date: new Date(newMilestone.date),
      description: newMilestone.description,
      color: newMilestone.color,
      completed: false,
      cardIds: [],
      boardId: board.id,
    };

    setMilestones(prev => [...prev, milestone]);
    onAddMilestone?.(milestone);
    setIsAdding(false);
    setNewMilestone({ title: '', date: '', description: '', color: '#3b82f6' });
  };

  // Delete milestone
  const handleDeleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
    onDeleteMilestone?.(id);
  };

  // Toggle completion
  const handleToggleComplete = (id: string) => {
    setMilestones(prev =>
      prev.map(m => {
        if (m.id === id) {
          const updated = { ...m, completed: !m.completed };
          onCompleteMilestone?.(id);
          return updated;
        }
        return m;
      })
    );
  };

  // Group milestones by status
  const groupedMilestones = useMemo(
    () => ({
      upcoming: milestones.filter(m => !m.completed && new Date(m.date) > new Date()),
      inProgress: milestones.filter(
        m =>
          !m.completed &&
          new Date(m.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
          new Date(m.date) <= new Date()
      ),
      completed: milestones.filter(m => m.completed),
      missed: milestones.filter(m => !m.completed && new Date(m.date) < new Date()),
    }),
    [milestones]
  );

  const getStatusBadge = (status: MilestoneStatus) => {
    if (status.completed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <Check className="h-3 w-3" />
          Completed
        </span>
      );
    }
    if (status.missed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertTriangle className="h-3 w-3" />
          Missed
        </span>
      );
    }
    if (status.atRisk) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <AlertTriangle className="h-3 w-3" />
          At Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        On Track
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Milestones</h2>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Milestone
        </Button>
      </div>

      {/* Add Milestone Form */}
      {isAdding && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Q1 Release"
                  value={newMilestone.title}
                  onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Target Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newMilestone.date}
                  onChange={e => setNewMilestone({ ...newMilestone, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Milestone description..."
                value={newMilestone.description}
                onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newMilestone.color === color ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewMilestone({ ...newMilestone, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddMilestone}
                disabled={!newMilestone.title.trim() || !newMilestone.date}
              >
                Add Milestone
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Milestone Sections */}
      {/* Missed Milestones */}
      {groupedMilestones.missed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Missed Milestones ({groupedMilestones.missed.length})
          </h3>
          <div className="space-y-2">
            {groupedMilestones.missed.map(milestone => {
              const progress = getMilestoneProgress(milestone);
              return (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  progress={progress}
                  formatDate={formatDate}
                  getDaysUntil={getDaysUntil}
                  getStatusBadge={getStatusBadge}
                  onEdit={() => onEditCard}
                  onDelete={() => handleDeleteMilestone(milestone.id)}
                  onToggleComplete={() => handleToggleComplete(milestone.id)}
                  onAddCard={() => {}}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming/In Progress */}
      {groupedMilestones.upcoming.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Upcoming ({groupedMilestones.upcoming.length})
          </h3>
          <div className="space-y-2">
            {groupedMilestones.upcoming.map(milestone => {
              const progress = getMilestoneProgress(milestone);
              return (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  progress={progress}
                  formatDate={formatDate}
                  getDaysUntil={getDaysUntil}
                  getStatusBadge={getStatusBadge}
                  onEdit={() => onEditCard}
                  onDelete={() => handleDeleteMilestone(milestone.id)}
                  onToggleComplete={() => handleToggleComplete(milestone.id)}
                  onAddCard={() => {}}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {groupedMilestones.completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-green-600 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Completed ({groupedMilestones.completed.length})
          </h3>
          <div className="space-y-2">
            {groupedMilestones.completed.map(milestone => {
              const progress = getMilestoneProgress(milestone);
              return (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  progress={progress}
                  formatDate={formatDate}
                  getDaysUntil={getDaysUntil}
                  getStatusBadge={getStatusBadge}
                  onEdit={() => onEditCard}
                  onDelete={() => handleDeleteMilestone(milestone.id)}
                  onToggleComplete={() => handleToggleComplete(milestone.id)}
                  onAddCard={() => {}}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {milestones.length === 0 && !isAdding && (
        <Card className="flex flex-col items-center justify-center py-12">
          <Flag className="h-12 w-12 text-muted-foreground mb-4" />
          <CardContent className="text-center">
            <h3 className="text-lg font-medium mb-2">No milestones yet</h3>
            <p className="text-muted-foreground mb-4">
              Create milestones to track important dates and deadlines.
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create First Milestone
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Milestone Card Component
interface MilestoneCardProps {
  milestone: Milestone;
  progress: MilestoneProgress;
  formatDate: (date: Date) => string;
  getDaysUntil: (date: Date) => number;
  getStatusBadge: (status: MilestoneStatus) => React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  onAddCard: () => void;
}

function MilestoneCard({
  milestone,
  progress,
  formatDate,
  getDaysUntil,
  getStatusBadge,
  onEdit,
  onDelete,
  onToggleComplete,
  onAddCard,
}: MilestoneCardProps) {
  const daysUntil = getDaysUntil(milestone.date);
  const isPast = daysUntil < 0;

  return (
    <Card
      className={`overflow-hidden ${isPast && !milestone.completed ? 'border-red-200 bg-red-50' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={onToggleComplete}
              className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                milestone.completed ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
              }`}
            >
              {milestone.completed && <Check className="h-3 w-3 text-white" />}
            </button>
            <div>
              <h4
                className={`font-medium ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}
              >
                {milestone.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {formatDate(milestone.date)}
                {!milestone.completed && !isPast && (
                  <span className="ml-2 text-blue-600">
                    ({daysUntil === 0 ? 'Today' : `${daysUntil} days`})
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(progress.status)}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {progress.completedCards} / {progress.totalCards} cards
            </span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{progress.percentage}% complete</p>
        </div>

        {/* Description */}
        {milestone.description && (
          <p className="mt-3 text-sm text-muted-foreground">{milestone.description}</p>
        )}

        {/* Linked Cards */}
        {milestone.cardIds.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {milestone.cardIds.length} linked card(s)
              </span>
              <Button variant="ghost" size="sm" onClick={onAddCard}>
                <Plus className="h-3 w-3 mr-1" />
                Add Card
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
