import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Test the card relations types
describe('Card Relations Types', () => {
  describe('RelationType', () => {
    it('should allow all relation type values', () => {
      type RelationType = 'blocks' | 'blocked_by' | 'depends_on' | 'related_to';

      const blocks: RelationType = 'blocks';
      const blockedBy: RelationType = 'blocked_by';
      const dependsOn: RelationType = 'depends_on';
      const relatedTo: RelationType = 'related_to';

      expect(blocks).toBe('blocks');
      expect(blockedBy).toBe('blocked_by');
      expect(dependsOn).toBe('depends_on');
      expect(relatedTo).toBe('related_to');
    });
  });

  describe('CardRelation', () => {
    it('should have correct structure', () => {
      type CardRelation = {
        id: string;
        sourceCardId: string;
        targetCardId: string;
        relationType: 'blocks' | 'blocked_by' | 'depends_on' | 'related_to';
        createdAt: string;
        updatedAt: string;
        sourceCard?: CardSummary;
        targetCard?: CardSummary;
      };

      type CardSummary = {
        id: string;
        title: string;
        boardId: string;
        boardName: string;
        columnId: string;
        columnName: string;
      };

      const relation: CardRelation = {
        id: 'rel-123',
        sourceCardId: 'card-1',
        targetCardId: 'card-2',
        relationType: 'blocks',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceCard: {
          id: 'card-1',
          title: 'Card 1',
          boardId: 'board-1',
          boardName: 'Board 1',
          columnId: 'col-1',
          columnName: 'To Do',
        },
        targetCard: {
          id: 'card-2',
          title: 'Card 2',
          boardId: 'board-1',
          boardName: 'Board 1',
          columnId: 'col-2',
          columnName: 'In Progress',
        },
      };

      expect(relation.id).toBe('rel-123');
      expect(relation.relationType).toBe('blocks');
      expect(relation.sourceCard?.title).toBe('Card 1');
      expect(relation.targetCard?.title).toBe('Card 2');
    });
  });

  describe('CreateCardRelationRequest', () => {
    it('should have correct structure', () => {
      type CreateCardRelationRequest = {
        targetCardId: string;
        relationType: 'blocks' | 'blocked_by' | 'depends_on' | 'related_to';
      };

      const request: CreateCardRelationRequest = {
        targetCardId: 'card-2',
        relationType: 'depends_on',
      };

      expect(request.targetCardId).toBe('card-2');
      expect(request.relationType).toBe('depends_on');
    });
  });
});

// Test relation type labels and descriptions
describe('Relation Type Labels and Descriptions', () => {
  const RELATION_TYPE_LABELS = {
    blocks: 'Blocks',
    blocked_by: 'Blocked by',
    depends_on: 'Depends on',
    related_to: 'Related to',
  };

  const RELATION_TYPE_DESCRIPTIONS = {
    blocks: 'This card is blocking the target card',
    blocked_by: 'This card is blocked by the target card',
    depends_on: 'This card depends on the target card',
    related_to: 'This card is related to the target card',
  };

  it('should have labels for all relation types', () => {
    expect(Object.keys(RELATION_TYPE_LABELS)).toHaveLength(4);
    expect(RELATION_TYPE_LABELS.blocks).toBe('Blocks');
    expect(RELATION_TYPE_LABELS.blocked_by).toBe('Blocked by');
    expect(RELATION_TYPE_LABELS.depends_on).toBe('Depends on');
    expect(RELATION_TYPE_LABELS.related_to).toBe('Related to');
  });

  it('should have descriptions for all relation types', () => {
    expect(Object.keys(RELATION_TYPE_DESCRIPTIONS)).toHaveLength(4);
    expect(RELATION_TYPE_DESCRIPTIONS.blocks.length).toBeGreaterThan(0);
    expect(RELATION_TYPE_DESCRIPTIONS.blocked_by.length).toBeGreaterThan(0);
    expect(RELATION_TYPE_DESCRIPTIONS.depends_on.length).toBeGreaterThan(0);
    expect(RELATION_TYPE_DESCRIPTIONS.related_to.length).toBeGreaterThan(0);
  });
});

