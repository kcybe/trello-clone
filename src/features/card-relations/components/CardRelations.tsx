'use client';

import { Link, Unlink, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useState } from 'react';

import {
  CardRelation,
  RelationType,
  RELATION_TYPE_LABELS,
  RELATION_TYPE_DESCRIPTIONS,
} from '../types';

interface CardRelationsProps {
  cardId: string;
  cardTitle: string;
  relations: CardRelation[];
  isLoading: boolean;
  error: string | null;
  onAddRelation: (targetCardId: string, relationType: RelationType) => Promise<void>;
  onRemoveRelation: (targetCardId: string) => Promise<void>;
  onOpenCard: (cardId: string) => void;
}

export function CardRelations({
  cardId,
  cardTitle,
  relations,
  isLoading,
  error,
  onAddRelation,
  onRemoveRelation,
  onOpenCard,
}: CardRelationsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetCardId, setTargetCardId] = useState('');
  const [relationType, setRelationType] = useState<RelationType>('blocks');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddRelation = async () => {
    if (!targetCardId.trim()) return;

    setIsAdding(true);
    try {
      await onAddRelation(targetCardId, relationType);
      setTargetCardId('');
      setIsDialogOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  const blocking = relations.filter(r => r.relationType === 'blocks' && r.sourceCardId === cardId);
  const blockedBy = relations.filter(r => r.relationType === 'blocks' && r.targetCardId === cardId);
  const dependsOn = relations.filter(
    r => r.relationType === 'depends_on' && r.targetCardId === cardId
  );
  const relatedTo = relations.filter(
    r => r.relationType === 'related_to' && (r.sourceCardId === cardId || r.targetCardId === cardId)
  );

  const isBlocked = blockedBy.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Link className="h-4 w-4" />
          Card Relations
        </Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          disabled={isLoading}
        >
          <Link className="h-4 w-4 mr-1" />
          Add Relation
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Blocked indicator */}
      {isBlocked && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          This card is blocked by {blockedBy.length} card(s)
        </div>
      )}

      {/* Blocking */}
      {blocking.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Blocks</h4>
          <div className="space-y-1">
            {blocking.map(relation => (
              <RelationCard
                key={relation.id}
                relation={relation}
                currentCardId={cardId}
                onRemove={() => onRemoveRelation(relation.targetCardId)}
                onOpenCard={onOpenCard}
              />
            ))}
          </div>
        </div>
      )}

      {/* Blocked By */}
      {blockedBy.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Blocked By</h4>
          <div className="space-y-1">
            {blockedBy.map(relation => (
              <RelationCard
                key={relation.id}
                relation={relation}
                currentCardId={cardId}
                onRemove={() => onRemoveRelation(relation.sourceCardId)}
                onOpenCard={onOpenCard}
                reverse
              />
            ))}
          </div>
        </div>
      )}

      {/* Depends On */}
      {dependsOn.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Depends On</h4>
          <div className="space-y-1">
            {dependsOn.map(relation => (
              <RelationCard
                key={relation.id}
                relation={relation}
                currentCardId={cardId}
                onRemove={() => onRemoveRelation(relation.sourceCardId)}
                onOpenCard={onOpenCard}
              />
            ))}
          </div>
        </div>
      )}

      {/* Related To */}
      {relatedTo.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Related To</h4>
          <div className="space-y-1">
            {relatedTo.map(relation => (
              <RelationCard
                key={relation.id}
                relation={relation}
                currentCardId={cardId}
                onRemove={() =>
                  onRemoveRelation(
                    relation.sourceCardId === cardId ? relation.targetCardId : relation.sourceCardId
                  )
                }
                onOpenCard={onOpenCard}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {relations.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No relations yet. Link this card to other cards.
        </p>
      )}

      {/* Add Relation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Card Relation</DialogTitle>
            <DialogDescription>
              Link this card to another card to show dependencies or relationships.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Card ID</Label>
              <Input
                placeholder="Enter target card ID"
                value={targetCardId}
                onChange={e => setTargetCardId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Relation Type</Label>
              <Select value={relationType} onValueChange={v => setRelationType(v as RelationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RELATION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">
                          {RELATION_TYPE_DESCRIPTIONS[value as RelationType]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isAdding}>
                Cancel
              </Button>
              <Button onClick={handleAddRelation} disabled={!targetCardId.trim() || isAdding}>
                {isAdding ? 'Adding...' : 'Add Relation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RelationCardProps {
  relation: CardRelation;
  currentCardId: string;
  onRemove: () => void;
  onOpenCard: (cardId: string) => void;
  reverse?: boolean;
}

function RelationCard({
  relation,
  currentCardId,
  onRemove,
  onOpenCard,
  reverse,
}: RelationCardProps) {
  const isSource = relation.sourceCardId === currentCardId;
  const otherCard = isSource ? relation.targetCard! : relation.sourceCard!;

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
      {reverse ? (
        <>
          <ArrowRight className="h-4 w-4 text-muted-foreground rotate-180" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenCard(otherCard.id)}
            className="flex-1 justify-start h-auto py-1 px-2"
          >
            <span className="truncate">{otherCard.title}</span>
            <span className="text-xs text-muted-foreground ml-2">({otherCard.boardName})</span>
          </Button>
        </>
      ) : (
        <>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenCard(otherCard.id)}
            className="flex-1 justify-start h-auto py-1 px-2"
          >
            <span className="truncate">{otherCard.title}</span>
            <span className="text-xs text-muted-foreground ml-2">({otherCard.boardName})</span>
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Unlink className="h-3 w-3" />
      </Button>
    </div>
  );
}
