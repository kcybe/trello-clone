import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCards } from '../../../src/features/board/hooks/useCards';
import { JSDOM } from 'jsdom';

// Setup jsdom for document
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// Create a mock fetch function
const mockFetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Mock the global fetch
vi.stubGlobal('fetch', mockFetch);

describe('useCards - Checklist Functionality', () => {
  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test description',
    labels: [],
    assignee: undefined,
    attachments: [],
    checklists: [],
    dueDate: '',
    columnId: 'col-1',
    comments: [],
    color: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty checklist state', () => {
      const { result } = renderHook(() => useCards());

      expect(result.current.editingCard).toBeNull();
      expect(result.current.newChecklistTitle).toBe('');
      expect(result.current.newChecklistItem).toBe('');
    });
  });

  describe('openEditCard', () => {
    it('should open card with empty checklists', () => {
      const { result } = renderHook(() => useCards());

      const card = { ...mockCard, checklists: [] };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      expect(result.current.editingCard).not.toBeNull();
      expect(result.current.editingCard?.checklists).toEqual([]);
    });

    it('should open card with existing checklists', () => {
      const { result } = renderHook(() => useCards());

      const card = {
        ...mockCard,
        checklists: [
          {
            id: 'check-1',
            title: 'To Do',
            items: [
              { id: 'item-1', text: 'Task 1', checked: false },
              { id: 'item-2', text: 'Task 2', checked: true },
            ],
          },
        ],
      };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      expect(result.current.editingCard).not.toBeNull();
      expect(result.current.editingCard?.checklists).toHaveLength(1);
      expect(result.current.editingCard?.checklists?.[0].items).toHaveLength(2);
    });
  });

  describe('closeEditCard', () => {
    it('should close the edit card modal', () => {
      const { result } = renderHook(() => useCards());

      const card = { ...mockCard };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      expect(result.current.editingCard).not.toBeNull();

      act(() => {
        result.current.closeEditCard();
      });

      expect(result.current.editingCard).toBeNull();
    });
  });

  describe('addChecklist', () => {
    it('should add a new checklist', () => {
      const { result } = renderHook(() => useCards());

      const card = { ...mockCard };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      act(() => {
        result.current.setNewChecklistTitle('My Checklist');
      });

      expect(result.current.newChecklistTitle).toBe('My Checklist');

      act(() => {
        result.current.addChecklist();
      });

      expect(result.current.editingCard?.checklists).toHaveLength(1);
      expect(result.current.editingCard?.checklists?.[0].title).toBe('My Checklist');
      expect(result.current.editingCard?.checklists?.[0].items).toHaveLength(0);
      expect(result.current.newChecklistTitle).toBe('');
    });

    it('should not add empty checklist', () => {
      const { result } = renderHook(() => useCards());

      const card = { ...mockCard };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      act(() => {
        result.current.addChecklist();
      });

      expect(result.current.editingCard?.checklists).toHaveLength(0);
    });

    it('should not add checklist when no card is open', () => {
      const { result } = renderHook(() => useCards());

      act(() => {
        result.current.setNewChecklistTitle('My Checklist');
      });

      act(() => {
        result.current.addChecklist();
      });

      expect(result.current.editingCard).toBeNull();
    });
  });

  describe('removeChecklist', () => {
    it('should remove a checklist', () => {
      const { result } = renderHook(() => useCards());

      const card = {
        ...mockCard,
        checklists: [
          {
            id: 'check-1',
            title: 'To Do',
            items: [],
          },
        ],
      };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      expect(result.current.editingCard?.checklists).toHaveLength(1);

      act(() => {
        result.current.removeChecklist('check-1');
      });

      expect(result.current.editingCard?.checklists).toHaveLength(0);
    });

    it('should not affect other checklists', () => {
      const { result } = renderHook(() => useCards());

      const card = {
        ...mockCard,
        checklists: [
          { id: 'check-1', title: 'Checklist 1', items: [] },
          { id: 'check-2', title: 'Checklist 2', items: [] },
        ],
      };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      act(() => {
        result.current.removeChecklist('check-1');
      });

      expect(result.current.editingCard?.checklists).toHaveLength(1);
      expect(result.current.editingCard?.checklists?.[0].id).toBe('check-2');
    });
  });

  describe('setNewChecklistTitle', () => {
    it('should update new checklist title', () => {
      const { result } = renderHook(() => useCards());

      act(() => {
        result.current.setNewChecklistTitle('New Title');
      });

      expect(result.current.newChecklistTitle).toBe('New Title');
    });
  });

  describe('addChecklistItem', () => {
    it('should add an item to a checklist', () => {
      const { result } = renderHook(() => useCards());

      const card = {
        ...mockCard,
        checklists: [
          {
            id: 'check-1',
            title: 'To Do',
            items: [],
          },
        ],
      };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      act(() => {
        result.current.setNewChecklistItem('New Item');
      });

      act(() => {
        result.current.addChecklistItem('check-1');
      });

      expect(result.current.editingCard?.checklists?.[0].items).toHaveLength(1);
      expect(result.current.editingCard?.checklists?.[0].items[0].text).toBe('New Item');
      expect(result.current.editingCard?.checklists?.[0].items[0].checked).toBe(false);
      expect(result.current.newChecklistItem).toBe('');
    });

    it('should add item to specific checklist', () => {
      const { result } = renderHook(() => useCards());

      const card = {
        ...mockCard,
        checklists: [
          { id: 'check-1', title: 'Checklist 1', items: [] },
          { id: 'check-2', title: 'Checklist 2', items: [] },
        ],
      };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      act(() => {
        result.current.setNewChecklistItem('Item for check-2');
      });

      act(() => {
        result.current.addChecklistItem('check-2');
      });

      expect(result.current.editingCard?.checklists?.[0].items).toHaveLength(0);
      expect(result.current.editingCard?.checklists?.[1].items).toHaveLength(1);
      expect(result.current.editingCard?.checklists?.[1].items[0].text).toBe('Item for check-2');
    });

    it('should not add empty item', () => {
      const { result } = renderHook(() => useCards());

      const card = {
        ...mockCard,
        checklists: [
          {
            id: 'check-1',
            title: 'To Do',
            items: [],
          },
        ],
      };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      act(() => {
        result.current.addChecklistItem('check-1');
      });

      expect(result.current.editingCard?.checklists?.[0].items).toHaveLength(0);
    });
  });

  describe('removeChecklistItem', () => {
    it('should remove an item from checklist', () => {
      const { result } = renderHook(() => useCards());

      const card = {
        ...mockCard,
        checklists: [
          {
            id: 'check-1',
            title: 'To Do',
            items: [
              { id: 'item-1', text: 'Task 1', checked: false },
              { id: 'item-2', text: 'Task 2', checked: true },
            ],
          },
        ],
      };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      expect(result.current.editingCard?.checklists?.[0].items).toHaveLength(2);

      act(() => {
        result.current.removeChecklistItem('check-1', 'item-1');
      });

      expect(result.current.editingCard?.checklists?.[0].items).toHaveLength(1);
      expect(result.current.editingCard?.checklists?.[0].items[0].id).toBe('item-2');
    });

    it('should not affect other checklists', () => {
      const { result } = renderHook(() => useCards());

      const card = {
        ...mockCard,
        checklists: [
          {
            id: 'check-1',
            title: 'Checklist 1',
            items: [{ id: 'item-1', text: 'Task 1', checked: false }],
          },
          {
            id: 'check-2',
            title: 'Checklist 2',
            items: [{ id: 'item-2', text: 'Task 2', checked: false }],
          },
        ],
      };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      act(() => {
        result.current.removeChecklistItem('check-1', 'item-1');
      });

      expect(result.current.editingCard?.checklists?.[0].items).toHaveLength(0);
      expect(result.current.editingCard?.checklists?.[1].items).toHaveLength(1);
    });
  });

  describe('toggleChecklistItem', () => {
    it('should toggle item checked state', () => {
      const { result } = renderHook(() => useCards());

      const card = {
        ...mockCard,
        checklists: [
          {
            id: 'check-1',
            title: 'To Do',
            items: [
              { id: 'item-1', text: 'Task 1', checked: false },
              { id: 'item-2', text: 'Task 2', checked: true },
            ],
          },
        ],
      };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      expect(result.current.editingCard?.checklists?.[0].items[0].checked).toBe(false);
      expect(result.current.editingCard?.checklists?.[0].items[1].checked).toBe(true);

      act(() => {
        result.current.toggleChecklistItem('check-1', 'item-1');
      });

      expect(result.current.editingCard?.checklists?.[0].items[0].checked).toBe(true);

      act(() => {
        result.current.toggleChecklistItem('check-1', 'item-1');
      });

      expect(result.current.editingCard?.checklists?.[0].items[0].checked).toBe(false);
    });

    it('should only toggle the specified item', () => {
      const { result } = renderHook(() => useCards());

      const card = {
        ...mockCard,
        checklists: [
          {
            id: 'check-1',
            title: 'To Do',
            items: [
              { id: 'item-1', text: 'Task 1', checked: false },
              { id: 'item-2', text: 'Task 2', checked: false },
            ],
          },
        ],
      };
      act(() => {
        result.current.openEditCard(card, 'col-1');
      });

      act(() => {
        result.current.toggleChecklistItem('check-1', 'item-1');
      });

      expect(result.current.editingCard?.checklists?.[0].items[0].checked).toBe(true);
      expect(result.current.editingCard?.checklists?.[0].items[1].checked).toBe(false);
    });
  });

  describe('setNewChecklistItem', () => {
    it('should update new checklist item text', () => {
      const { result } = renderHook(() => useCards());

      act(() => {
        result.current.setNewChecklistItem('New item text');
      });

      expect(result.current.newChecklistItem).toBe('New item text');
    });
  });

  describe('getChecklistProgress', () => {
    it('should return null for empty checklist', () => {
      const { result } = renderHook(() => useCards());

      const checklist = {
        id: 'check-1',
        title: 'To Do',
        items: [],
      };

      const progress = result.current.getChecklistProgress(checklist);
      expect(progress).toBeNull();
    });

    it('should calculate correct progress', () => {
      const { result } = renderHook(() => useCards());

      const checklist = {
        id: 'check-1',
        title: 'To Do',
        items: [
          { id: 'item-1', text: 'Task 1', checked: true },
          { id: 'item-2', text: 'Task 2', checked: true },
          { id: 'item-3', text: 'Task 3', checked: false },
          { id: 'item-4', text: 'Task 4', checked: false },
        ],
      };

      const progress = result.current.getChecklistProgress(checklist);
      expect(progress).toEqual({ checked: 2, total: 4 });
    });

    it('should return 100% for all checked', () => {
      const { result } = renderHook(() => useCards());

      const checklist = {
        id: 'check-1',
        title: 'To Do',
        items: [
          { id: 'item-1', text: 'Task 1', checked: true },
          { id: 'item-2', text: 'Task 2', checked: true },
        ],
      };

      const progress = result.current.getChecklistProgress(checklist);
      expect(progress).toEqual({ checked: 2, total: 2 });
    });

    it('should return 0% for all unchecked', () => {
      const { result } = renderHook(() => useCards());

      const checklist = {
        id: 'check-1',
        title: 'To Do',
        items: [
          { id: 'item-1', text: 'Task 1', checked: false },
          { id: 'item-2', text: 'Task 2', checked: false },
        ],
      };

      const progress = result.current.getChecklistProgress(checklist);
      expect(progress).toEqual({ checked: 0, total: 2 });
    });
  });
});