// Test relation filtering helpers
describe('Relation Filtering Helpers', () => {
  type CardRelation = {
    id: string;
    sourceCardId: string;
    targetCardId: string;
    relationType: 'blocks' | 'blocked_by' | 'depends_on' | 'related_to';
  };

  const mockRelations: CardRelation[] = [
    { id: 'rel-1', sourceCardId: 'card-1', targetCardId: 'card-2', relationType: 'blocks' },
    { id: 'rel-2', sourceCardId: 'card-3', targetCardId: 'card-1', relationType: 'blocks' },
    { id: 'rel-3', sourceCardId: 'card-1', targetCardId: 'card-4', relationType: 'depends_on' },
    { id: 'rel-4', sourceCardId: 'card-5', targetCardId: 'card-1', relationType: 'related_to' },
    { id: 'rel-5', sourceCardId: 'card-1', targetCardId: 'card-6', relationType: 'related_to' },
    { id: 'rel-6', sourceCardId: 'card-2', targetCardId: 'card-1', relationType: 'blocks' },
  ];

  const getBlocking = (cardId: string) =>
    mockRelations.filter((r) => r.relationType === 'blocks' && r.sourceCardId === cardId);

  const getBlockedBy = (cardId: string) =>
    mockRelations.filter((r) => r.relationType === 'blocks' && r.targetCardId === cardId);

  const getDependsOn = (cardId: string) =>
    mockRelations.filter((r) => r.relationType === 'depends_on' && r.sourceCardId === cardId);

  const getRelatedTo = (cardId: string) =>
    mockRelations.filter(
      (r) => r.relationType === 'related_to' && (r.sourceCardId === cardId || r.targetCardId === cardId)
    );

  it('should find cards that card-1 is blocking', () => {
    const blocking = getBlocking('card-1');
    expect(blocking).toHaveLength(1);
    expect(blocking[0].targetCardId).toBe('card-2');
  });

  it('should find cards that are blocking card-1', () => {
    const blockedBy = getBlockedBy('card-1');
    expect(blockedBy).toHaveLength(2); // card-3 and card-2
    expect(blockedBy.map(r => r.sourceCardId)).toContain('card-3');
    expect(blockedBy.map(r => r.sourceCardId)).toContain('card-2');
  });

  it('should find cards that card-1 depends on', () => {
    const dependsOn = getDependsOn('card-1');
    expect(dependsOn).toHaveLength(1);
    expect(dependsOn[0].sourceCardId).toBe('card-1');
    expect(dependsOn[0].targetCardId).toBe('card-4');
  });

  it('should find cards related to card-1', () => {
    const relatedTo = getRelatedTo('card-1');
    expect(relatedTo).toHaveLength(2);
  });

  it('should determine if card is blocked', () => {
    const card1Blocked = getBlockedBy('card-1').length > 0;
    const card2Blocked = getBlockedBy('card-2').length > 0;
    const card4Blocked = getBlockedBy('card-4').length > 0;

    expect(card1Blocked).toBe(true); // card-1 is blocked by card-3 and card-2
    expect(card2Blocked).toBe(true); // card-2 is blocked by rel-6
    expect(card4Blocked).toBe(false); // card-4 is not blocked
  });
});

// Test self-reference prevention
describe('Self-Reference Prevention', () => {
  it('should detect self-reference', () => {
    const sourceCardId = 'card-1';
    const targetCardId = 'card-1';

    const isSelfReference = sourceCardId === targetCardId;
    expect(isSelfReference).toBe(true);
  });

  it('should allow different cards', () => {
    const sourceCardId = 'card-1';
    const targetCardId = 'card-2';

    const isSelfReference = sourceCardId === targetCardId;
    expect(isSelfReference).toBe(false);
  });
});

// Test relation validation helpers
describe('Relation Validation Helpers', () => {
  const VALID_RELATION_TYPES = ['blocks', 'blocked_by', 'depends_on', 'related_to'];

  function isValidRelationType(type: string): type is 'blocks' | 'blocked_by' | 'depends_on' | 'related_to' {
    return VALID_RELATION_TYPES.includes(type);
  }

  it('should validate correct relation types', () => {
    expect(isValidRelationType('blocks')).toBe(true);
    expect(isValidRelationType('blocked_by')).toBe(true);
    expect(isValidRelationType('depends_on')).toBe(true);
    expect(isValidRelationType('related_to')).toBe(true);
  });

  it('should reject invalid relation types', () => {
    expect(isValidRelationType('invalid')).toBe(false);
    expect(isValidRelationType('')).toBe(false);
    expect(isValidRelationType('BLOCKS')).toBe(false);
  });
});

// Test relation cycle detection (basic)
describe('Relation Cycle Detection', () => {
  type CardRelation = {
    sourceCardId: string;
    targetCardId: string;
  };

  // Build adjacency list from relations
  function buildGraph(relations: CardRelation[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    relations.forEach((r) => {
      if (!graph.has(r.sourceCardId)) {
        graph.set(r.sourceCardId, []);
      }
      graph.get(r.sourceCardId)!.push(r.targetCardId);
    });
    return graph;
  }

  // Check if adding a relation would create a cycle
  function wouldCreateCycle(
    relations: CardRelation[],
    newSource: string,
    newTarget: string
  ): boolean {
    if (newSource === newTarget) return true; // Self-reference

    const graph = buildGraph(relations);
    const visited = new Set<string>();
    const queue = [newTarget];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === newSource) return true; // Path back to source
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = graph.get(current) || [];
      queue.push(...neighbors);
    }

    return false;
  }

  it('should detect self-reference cycle', () => {
    const relations: CardRelation[] = [];
    expect(wouldCreateCycle(relations, 'card-1', 'card-1')).toBe(true);
  });

  it('should detect cycle in chain', () => {
    const relations: CardRelation[] = [
      { sourceCardId: 'card-1', targetCardId: 'card-2' },
      { sourceCardId: 'card-2', targetCardId: 'card-3' },
    ];
    // Adding card-3 -> card-1 would create a cycle
    expect(wouldCreateCycle(relations, 'card-3', 'card-1')).toBe(true);
  });

  it('should allow valid relation without cycle', () => {
    const relations: CardRelation[] = [
      { sourceCardId: 'card-1', targetCardId: 'card-2' },
      { sourceCardId: 'card-2', targetCardId: 'card-3' },
    ];
    // Adding card-1 -> card-4 is fine (no path back to card-1)
    expect(wouldCreateCycle(relations, 'card-1', 'card-4')).toBe(false);
    // Adding card-3 -> card-4 is fine
    expect(wouldCreateCycle(relations, 'card-3', 'card-4')).toBe(false);
  });
});
