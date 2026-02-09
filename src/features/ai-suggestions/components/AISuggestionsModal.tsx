'use client';

import { Sparkles, Check, Copy, RefreshCw, Lightbulb, Tag, List, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

import { useState, useEffect } from 'react';

import { CardAISuggestion, useAISuggestions } from '../hooks/useAISuggestions';

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardContent: string;
  onApplyTitle?: (title: string) => void;
  onApplyDescription?: (description: string) => void;
  onApplyLabels?: (labels: Array<{ text: string; color: string }>) => void;
  onApplyChecklist?: (items: Array<{ text: string; checked: boolean }>) => void;
}

export function AISuggestionsModal({
  isOpen,
  onClose,
  cardContent,
  onApplyTitle,
  onApplyDescription,
  onApplyLabels,
  onApplyChecklist,
}: AISuggestionsModalProps) {
  const { suggestions, isLoading, error, generateSuggestions, clearSuggestions } =
    useAISuggestions();
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (isOpen && cardContent) {
      generateSuggestions(cardContent);
    }
  }, [isOpen, cardContent, generateSuggestions]);

  const handleClose = () => {
    clearSuggestions();
    onClose();
  };

  const toggleSuggestion = (index: number, suggestion: string) => {
    setSelectedSuggestions(prev => {
      const newState = { ...prev };
      if (newState[index] === suggestion) {
        delete newState[index];
      } else {
        newState[index] = suggestion;
      }
      return newState;
    });
  };

  const handleApplySelected = () => {
    const selectedValues = Object.values(selectedSuggestions);

    // Apply title
    const titleSuggestion = suggestions.find(s => s.type === 'title');
    if (titleSuggestion && onApplyTitle) {
      const selectedTitle = selectedValues.find(v => titleSuggestion.suggestions.includes(v));
      if (selectedTitle) {
        onApplyTitle(selectedTitle);
      } else if (titleSuggestion.suggestions[0]) {
        onApplyTitle(titleSuggestion.suggestions[0]);
      }
    }

    // Apply description
    const descSuggestion = suggestions.find(s => s.type === 'description');
    if (descSuggestion && onApplyDescription && descSuggestion.suggestions[0]) {
      onApplyDescription(descSuggestion.suggestions[0]);
    }

    // Apply labels
    const labelSuggestion = suggestions.find(s => s.type === 'labels');
    if (labelSuggestion && onApplyLabels && 'suggestions' in labelSuggestion) {
      const selectedLabels = selectedValues
        .filter(v => labelSuggestion.suggestions.includes(v))
        .map(text => {
          const found = labelSuggestion.suggestions.find(s => s.text === text);
          return found || { text, color: 'bg-gray-500' };
        });
      if (selectedLabels.length > 0) {
        onApplyLabels(selectedLabels);
      } else if (labelSuggestion.suggestions.length > 0) {
        onApplyLabels(labelSuggestion.suggestions);
      }
    }

    // Apply checklist
    const checklistSuggestion = suggestions.find(s => s.type === 'checklist');
    if (checklistSuggestion && onApplyChecklist && 'suggestions' in checklistSuggestion) {
      const selectedItems = selectedValues
        .filter(v => checklistSuggestion.suggestions.some(s => s.text === v))
        .map(text => {
          const found = checklistSuggestion.suggestions.find(s => s.text === text);
          return found || { text, checked: false };
        });
      if (selectedItems.length > 0) {
        onApplyChecklist(selectedItems);
      } else if (checklistSuggestion.suggestions.length > 0) {
        onApplyChecklist(checklistSuggestion.suggestions);
      }
    }

    handleClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'title':
        return <FileText className="h-4 w-4" />;
      case 'labels':
        return <Tag className="h-4 w-4" />;
      case 'checklist':
        return <List className="h-4 w-4" />;
      case 'description':
        return <FileText className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Suggestions
          </DialogTitle>
          <DialogDescription>
            Let AI help you improve your card with smart suggestions based on the content.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner className="h-8 w-8 mb-4" />
            <p className="text-muted-foreground">Generating AI suggestions...</p>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getIcon(suggestion.type)}
                      {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                    </span>
                    <span className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestion.type === 'labels' && 'suggestions' in suggestion && (
                    <div className="flex flex-wrap gap-2">
                      {(suggestion.suggestions as Array<{ text: string; color: string }>).map(
                        (label, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary cursor-pointer hover:bg-secondary/80"
                          >
                            <Checkbox
                              checked={selectedSuggestions[index] === label.text}
                              onCheckedChange={() => toggleSuggestion(index, label.text)}
                            />
                            <span
                              className={`${label.color} text-white text-xs px-2 py-0.5 rounded`}
                            >
                              {label.text}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  )}

                  {suggestion.type === 'checklist' && 'suggestions' in suggestion && (
                    <div className="space-y-1">
                      {(suggestion.suggestions as Array<{ text: string; checked: boolean }>).map(
                        (item, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedSuggestions[index] === item.text}
                              onCheckedChange={() => toggleSuggestion(index, item.text)}
                            />
                            <span className="text-sm">{item.text}</span>
                          </label>
                        )
                      )}
                    </div>
                  )}

                  {(suggestion.type === 'title' || suggestion.type === 'description') && (
                    <div className="space-y-2">
                      {suggestion.suggestions.map((text, i) => (
                        <label
                          key={i}
                          className="flex items-start gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedSuggestions[index] === text}
                            onCheckedChange={() => toggleSuggestion(index, text)}
                          />
                          <span className="text-sm">{text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {suggestion.reasoning && (
                    <p className="text-xs text-muted-foreground italic">{suggestion.reasoning}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleApplySelected}>
                <Check className="h-4 w-4 mr-1" />
                Apply Selected
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No suggestions available for this content.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adding more details to your card description.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Simple AI suggestions button for inline use
interface AISuggestionsButtonProps {
  content: string;
  onSuggestion: (suggestion: string) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

export function AISuggestionsButton({
  content,
  onSuggestion,
  variant = 'ghost',
  size = 'icon',
}: AISuggestionsButtonProps) {
  const { suggestedTitle, isLoading, generateTitle, clearSuggestion } = useAITitleSuggestions();

  const handleGenerate = async () => {
    await generateTitle(content);
  };

  useEffect(() => {
    if (suggestedTitle) {
      onSuggestion(suggestedTitle);
      clearSuggestion();
    }
  }, [suggestedTitle, onSuggestion, clearSuggestion]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGenerate}
      disabled={isLoading || !content.trim()}
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
    </Button>
  );
}
