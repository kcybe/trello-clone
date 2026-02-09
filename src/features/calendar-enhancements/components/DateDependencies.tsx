'use client';

import {
  ChevronRight,
  Link2,
  Link2Off,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Board, Card as CardType } from '@/types';

import { useMemo, useState, useCallback } from 'react';

import { DateDependency, DependencyChain, DateViolation, DependencyType } from '../types';

interface DateDependenciesProps {
  board: Board;
  onEditCard: (card: CardType, columnId: string) => void;
  onAddDependency?: (sourceCardId: string, targetCardId: string, type: string) => void;
  onRemoveDependency?: (dependencyId: string) => void;
}

const DEPENDENCY_TYPES = [
  {
    value: 'finish_to_start',
    label: 'Finish to Start',
    description: 'Target starts after source finishes',
  },
  {
    value: 'start_to_start',
    label: 'Start to Start',
    description: 'Target starts after source starts',
  },
  {
    value: 'finish_to_finish',
    label: 'Finish to Finish',
    description: 'Target finishes after source finishes',
  },
  {
    value: 'start_to_finish',
    label: 'Start to Finish',
    description: 'Target finishes after source starts',
  },
] as const;

export function DateDependencies({
  board,
  onEditCard,
  onAddDependency,
  onRemoveDependency,
}: DateDependenciesProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DependencyType>('finish_to_start');

  // Get all cards with due dates
  const cardsWithDates = useMemo(() => {
    return board.columns.flatMap(column =>
      column.cards
        .filter(card => card.dueDate)
        .map(card => ({
          ...card,
          columnId: column.id,
          columnName: column.title,
          columnColor: getColumnColor(column.id),
        }))
    );
  }, [board]);

  // Extract dependencies from card due dates
  const dependencies = useMemo((): DateDependency[] => {
    const deps: DateDependency[] = [];
    const cards = cardsWithDates;

    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const cardA = cards[i];
        const cardB = cards[j];

        // Check if card B depends on card A (B's date > A's date)
        const dateA = new Date(cardA.dueDate!).getTime();
        const dateB = new Date(cardB.dueDate!).getTime();

        if (dateB > dateA) {
          deps.push({
            id: `dep-${cardA.id}-${cardB.id}`,
            sourceCardId: cardA.id,
            sourceCardTitle: cardA.title,
            targetCardId: cardB.id,
            targetCardTitle: cardB.title,
            dependencyType: 'finish_to_start',
            lagDays: Math.round((dateB - dateA) / (1000 * 60 * 60 * 24)),
            isCriticalPath: false,
          });
        }
      }
    }

    return deps;
  }, [cardsWithDates]);

  // Detect violations
  const violations = useMemo((): DateViolation[] => {
    const violations: DateViolation[] = [];
    const cardMap = new Map(cardsWithDates.map(c => [c.id, c]));

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (cardId: string, path: string[]): boolean => {
      if (visited.has(cardId)) return false;
      if (recursionStack.has(cardId)) return true;

      visited.add(cardId);
      recursionStack.add(cardId);

      const card = cardMap.get(cardId);
      if (!card) return false;

      const related = dependencies.filter(
        d => d.sourceCardId === cardId || d.targetCardId === cardId
      );

      for (const dep of related) {
        const nextId = dep.sourceCardId === cardId ? dep.targetCardId : dep.sourceCardId;
        if (hasCycle(nextId, [...path, cardId])) {
          violations.push({
            type: 'circular',
            message: `Circular dependency detected involving ${path.join(' → ')}`,
            cards: [...new Set([...path, cardId])],
            severity: 'error',
          });
          return true;
        }
      }

      recursionStack.delete(cardId);
      return false;
    };

    cardsWithDates.forEach(card => hasCycle(card.id, [card.id]));

    // Check for future start violations
    dependencies.forEach(dep => {
      const source = cardMap.get(dep.sourceCardId);
      const target = cardMap.get(dep.targetCardId);

      if (source && target) {
        const sourceDate = new Date(source.dueDate!);
        const targetDate = new Date(target.dueDate!);

        if (sourceDate > targetDate) {
          violations.push({
            type: 'future_start',
            message: `${target.title} is due before ${source.title}`,
            cards: [source.id, target.id],
            severity: 'warning',
          });
        }
      }
    });

    return violations;
  }, [cardsWithDates, dependencies]);

  // Build dependency chains
  const chains = useMemo((): DependencyChain[] => {
    const cardIds = new Set(dependencies.flatMap(d => [d.sourceCardId, d.targetCardId]));
    const visited = new Set<string>();
    const chains: DependencyChain[] = [];

    const buildChain = (startId: string): DependencyChain | null => {
      if (visited.has(startId)) return null;
      visited.add(startId);

      const chain: DependencyChain = {
        id: `chain-${startId}`,
        cards: [],
        totalDuration: 0,
        criticalPath: false,
      };

      let currentId: string | null = startId;
      while (currentId) {
        const card = cardsWithDates.find(c => c.id === currentId);
        if (!card) break;

        chain.cards.push({
          cardId: card.id,
          title: card.title,
          startDate: new Date(card.createdAt),
          endDate: new Date(card.dueDate!),
          columnId: card.columnId,
          columnName: card.columnName,
        });

        const nextDep = dependencies.find(d => d.sourceCardId === currentId);
        currentId = nextDep?.targetCardId || null;
      }

      if (chain.cards.length > 1) {
        const start = new Date(chain.cards[0].endDate!);
        const end = new Date(chain.cards[chain.cards.length - 1].endDate!);
        chain.totalDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        return chain;
      }

      return null;
    };

    cardIds.forEach(id => {
      const chain = buildChain(id);
      if (chain) chains.push(chain);
    });

    return chains;
  }, [cardsWithDates, dependencies]);

  // Add dependency
  const handleAddDependency = () => {
    if (!selectedSource) return;

    const targetCards = cardsWithDates.filter(
      c =>
        c.id !== selectedSource &&
        !dependencies.some(d => d.sourceCardId === selectedSource && d.targetCardId === c.id)
    );

    if (targetCards.length === 0) return;

    // Just use the first available target for demo
    const target = targetCards[0];
    onAddDependency?.(selectedSource, target.id, selectedType);
  };

  // Get column color
  function getColumnColor(columnId: string): string {
    const colors = [
      '#3b82f6',
      '#8b5cf6',
      '#f59e0b',
      '#22c55e',
      '#ef4444',
      '#ec4899',
      '#14b8a6',
      '#f97316',
    ];
    const hash = columnId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Date Dependencies</h2>
        </div>
        {violations.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm">
            <AlertTriangle className="h-4 w-4" />
            {violations.length} issue(s) detected
          </div>
        )}
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {violations.map((violation, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded ${
                    violation.severity === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{violation.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Dependency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Dependency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Source Card</Label>
              <select
                className="w-full p-2 border rounded bg-background"
                value={selectedSource || ''}
                onChange={e => setSelectedSource(e.target.value)}
              >
                <option value="">Select card...</option>
                {cardsWithDates.map(card => (
                  <option key={card.id} value={card.id}>
                    {card.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Dependency Type</Label>
              <select
                className="w-full p-2 border rounded bg-background"
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as DependencyType)}
              >
                {DEPENDENCY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleAddDependency} disabled={!selectedSource}>
                <Link2 className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependency Chains */}
      {chains.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Dependency Chains ({chains.length})
          </h3>
          {chains.map((chain, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {chain.cards.map((card, cardIdx) => (
                    <div key={card.cardId} className="flex items-center">
                      <div
                        className="flex-shrink-0 p-2 rounded border cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          const column = board.columns.find(c => c.id === card.columnId);
                          const cardObj = column?.cards.find(c => c.id === card.cardId);
                          if (cardObj) onEditCard(cardObj, card.columnId);
                        }}
                      >
                        <div className="text-sm font-medium">{card.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(card.endDate!)}
                        </div>
                      </div>
                      {cardIdx < chain.cards.length - 1 && (
                        <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex items-center justify-between text-sm text-muted-foreground">
                  <span>{chain.cards.length} cards linked</span>
                  <span>{chain.totalDuration} days total</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Dependencies */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          All Dependencies ({dependencies.length})
        </h3>
        {dependencies.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-8">
            <Link2Off className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No dependencies detected</p>
            <p className="text-xs text-muted-foreground">
              Dependencies are automatically detected when cards have due dates
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {dependencies.map((dep, idx) => {
              const source = cardsWithDates.find(c => c.id === dep.sourceCardId);
              const target = cardsWithDates.find(c => c.id === dep.targetCardId);

              return (
                <Card key={idx} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: source?.columnColor }}
                      />
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm cursor-pointer hover:underline"
                          onClick={() => {
                            if (source) onEditCard(source, source.columnId);
                          }}
                        >
                          {dep.sourceCardTitle}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span
                          className="text-sm cursor-pointer hover:underline"
                          onClick={() => {
                            if (target) onEditCard(target, target.columnId);
                          }}
                        >
                          {dep.targetCardTitle}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{dep.lagDays} days lag</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveDependency?.(dep.id)}
                      >
                        <Link2Off className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
