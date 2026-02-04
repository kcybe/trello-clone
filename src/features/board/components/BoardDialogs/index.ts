'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS: Record<string, string> = {
  n: 'New card',
  f: 'Search',
  '/': 'Focus search',
  Escape: 'Close dialog',
  ArrowUp: 'Navigate up',
  ArrowDown: 'Navigate down',
};

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="bg-background rounded-lg p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {Object.entries(SHORTCUTS).map(([key, desc]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AddColumnDialogProps {
  newColumnTitle: string;
  onSetNewColumnTitle: (title: string) => void;
  onAddColumn: (title: string) => void;
  onClear: () => void;
}

export function AddColumnDialog({
  newColumnTitle,
  onSetNewColumnTitle,
  onAddColumn,
  onClear,
}: AddColumnDialogProps) {
  return (
    <div className="flex-shrink-0 w-72">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Plus className="h-4 w-4 mr-2" />
            Add column
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Column</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Column title..."
            value={newColumnTitle}
            onChange={(e) => onSetNewColumnTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddColumn(newColumnTitle)}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClear}>
              Cancel
            </Button>
            <Button onClick={() => onAddColumn(newColumnTitle)}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
