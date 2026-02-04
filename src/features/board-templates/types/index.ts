export type TemplateCategory = 'kanban' | 'scrum' | 'bug-tracking' | 'marketing' | 'weekly-review';

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  columns: {
    id: string;
    name: string;
    color?: string;
  }[];
  preview?: string;
}

export interface TemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: BoardTemplate) => void;
}
