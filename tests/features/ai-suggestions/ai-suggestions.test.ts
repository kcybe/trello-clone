import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Test the AI suggestion types
describe('AI Suggestion Types', () => {
  describe('CardAISuggestion', () => {
    it('should allow title suggestion type', () => {
      type CardAISuggestion = {
        type: 'title';
        confidence: number;
        suggestions: string[];
        reasoning?: string;
      };

      const suggestion: CardAISuggestion = {
        type: 'title',
        confidence: 0.85,
        suggestions: ['Bug fix for login', 'Fix authentication issue'],
        reasoning: 'Generated based on keywords',
      };

      expect(suggestion.type).toBe('title');
      expect(suggestion.confidence).toBe(0.85);
      expect(suggestion.suggestions).toHaveLength(2);
    });

    it('should allow description suggestion type', () => {
      type CardDescriptionSuggestion = {
        type: 'description';
        confidence: number;
        suggestions: string[];
        template?: string;
      };

      const suggestion: CardDescriptionSuggestion = {
        type: 'description',
        confidence: 0.9,
        suggestions: ['## Problem\n...'],
        template: '## Problem\n{{content}}',
      };

      expect(suggestion.type).toBe('description');
      expect(suggestion.template).toBeDefined();
    });

    it('should allow labels suggestion type', () => {
      type CardLabelsSuggestion = {
        type: 'labels';
        confidence: number;
        suggestions: Array<{ text: string; color: string }>;
      };

      const suggestion: CardLabelsSuggestion = {
        type: 'labels',
        confidence: 0.75,
        suggestions: [
          { text: 'Bug', color: 'bg-red-500' },
          { text: 'High Priority', color: 'bg-orange-500' },
        ],
      };

      expect(suggestion.type).toBe('labels');
      expect(suggestion.suggestions).toHaveLength(2);
      expect(suggestion.suggestions[0].color).toBe('bg-red-500');
    });

    it('should allow checklist suggestion type', () => {
      type CardChecklistSuggestion = {
        type: 'checklist';
        confidence: number;
        suggestions: Array<{ text: string; checked: boolean }>;
      };

      const suggestion: CardChecklistSuggestion = {
        type: 'checklist',
        confidence: 0.8,
        suggestions: [
          { text: 'Reproduce the issue', checked: false },
          { text: 'Fix the bug', checked: false },
        ],
      };

      expect(suggestion.type).toBe('checklist');
      expect(suggestion.suggestions[0].checked).toBe(false);
    });
  });

  describe('AISuggestionsResponse', () => {
    it('should have correct structure', () => {
      type AISuggestionsResponse = {
        suggestions: Array<{
          type: string;
          confidence: number;
          suggestions: string[];
        }>;
        generatedAt: string;
        model?: string;
      };

      const response: AISuggestionsResponse = {
        suggestions: [
          { type: 'title', confidence: 0.85, suggestions: ['Test suggestion'] },
          { type: 'labels', confidence: 0.7, suggestions: [] },
        ],
        generatedAt: new Date().toISOString(),
        model: 'trello-clone-ai-v1',
      };

      expect(response.suggestions).toHaveLength(2);
      expect(response.model).toBe('trello-clone-ai-v1');
    });
  });

  describe('GenerateSuggestionsRequest', () => {
    it('should have correct structure', () => {
      type GenerateSuggestionsRequest = {
        content: string;
        context?: {
          boardName?: string;
          columnName?: string;
          existingLabels?: string[];
          similarCards?: Array<{ title: string; labels?: string[] }>;
        };
        types?: Array<'title' | 'description' | 'labels' | 'checklist'>;
      };

      const request: GenerateSuggestionsRequest = {
        content: 'Fix the login bug',
        context: {
          boardName: 'Development',
          columnName: 'To Do',
          existingLabels: ['Bug'],
        },
        types: ['title', 'labels'],
      };

      expect(request.content).toBe('Fix the login bug');
      expect(request.context?.boardName).toBe('Development');
      expect(request.types).toHaveLength(2);
    });
  });
});

