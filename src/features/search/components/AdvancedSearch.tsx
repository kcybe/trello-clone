'use client';

import { Search, X, Filter, Calendar, Users, Tag, ArrowLeftRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  SearchFilters,
  SearchResult,
  CardSearchResult,
  DateFilterOption,
} from '@/features/search/types/search';

import React, { useState, useCallback, useMemo, useEffect } from 'react';

// Demo data for labels and assignees (in real app, these would come from props/API)
const AVAILABLE_LABELS = [
  { name: 'Urgent', color: '#ef4444' },
  { name: 'High Priority', color: '#f97316' },
  { name: 'Medium Priority', color: '#eab308' },
  { name: 'Low Priority', color: '#22c55e' },
  { name: 'Bug', color: '#ef4444' },
  { name: 'Feature', color: '#3b82f6' },
  { name: 'Enhancement', color: '#8b5cf6' },
  { name: 'Documentation', color: '#06b6d4' },
];

const AVAILABLE_ASSIGNEES = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com' },
  { id: '4', name: 'Diana', email: 'diana@example.com' },
  { id: '5', name: 'Eve', email: 'eve@example.com' },
];

interface AdvancedSearchProps {
  boardId?: string;
  onSearch: (results: SearchResult) => void;
  onSelectCard?: (card: CardSearchResult) => void;
  placeholder?: string;
}

