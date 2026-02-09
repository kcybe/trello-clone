// Card relation types
export type RelationType = 'blocks' | 'blocked_by' | 'depends_on' | 'related_to';

export interface CardRelation {
  id: string;
  sourceCardId: string;
  targetCardId: string;
  relationType: RelationType;
  createdAt: string;
  updatedAt: string;
  sourceCard?: CardSummary;
  targetCard?: CardSummary;
}

export interface CardSummary {
  id: string;
  title: string;
  boardId: string;
  boardName: string;
  columnId: string;
  columnName: string;
}

export interface CreateCardRelationRequest {
  targetCardId: string;
  relationType: RelationType;
}

export interface CardRelationsState {
  relations: CardRelation[];
  isLoading: boolean;
  error: string | null;
}

export const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  blocks: 'Blocks',
  blocked_by: 'Blocked by',
  depends_on: 'Depends on',
  related_to: 'Related to',
};

export const RELATION_TYPE_DESCRIPTIONS: Record<RelationType, string> = {
  blocks: 'This card is blocking the target card',
  blocked_by: 'This card is blocked by the target card',
  depends_on: 'This card depends on the target card',
  related_to: 'This card is related to the target card',
};
