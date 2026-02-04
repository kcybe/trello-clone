import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TemplatesModalProps, BoardTemplate, TemplateCategory } from '../../types';
import { TemplateCard } from './TemplateCard';

const TEMPLATES: BoardTemplate[] = [
  {
    id: 'kanban-basic',
    name: 'Kanban Board',
    description: 'A classic Kanban board for managing work items with customizable columns.',
    category: 'kanban',
    icon: '📋',
    columns: [
      { id: 'backlog', name: 'Backlog', color: '#6b7280' },
      { id: 'todo', name: 'To Do', color: '#3b82f6' },
      { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
      { id: 'review', name: 'Review', color: '#8b5cf6' },
      { id: 'done', name: 'Done', color: '#22c55e' },
    ],
  },
  {
    id: 'scrum-sprint',
    name: 'Scrum Sprint',
    description: 'Sprint planning and tracking with Scrum methodology workflows.',
    category: 'scrum',
    icon: '🏃',
    columns: [
      { id: 'product-backlog', name: 'Product Backlog', color: '#64748b' },
      { id: 'sprint-backlog', name: 'Sprint Backlog', color: '#3b82f6' },
      { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
      { id: 'testing', name: 'Testing', color: '#8b5cf6' },
      { id: 'done', name: 'Done', color: '#22c55e' },
    ],
  },
  {
    id: 'bug-tracking',
    name: 'Bug Tracking',
    description: 'Track and manage software bugs and issues through resolution.',
    category: 'bug-tracking',
    icon: '🐛',
    columns: [
      { id: 'new', name: 'New', color: '#64748b' },
      { id: 'confirmed', name: 'Confirmed', color: '#3b82f6' },
      { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
      { id: 'fixed', name: 'Fixed', color: '#22c55e' },
      { id: 'verified', name: 'Verified', color: '#10b981' },
      { id: 'closed', name: 'Closed', color: '#6b7280' },
    ],
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Plan and execute marketing campaigns with approval workflows.',
    category: 'marketing',
    icon: '📢',
    columns: [
      { id: 'ideas', name: 'Ideas', color: '#8b5cf6' },
      { id: 'planning', name: 'Planning', color: '#3b82f6' },
      { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
      { id: 'review', name: 'Review', color: '#ec4899' },
      { id: 'approved', name: 'Approved', color: '#22c55e' },
      { id: 'live', name: 'Live', color: '#14b8a6' },
    ],
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Weekly planning and reflection board for personal productivity.',
    category: 'weekly-review',
    icon: '📅',
    columns: [
      { id: 'this-week', name: 'This Week', color: '#3b82f6' },
      { id: 'in-progress', name: 'In Progress', color: '#f59e0b' },
      { id: 'completed', name: 'Completed', color: '#22c55e' },
      { id: 'next-week', name: 'Next Week', color: '#64748b' },
      { id: 'notes', name: 'Notes', color: '#8b5cf6' },
    ],
  },
];

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  kanban: 'Kanban',
  scrum: 'Scrum',
  'bug-tracking': 'Bug Tracking',
  marketing: 'Marketing',
  'weekly-review': 'Weekly Review',
};

export function TemplatesModal({ open, onOpenChange, onSelectTemplate }: TemplatesModalProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');

  const filteredTemplates = activeCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  const categories: (TemplateCategory | 'all')[] = [
    'all',
    'kanban',
    'scrum',
    'bug-tracking',
    'marketing',
    'weekly-review',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category)}
            >
              {category === 'all' ? 'All' : CATEGORY_LABELS[category as TemplateCategory]}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={(t) => {
                onSelectTemplate(t);
                onOpenChange(false);
              }}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No templates found for this category.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
