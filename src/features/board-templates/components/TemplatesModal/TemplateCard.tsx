import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

import { BoardTemplate } from '../../types';

interface TemplateCardProps {
  template: BoardTemplate;
  onSelect: (template: BoardTemplate) => void;
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{template.icon}</span>
          <h3 className="font-semibold text-lg">{template.name}</h3>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
        <div className="flex gap-1 flex-wrap">
          {template.columns.slice(0, 4).map(column => (
            <span
              key={column.id}
              className="inline-block px-2 py-1 text-xs rounded bg-secondary text-secondary-foreground"
            >
              {column.name}
            </span>
          ))}
          {template.columns.length > 4 && (
            <span className="inline-block px-2 py-1 text-xs rounded bg-secondary text-secondary-foreground">
              +{template.columns.length - 4} more
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onSelect(template)} className="w-full">
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
}
