import { NextRequest, NextResponse } from 'next/server';

import { DEFAULT_PATTERNS, CardAISuggestion } from '@/features/ai-suggestions/types';

// Simulated AI suggestion generator
// In production, this would call an actual AI API (OpenAI, Anthropic, etc.)
function generateSuggestions(content: string, types: string[]): CardAISuggestion[] {
  const suggestions: CardAISuggestion[] = [];
  const lowerContent = content.toLowerCase();

  // Generate title suggestions
  if (types.includes('title')) {
    const titleSuggestion = generateTitleSuggestions(content, lowerContent);
    if (titleSuggestion.suggestions.length > 0) {
      suggestions.push(titleSuggestion);
    }
  }

  // Generate description suggestions
  if (types.includes('description')) {
    const descSuggestion = generateDescriptionSuggestions(content, lowerContent);
    if (descSuggestion.suggestions.length > 0) {
      suggestions.push(descSuggestion);
    }
  }

  // Generate label suggestions
  if (types.includes('labels')) {
    const labelSuggestion = generateLabelSuggestions(lowerContent);
    if (labelSuggestion.suggestions.length > 0) {
      suggestions.push(labelSuggestion);
    }
  }

  // Generate checklist suggestions
  if (types.includes('checklist')) {
    const checklistSuggestion = generateChecklistSuggestions(lowerContent);
    if (checklistSuggestion.suggestions.length > 0) {
      suggestions.push(checklistSuggestion);
    }
  }

  return suggestions;
}

function generateTitleSuggestions(
  content: string,
  lowerContent: string
): CardAISuggestion & { type: 'title' } {
  const suggestions: string[] = [];

  // Check for patterns
  for (const template of DEFAULT_PATTERNS.titleTemplates) {
    const match = DEFAULT_PATTERNS.keywords.find(kw => lowerContent.includes(kw));
    if (match) {
      const description = content
        .replace(/^(bug|feature|task|issue|fix|update|refactor|test):?\s*/i, '')
        .trim();
      if (description) {
        suggestions.push(template.replace('{description}', description));
      }
    }
  }

  // Generate title from first sentence or key phrases
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 5);
  if (suggestions.length === 0 && sentences.length > 0) {
    const firstSentence = sentences[0].trim();
    // Capitalize first letter
    const capitalized = firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
    suggestions.push(capitalized);
  }

  // Generate variations
  const words = content.split(/\s+/).filter(w => w.length > 4);
  if (suggestions.length === 0 && words.length > 0) {
    suggestions.push(`Task: ${words.slice(0, 5).join(' ')}...`);
  }

  // Calculate confidence based on pattern matches
  const confidence = suggestions.length > 0 ? Math.min(0.95, 0.5 + suggestions.length * 0.15) : 0.3;

  return {
    type: 'title',
    confidence,
    suggestions: suggestions.slice(0, 5),
    reasoning:
      suggestions.length > 0
        ? 'Generated based on content patterns and structure'
        : 'No clear patterns detected, suggest manual entry',
  };
}

function generateDescriptionSuggestions(
  content: string,
  lowerContent: string
): CardAISuggestion & { type: 'description' } {
  const suggestions: string[] = [];
  let template = '';

  // Check for task type and generate appropriate template
  if (
    lowerContent.includes('bug') ||
    lowerContent.includes('issue') ||
    lowerContent.includes('error')
  ) {
    template = `## Problem Description
${content}

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
Describe what should happen.

## Actual Behavior
Describe what actually happens.

## Additional Notes
- 
`;
    suggestions.push(template);
  } else if (lowerContent.includes('feature') || lowerContent.includes('enhancement')) {
    template = `## Feature Description
${content}

## User Story
As a [user], I want [goal], so that [benefit].

## Acceptance Criteria
- [ ] 
- [ ] 
- [ ] 

## Implementation Notes
- 
`;
    suggestions.push(template);
  } else if (lowerContent.includes('test') || lowerContent.includes('testing')) {
    template = `## Test Plan
${content}

## Test Cases
1. **Test Case 1:** [Description]
   - Steps: 
   - Expected: 

2. **Test Case 2:** [Description]
   - Steps:
   - Expected:

## Test Data
- 
`;
    suggestions.push(template);
  } else {
    // Generic template
    template = `## Summary
${content}

## Details
- 

## Related Tasks
- 

## Notes
-
`;
    suggestions.push(template);
  }

  return {
    type: 'description',
    confidence: template ? 0.9 : 0.4,
    suggestions,
    template,
    reasoning: template
      ? 'Generated template based on detected task type'
      : 'Generic template generated',
  };
}

function generateLabelSuggestions(lowerContent: string): CardAISuggestion & { type: 'labels' } {
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

  // Add high priority for urgent terms
  if (
    lowerContent.includes('urgent') ||
    lowerContent.includes('important') ||
    lowerContent.includes('asap')
  ) {
    if (!usedLabels.has('High Priority')) {
      suggestions.push({
        text: 'High Priority',
        color: 'bg-orange-500',
      });
    }
  }

  return {
    type: 'labels',
    confidence: suggestions.length > 0 ? Math.min(0.95, 0.6 + suggestions.length * 0.1) : 0.3,
    suggestions,
    reasoning:
      suggestions.length > 0
        ? 'Labels suggested based on keyword analysis'
        : 'No matching keywords found for automatic labeling',
  };
}

function generateChecklistSuggestions(
  lowerContent: string
): CardAISuggestion & { type: 'checklist' } {
  const suggestions: Array<{ text: string; checked: boolean }> = [];

  for (const checklistPattern of DEFAULT_PATTERNS.checklistItems) {
    for (const keyword of checklistPattern.keywords) {
      if (lowerContent.includes(keyword)) {
        for (const item of checklistPattern.items) {
          suggestions.push({
            text: item,
            checked: false,
          });
        }
        return {
          type: 'checklist',
          confidence: 0.85,
          suggestions,
          reasoning: 'Checklist generated based on detected task type',
        };
      }
    }
  }

  // Default checklist items
  suggestions.push(
    { text: 'Research and gather information', checked: false },
    { text: 'Plan implementation', checked: false },
    { text: 'Execute the task', checked: false },
    { text: 'Review and test', checked: false },
    { text: 'Document completion', checked: false }
  );

  return {
    type: 'checklist',
    confidence: 0.6,
    suggestions,
    reasoning: 'Default checklist items generated',
  };
}

// POST /api/ai/suggestions - Generate AI suggestions for cards
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, context, types } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    const suggestionTypes = types || ['title', 'labels', 'checklist'];

    // Generate suggestions
    const suggestions = generateSuggestions(content, suggestionTypes);

    return NextResponse.json({
      suggestions,
      generatedAt: new Date().toISOString(),
      model: 'trello-clone-ai-v1', // Simulated model identifier
    });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
