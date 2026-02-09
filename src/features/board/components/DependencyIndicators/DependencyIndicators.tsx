'use client';

import { Link2, ArrowUp, ArrowDown, GitFork } from 'lucide-react';

import { cn } from '@/lib/utils';
import { CardRelation, RelationType } from '@/types';

const RELATION_TYPE_CONFIG = {
  blocks: {
    icon: ArrowUp,
    label: 'Blocks',
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'This card is blocking',
  },
  blocked_by: {
    icon: ArrowDown,
    label: 'Blocked by',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'This card is blocked by',
  },
  depends_on: {
    icon: GitFork,
    label: 'Depends on',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    description: 'This card depends on',
  },
  related_to: {
    icon: Link2,
    label: 'Related to',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Related to',
  },
};

interface DependencyBadgeProps {
  relation: CardRelation;
  compact?: boolean;
}

export function DependencyBadge({ relation, compact = false }: DependencyBadgeProps) {
  const config = RELATION_TYPE_CONFIG[relation.relationType];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs rounded-full px-2 py-0.5',
        config.bgColor,
        config.color
      )}
      title={config.description}
    >
      <Icon className="h-3 w-3" />
      {!compact && (
        <span className="truncate max-w-[100px]">
          {relation.targetCard?.title || 'Unknown card'}
        </span>
      )}
    </div>
  );
}

interface DependencyIndicatorsProps {
  relations: CardRelation[];
  compact?: boolean;
  maxDisplay?: number;
}

export function DependencyIndicators({
  relations,
  compact = false,
  maxDisplay = 3,
}: DependencyIndicatorsProps) {
  if (!relations || relations.length === 0) {
    return null;
  }

  const blocking = relations.filter(r => r.relationType === 'blocks');
  const blockedBy = relations.filter(r => r.relationType === 'blocked_by');
  const dependsOn = relations.filter(r => r.relationType === 'depends_on');
  const related = relations.filter(r => r.relationType === 'related_to');

  const displayRelations = [
    ...blocking.slice(0, maxDisplay),
    ...blockedBy.slice(0, maxDisplay),
    ...dependsOn.slice(0, maxDisplay),
    ...related.slice(0, maxDisplay),
  ].slice(0, maxDisplay);

  const hasMore =
    blocking.length + blockedBy.length + dependsOn.length + related.length > maxDisplay;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {displayRelations.map(relation => (
        <DependencyBadge key={relation.id} relation={relation} compact={compact} />
      ))}
      {hasMore && (
        <span className="text-xs text-muted-foreground self-center">
          +{blocking.length + blockedBy.length + dependsOn.length + related.length - maxDisplay}
        </span>
      )}
    </div>
  );
}

interface DependencyStatsProps {
  relations: CardRelation[];
}

export function DependencyStats({ relations }: DependencyStatsProps) {
  if (!relations || relations.length === 0) {
    return null;
  }

  const blocking = relations.filter(r => r.relationType === 'blocks').length;
  const blockedBy = relations.filter(r => r.relationType === 'blocked_by').length;
  const dependsOn = relations.filter(r => r.relationType === 'depends_on').length;
  const related = relations.filter(r => r.relationType === 'related_to').length;

  const stats = [];
  if (blocking > 0) stats.push(`${blocking} blocking`);
  if (blockedBy > 0) stats.push(`${blockedBy} blocked`);
  if (dependsOn > 0) stats.push(`${dependsOn} depends`);
  if (related > 0) stats.push(`${related} related`);

  if (stats.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
      <GitFork className="h-3 w-3" />
      <span>{stats.join(', ')}</span>
    </div>
  );
}

export function isCardBlocked(relations: CardRelation[]): boolean {
  return relations.some(r => r.relationType === 'blocked_by');
}

export function isCardBlocking(relations: CardRelation[]): boolean {
  return relations.some(r => r.relationType === 'blocks');
}