// Test checklist types
describe('Checklist Types', () => {
  describe('ChecklistItem', () => {
    it('should have correct structure', () => {
      type ChecklistItem = {
        id: string;
        text: string;
        checked: boolean;
      };

      const item: ChecklistItem = {
        id: 'item-1',
        text: 'Test item',
        checked: false,
      };

      expect(item.id).toBe('item-1');
      expect(item.text).toBe('Test item');
      expect(item.checked).toBe(false);
    });
  });

  describe('Checklist', () => {
    it('should have correct structure', () => {
      type Checklist = {
        id: string;
        title: string;
        items: Array<{
          id: string;
          text: string;
          checked: boolean;
        }>;
      };

      const checklist: Checklist = {
        id: 'check-1',
        title: 'To Do',
        items: [
          { id: 'item-1', text: 'Task 1', checked: false },
          { id: 'item-2', text: 'Task 2', checked: true },
        ],
      };

      expect(checklist.id).toBe('check-1');
      expect(checklist.title).toBe('To Do');
      expect(checklist.items).toHaveLength(2);
    });
  });
});

// Test checklist progress calculation helpers
describe('Checklist Progress Helpers', () => {
  function calculateProgress(items: { checked: boolean }[]): { checked: number; total: number; percentage: number } {
    const checked = items.filter(i => i.checked).length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { checked, total, percentage };
  }

  it('should calculate 0% for empty list', () => {
    const result = calculateProgress([]);
    expect(result).toEqual({ checked: 0, total: 0, percentage: 0 });
  });

  it('should calculate 50% for half checked', () => {
    const items = [
      { checked: true },
      { checked: false },
    ];
    const result = calculateProgress(items);
    expect(result).toEqual({ checked: 1, total: 2, percentage: 50 });
  });

  it('should calculate 100% for all checked', () => {
    const items = [
      { checked: true },
      { checked: true },
      { checked: true },
    ];
    const result = calculateProgress(items);
    expect(result).toEqual({ checked: 3, total: 3, percentage: 100 });
  });

  it('should calculate 33% for 1 of 3 checked', () => {
    const items = [
      { checked: true },
      { checked: false },
      { checked: false },
    ];
    const result = calculateProgress(items);
    expect(result).toEqual({ checked: 1, total: 3, percentage: 33 });
  });

  it('should calculate 67% for 2 of 3 checked', () => {
    const items = [
      { checked: true },
      { checked: true },
      { checked: false },
    ];
    const result = calculateProgress(items);
    expect(result).toEqual({ checked: 2, total: 3, percentage: 67 });
  });
});
