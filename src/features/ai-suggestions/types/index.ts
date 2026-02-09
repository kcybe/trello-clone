// AI Suggestion Types

export interface CardAISuggestion<T = string, Extra = {}> {
  type: 'title' | 'description' | 'labels' | 'checklist';
  confidence: number;
  suggestions: T[];
  reasoning?: string;
  template?: string;
}

export interface CardTitleSuggestion extends CardAISuggestion<string> {
  type: 'title';
  suggestions: string[];
}

export interface CardDescriptionSuggestion extends CardAISuggestion<string> {
  type: 'description';
  suggestions: string[];
  template?: string;
}

export interface CardLabelsSuggestion extends CardAISuggestion<{ text: string; color: string }> {
  type: 'labels';
  suggestions: Array<{
    text: string;
    color: string;
  }>;
}

export interface CardChecklistSuggestion extends CardAISuggestion<{
  text: string;
  checked: boolean;
}> {
  type: 'checklist';
  suggestions: Array<{
    text: string;
    checked: boolean;
  }>;
}

export interface AISuggestionsResponse {
  suggestions: Array<
    CardTitleSuggestion | CardDescriptionSuggestion | CardLabelsSuggestion | CardChecklistSuggestion
  >;
  generatedAt: string;
  model?: string;
}

export interface GenerateSuggestionsRequest {
  content: string;
  context?: {
    boardName?: string;
    columnName?: string;
    existingLabels?: string[];
    similarCards?: Array<{
      title: string;
      labels?: string[];
    }>;
  };
  types?: Array<'title' | 'description' | 'labels' | 'checklist'>;
}

export interface SuggestionState {
  suggestions: Array<
    CardTitleSuggestion | CardDescriptionSuggestion | CardLabelsSuggestion | CardChecklistSuggestion
  >;
  isLoading: boolean;
  error: string | null;
}

// Pattern matching rules for suggestions
export interface SuggestionPattern {
  keywords: string[];
  labels: Array<{
    keywords: string[];
    label: string;
    color: string;
  }>;
  checklistItems: Array<{
    keywords: string[];
    items: string[];
  }>;
  titleTemplates: string[];
}

export const DEFAULT_PATTERNS: SuggestionPattern = {
  keywords: ['bug', 'feature', 'task', 'issue', 'fix', 'update', 'refactor', 'test'],
  labels: [
    { keywords: ['bug', 'issue', 'fix', 'error'], label: 'Bug', color: 'bg-red-500' },
    { keywords: ['feature', 'enhancement', 'add'], label: 'Feature', color: 'bg-green-500' },
    { keywords: ['refactor', 'improve', 'optimize'], label: 'Refactor', color: 'bg-blue-500' },
    { keywords: ['test', 'testing', 'coverage'], label: 'Testing', color: 'bg-yellow-500' },
    {
      keywords: ['docs', 'documentation', 'readme'],
      label: 'Documentation',
      color: 'bg-purple-500',
    },
    { keywords: ['urgent', 'important', 'asap'], label: 'High Priority', color: 'bg-orange-500' },
  ],
  checklistItems: [
    {
      keywords: ['bug', 'issue'],
      items: ['Reproduce the issue', 'Identify root cause', 'Fix the bug', 'Test the fix'],
    },
    {
      keywords: ['feature', 'enhancement'],
      items: [
        'Define requirements',
        'Design solution',
        'Implement feature',
        'Add tests',
        'Documentation',
      ],
    },
    {
      keywords: ['refactor', 'improve'],
      items: [
        'Identify code to refactor',
        'Plan changes',
        'Implement refactoring',
        'Verify functionality',
      ],
    },
    {
      keywords: ['docs', 'documentation'],
      items: ['Gather information', 'Write documentation', 'Review and edit', 'Publish'],
    },
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