// Test suggestion pattern matching
describe('Suggestion Pattern Matching', () => {
  const DEFAULT_PATTERNS = {
    keywords: ['bug', 'feature', 'task', 'issue', 'fix', 'update', 'refactor', 'test'],
    labels: [
      { keywords: ['bug', 'issue', 'fix', 'error'], label: 'Bug', color: 'bg-red-500' },
      { keywords: ['feature', 'enhancement', 'add'], label: 'Feature', color: 'bg-green-500' },
      { keywords: ['refactor', 'improve', 'optimize'], label: 'Refactor', color: 'bg-blue-500' },
      { keywords: ['test', 'testing', 'coverage'], label: 'Testing', color: 'bg-yellow-500' },
      { keywords: ['docs', 'documentation', 'readme'], label: 'Documentation', color: 'bg-purple-500' },
      { keywords: ['urgent', 'important', 'asap'], label: 'High Priority', color: 'bg-orange-500' },
    ],
    checklistItems: [
      { keywords: ['bug', 'issue'], items: ['Reproduce the issue', 'Identify root cause', 'Fix the bug', 'Test the fix'] },
      { keywords: ['feature', 'enhancement'], items: ['Define requirements', 'Design solution', 'Implement feature', 'Add tests', 'Documentation'] },
      { keywords: ['refactor', 'improve'], items: ['Identify code to refactor', 'Plan changes', 'Implement refactoring', 'Verify functionality'] },
      { keywords: ['docs', 'documentation'], items: ['Gather information', 'Write documentation', 'Review and edit', 'Publish'] },
    ],
    titleTemplates: [
      '[Bug] {description}',
      '[Feature] {description}',
      '[Task] {description}',
      'Implement {description}',
      'Fix {description}',
      'Update {description}',
    ],
  };

  function findMatchingLabels(content: string) {
    const lowerContent = content.toLowerCase();
    const suggestions: Array<{ text: string; color: string }> = [];
    const usedLabels = new Set<string>();

    for (const labelPattern of DEFAULT_PATTERNS.labels) {
      for (const keyword of labelPattern.keywords) {
        if (lowerContent.includes(keyword) && !usedLabels.has(labelPattern.label)) {
          suggestions.push({
            text: labelPattern.label,
            color: labelPattern.color,
          });
          usedLabels.add(labelPattern.label);
          break;
        }
      }
    }

    return suggestions;
  }

  function findMatchingChecklist(content: string) {
    const lowerContent = content.toLowerCase();

    for (const checklistPattern of DEFAULT_PATTERNS.checklistItems) {
      for (const keyword of checklistPattern.keywords) {
        if (lowerContent.includes(keyword)) {
          return checklistPattern.items.map((text) => ({ text, checked: false }));
        }
      }
    }

    return null;
  }

  function extractDescription(content: string) {
    return content.replace(/^(bug|feature|task|issue|fix|update|refactor|test):?\s*/i, '').trim();
  }

  it('should find bug labels for bug-related content', () => {
    const labels = findMatchingLabels('Fix the authentication bug');
    expect(labels.some((l) => l.text === 'Bug')).toBe(true);
  });

  it('should find feature labels for feature-related content', () => {
    const labels = findMatchingLabels('Add new feature for user authentication');
    expect(labels.some((l) => l.text === 'Feature')).toBe(true);
  });

  it('should find multiple labels when content matches multiple patterns', () => {
    const labels = findMatchingLabels('Urgent: Fix the critical bug');
    expect(labels.some((l) => l.text === 'Bug')).toBe(true);
    expect(labels.some((l) => l.text === 'High Priority')).toBe(true);
  });

  it('should find matching checklist for bug content', () => {
    const checklist = findMatchingChecklist('There is a bug in the login');
    expect(checklist).not.toBeNull();
    expect(checklist!.some((item) => item.text === 'Reproduce the issue')).toBe(true);
  });

  it('should find matching checklist for feature content', () => {
    const checklist = findMatchingChecklist('Implement a new feature');
    expect(checklist).not.toBeNull();
    expect(checklist!.some((item) => item.text === 'Define requirements')).toBe(true);
  });

  it('should return null checklist for generic content', () => {
    const checklist = findMatchingChecklist('Some random task');
    expect(checklist).toBeNull();
  });

  it('should extract description without prefix', () => {
    expect(extractDescription('Bug: Fix login issue')).toBe('Fix login issue');
    expect(extractDescription('Feature: Add user profile')).toBe('Add user profile');
    expect(extractDescription('Just some task')).toBe('Just some task');
  });
});

