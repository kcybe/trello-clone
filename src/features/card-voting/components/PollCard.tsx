'use client';

import { Poll, Trash2, Lock, Unlock, Plus, X, BarChart3, Check, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';

import { useState, useMemo } from 'react';

import { usePolls } from '../hooks/usePolls';

interface PollCardProps {
  poll: Poll;
  onVote?: (optionIds: string[]) => void;
  onClose?: () => void;
  onReopen?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function PollCard({
  poll,
  onVote,
  onClose,
  onReopen,
  onDelete,
  compact = false,
}: PollCardProps) {
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate results
  const results = useMemo(() => {
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

    return poll.options.map(opt => ({
      ...opt,
      percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
      isLeading: false,
    }));
  }, [poll]);

  // Find leading option
  const maxVotes = Math.max(...results.map(r => r.voteCount));
  results.forEach(r => {
    if (r.voteCount === maxVotes && maxVotes > 0) {
      r.isLeading = true;
    }
  });

  // Check if user has voted
  const userVotedOptions = poll.options
    .filter(opt => opt.votes.some(v => v.userId === user?.id))
    .map(opt => opt.id);

  const canVote = !poll.isClosed && !poll.endsAt;

  const handleOptionSelect = (optionId: string) => {
    if (!canVote || poll.isClosed) return;

    if (poll.allowMultiple) {
      setSelectedOptions(prev =>
        prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) return;

    setIsSubmitting(true);
    try {
      await onVote?.(selectedOptions);
      setSelectedOptions([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    return 'Less than an hour left';
  };

  if (compact) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{poll.question}</CardTitle>
            {poll.isClosed && <Lock className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.map(result => (
            <div key={result.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span
                  className={cn('truncate', userVotedOptions.includes(result.id) && 'font-medium')}
                >
                  {result.text}
                  {userVotedOptions.includes(result.id) && (
                    <Check className="inline h-3 w-3 ml-1 text-primary" />
                  )}
                </span>
                <span className="text-muted-foreground">{result.percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full bg-primary transition-all',
                    result.isLeading && 'bg-primary',
                    poll.isClosed && 'bg-muted-foreground/50'
                  )}
                  style={{ width: `${result.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{poll.question}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>{poll.options.reduce((sum, opt) => sum + opt.voteCount, 0)} votes</span>
              {poll.allowMultiple && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Multiple choice</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {poll.isClosed ? (
              <Button variant="ghost" size="icon" onClick={onReopen} className="h-8 w-8">
                <Unlock className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <Lock className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Poll ends warning */}
        {poll.endsAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTimeRemaining(poll.endsAt)}</span>
          </div>
        )}

        {/* Options */}
        {poll.options.map(option => {
          const isSelected = selectedOptions.includes(option.id);
          const hasUserVoted = userVotedOptions.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              disabled={!canVote || poll.isClosed}
              className={cn(
                'w-full p-3 rounded-lg border text-left transition-all',
                isSelected && 'border-primary bg-primary/5',
                hasUserVoted && !isSelected && 'border-green-500 bg-green-500/5',
                (!canVote || poll.isClosed) && 'cursor-default opacity-70'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      isSelected && 'border-primary bg-primary text-primary-foreground',
                      hasUserVoted && !isSelected && 'border-green-500 bg-green-500 text-white',
                      !isSelected && !hasUserVoted && 'border-muted-foreground'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    {hasUserVoted && !isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <span className="font-medium">{option.text}</span>
                </div>
                <span className="text-sm text-muted-foreground">{option.voteCount} votes</span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full bg-primary transition-all',
                    poll.isClosed && 'bg-muted-foreground/50'
                  )}
                  style={{ width: `${results.find(r => r.id === option.id)?.percentage || 0}%` }}
                />
              </div>
            </button>
          );
        })}

        {/* Vote button */}
        {canVote && !poll.isClosed && selectedOptions.length > 0 && (
          <Button onClick={handleVote} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Voting...' : `Vote (${selectedOptions.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Poll creation dialog
interface CreatePollDialogProps {
  cardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPollCreated: (poll: Poll) => void;
}

export function CreatePollDialog({
  cardId,
  open,
  onOpenChange,
  onPollCreated,
}: CreatePollDialogProps) {
  const { user } = useAuth();
  const { createPoll, isLoading } = usePolls(cardId);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [endsAt, setEndsAt] = useState('');

  const handleAddOption = () => {
    setOptions(prev => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions(prev => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const handleSubmit = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;

    const poll = await createPoll({
      question: question.trim(),
      options: validOptions,
      allowMultiple,
      endsAt: endsAt || undefined,
    });

    if (poll) {
      onPollCreated(poll);
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setAllowMultiple(false);
      setEndsAt('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              placeholder="What would you like to ask?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={e => handleOptionChange(index, e.target.value)}
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddOption} className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </Button>
          </div>

          {/* Settings */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={e => setAllowMultiple(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Allow multiple choices</span>
            </label>

            <div className="space-y-2">
              <Label htmlFor="endsAt">End Date (optional)</Label>
              <Input
                id="endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={e => setEndsAt(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !question.trim() || options.filter(o => o.trim()).length < 2}
          >
            {isLoading ? 'Creating...' : 'Create Poll'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