export function AdvancedSearch({
  boardId,
  onSearch,
  onSelectCard,
  placeholder = 'Search cards...',
}: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters, isOpen]);

  const performSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (query) params.set('query', query);
      if (filters.labels?.length) params.set('labels', filters.labels.join(','));
      if (filters.assignees?.length) params.set('assignees', filters.assignees.join(','));
      if (filters.dateFilter) params.set('dateFilter', filters.dateFilter);
      if (filters.specificDate) params.set('specificDate', filters.specificDate.toISOString());
      if (boardId) params.set('boardId', boardId);

      const response = await fetch(`/api/search?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        onSearch(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, filters, boardId, onSearch]);

  const handleApplyFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleRemoveFilter = useCallback((key: keyof SearchFilters, value?: string) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (Array.isArray(updated[key]) && value) {
        updated[key] = (updated[key] as string[]).filter(v => v !== value);
      } else if (key === 'specificDate') {
        updated.specificDate = undefined;
      } else {
        updated[key] = undefined;
      }
      return updated;
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.labels?.length) count += filters.labels.length;
    if (filters.assignees?.length) count += filters.assignees.length;
    if (filters.dateFilter && filters.dateFilter !== 'any') count += 1;
    return count;
  }, [filters]);

  return (
    <div className="relative">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Search className="h-4 w-4" />
            {placeholder}
            {activeFilterCount > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Advanced Search
            </DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or keyword..."
              className="pl-10"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-background text-foreground text-xs px-1.5 py-0.5 rounded">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear all
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && <FilterPanel filters={filters} onApplyFilters={handleApplyFilters} />}

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.labels?.map(label => (
                <FilterChip
                  key={label}
                  label={label}
                  type="label"
                  onRemove={() => handleRemoveFilter('labels', label)}
                />
              ))}
              {filters.assignees?.map(assignee => (
                <FilterChip
                  key={assignee}
                  label={assignee}
                  type="assignee"
                  onRemove={() => handleRemoveFilter('assignees', assignee)}
                />
              ))}
              {filters.dateFilter && filters.dateFilter !== 'any' && (
                <FilterChip
                  label={getDateFilterLabel(filters.dateFilter)}
                  type="date"
                  onRemove={() => handleRemoveFilter('dateFilter')}
                />
              )}
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <span className="animate-pulse">Searching...</span>
              </div>
            ) : results?.cards && results.cards.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Found {results.totalCount} result{results.totalCount !== 1 ? 's' : ''}
                </p>
                {results.cards.map(card => (
                  <SearchResultCard
                    key={card.id}
                    card={card}
                    query={query}
                    onClick={() => onSelectCard?.(card)}
                  />
                ))}
              </div>
            ) : query || activeFilterCount > 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No cards found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Enter a search query or apply filters</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Filter Panel Component
interface FilterPanelProps {
  filters: SearchFilters;
  onApplyFilters: (filters: SearchFilters) => void;
}

function FilterPanel({ filters, onApplyFilters }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const handleLabelToggle = (label: string) => {
    setLocalFilters(prev => ({
      ...prev,
      labels: prev.labels?.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...(prev.labels || []), label],
    }));
  };

  const handleAssigneeToggle = (assignee: string) => {
    setLocalFilters(prev => ({
      ...prev,
      assignees: prev.assignees?.includes(assignee)
        ? prev.assignees.filter(a => a !== assignee)
        : [...(prev.assignees || []), assignee],
    }));
  };

  const handleDateFilterChange = (dateFilter: DateFilterOption) => {
    setLocalFilters(prev => ({
      ...prev,
      dateFilter,
      specificDate: dateFilter === 'specific' ? prev.specificDate : undefined,
    }));
  };

  const handleSpecificDateChange = (dateStr: string) => {
    setLocalFilters(prev => ({
      ...prev,
      specificDate: new Date(dateStr),
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
      {/* Labels Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Tag className="h-4 w-4" />
          Labels
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_LABELS.map(label => (
            <button
              key={label.name}
              onClick={() => handleLabelToggle(label.name)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                localFilters.labels?.includes(label.name)
                  ? 'ring-2 ring-primary ring-offset-1'
                  : 'hover:bg-muted'
              }`}
              style={{
                backgroundColor: localFilters.labels?.includes(label.name)
                  ? label.color
                  : undefined,
                color: localFilters.labels?.includes(label.name) ? 'white' : undefined,
                borderColor: label.color,
              }}
            >
              {label.name}
            </button>
          ))}
        </div>
      </div>

      {/* Assignees Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Users className="h-4 w-4" />
          Assignees
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_ASSIGNEES.map(assignee => (
            <button
              key={assignee.id}
              onClick={() => handleAssigneeToggle(assignee.name)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                localFilters.assignees?.includes(assignee.name)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {assignee.name}
            </button>
          ))}
        </div>
      </div>

      {/* Due Date Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Calendar className="h-4 w-4" />
          Due Date
        </label>
        <div className="flex flex-wrap gap-2">
          {DATE_FILTER_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => handleDateFilterChange(option.value)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                localFilters.dateFilter === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {localFilters.dateFilter === 'specific' && (
          <input
            type="date"
            className="mt-2 px-3 py-1 text-xs border rounded"
            onChange={e => handleSpecificDateChange(e.target.value)}
            value={
              localFilters.specificDate
                ? new Date(localFilters.specificDate).toISOString().split('T')[0]
                : ''
            }
          />
        )}
      </div>

      {/* Apply Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setLocalFilters({})}>
          Clear
        </Button>
        <Button size="sm" onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}

// Search Result Card
interface SearchResultCardProps {
  card: CardSearchResult;
  query: string;
  onClick?: () => void;
}

function SearchResultCard({ card, query, onClick }: SearchResultCardProps) {
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{highlightMatch(card.title, query)}</h4>
          {card.description && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {highlightMatch(card.description, query)}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowLeftRight className="h-3 w-3" />
              {card.columnName}
            </span>
            {card.assignee && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {card.assignee}
              </span>
            )}
            {card.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(card.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {card.boardName && (
          <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
            {card.boardName}
          </span>
        )}
      </div>
    </button>
  );
}

// Filter Chip Component
interface FilterChipProps {
  label: string;
  type: 'label' | 'assignee' | 'date';
  onRemove: () => void;
}

function FilterChip({ label, type, onRemove }: FilterChipProps) {
  const colors = {
    label: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    assignee: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    date: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${colors[type]}`}
    >
      {type === 'label' && <Tag className="h-3 w-3" />}
      {type === 'assignee' && <Users className="h-3 w-3" />}
      {type === 'date' && <Calendar className="h-3 w-3" />}
      {label}
      <button onClick={onRemove} className="hover:opacity-70">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// Date Filter Options
const DATE_FILTER_OPTIONS: { value: DateFilterOption; label: string }[] = [
  { value: 'any', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'nextWeek', label: 'Next Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'noDate', label: 'No Date' },
  { value: 'specific', label: 'Specific Date' },
];

// Helper function for date filter labels
function getDateFilterLabel(filter: string): string {
  const option = DATE_FILTER_OPTIONS.find(o => o.value === filter);
  return option?.label || filter;
}

export default AdvancedSearch;