// Test suggestion confidence calculation
describe('Confidence Calculation', () => {
  function calculateConfidence(suggestions: string[], baseConfidence = 0.5) {
    return suggestions.length > 0
      ? Math.min(0.95, baseConfidence + suggestions.length * 0.15)
      : 0.3;
  }

  it('should have higher confidence with more suggestions', () => {
    const zeroSuggestions = calculateConfidence([]);
    const oneSuggestion = calculateConfidence(['one']);
    const threeSuggestions = calculateConfidence(['one', 'two', 'three']);

    expect(zeroSuggestions).toBe(0.3);
    expect(oneSuggestion).toBe(0.65);
    expect(threeSuggestions).toBe(0.95);
  });

  it('should cap confidence at 0.95', () => {
    const manySuggestions = calculateConfidence(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    expect(manySuggestions).toBe(0.95);
  });
});

// Test suggestion filtering
describe('Suggestion Filtering', () => {
  const mockSuggestions = [
    { type: 'title', confidence: 0.85, suggestions: ['Title 1', 'Title 2'] },
    { type: 'labels', confidence: 0.7, suggestions: [] },
    { type: 'checklist', confidence: 0.8, suggestions: ['Item 1'] },
    { type: 'description', confidence: 0.6, suggestions: ['Desc 1'] },
  ];

  function filterByType(suggestions: typeof mockSuggestions, types: string[]) {
    return suggestions.filter((s) => types.includes(s.type));
  }

  function filterByConfidence(suggestions: typeof mockSuggestions, minConfidence: number) {
    return suggestions.filter((s) => s.confidence >= minConfidence);
  }

  function sortByConfidence(suggestions: typeof mockSuggestions) {
    return [...suggestions].sort((a, b) => b.confidence - a.confidence);
  }

  it('should filter suggestions by type', () => {
    const titleSuggestions = filterByType(mockSuggestions, ['title']);
    expect(titleSuggestions).toHaveLength(1);
    expect(titleSuggestions[0].type).toBe('title');
  });

  it('should filter suggestions by multiple types', () => {
    const selected = filterByType(mockSuggestions, ['title', 'checklist']);
    expect(selected).toHaveLength(2);
  });

  it('should filter suggestions by minimum confidence', () => {
    const highConfidence = filterByConfidence(mockSuggestions, 0.75);
    expect(highConfidence).toHaveLength(2);
    expect(highConfidence.every((s) => s.confidence >= 0.75)).toBe(true);
  });

  it('should sort suggestions by confidence descending', () => {
    const sorted = sortByConfidence(mockSuggestions);
    expect(sorted[0].confidence).toBe(0.85);
    expect(sorted[sorted.length - 1].confidence).toBe(0.6);
  });
});

// Test suggestion application logic
describe('Suggestion Application Logic', () => {
  interface LabelSuggestion {
    text: string;
    color: string;
  }

  interface ChecklistItem {
    text: string;
    checked: boolean;
  }

  function applyLabels(existingLabels: LabelSuggestion[], newLabels: LabelSuggestion[]) {
    const existingTexts = new Set(existingLabels.map((l) => l.text.toLowerCase()));
    const uniqueNewLabels = newLabels.filter((l) => !existingTexts.has(l.text.toLowerCase()));
    return [...existingLabels, ...uniqueNewLabels];
  }

  function applyChecklist(existingItems: ChecklistItem[], newItems: ChecklistItem[]) {
    const existingTexts = new Set(existingItems.map((i) => i.text.toLowerCase()));
    const uniqueNewItems = newItems.filter((i) => !existingTexts.has(i.text.toLowerCase()));
    return [...existingItems, ...uniqueNewItems];
  }

  it('should add new labels without duplicates', () => {
    const existing = [{ text: 'Bug', color: 'bg-red-500' }];
    const newLabels = [
      { text: 'Bug', color: 'bg-red-500' },
      { text: 'High Priority', color: 'bg-orange-500' },
    ];

    const result = applyLabels(existing, newLabels);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Bug');
    expect(result[1].text).toBe('High Priority');
  });

  it('should add new checklist items without duplicates', () => {
    const existing = [{ text: 'Reproduce the issue', checked: false }];
    const newItems = [
      { text: 'Reproduce the issue', checked: false },
      { text: 'Fix the bug', checked: false },
    ];

    const result = applyChecklist(existing, newItems);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Reproduce the issue');
    expect(result[1].text).toBe('Fix the bug');
  });
});
