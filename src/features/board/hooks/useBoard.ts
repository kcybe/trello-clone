import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Board,
  BoardList,
  Column,
  Card,
  Card as CardType,
  ApiBoard,
  ApiColumn,
  ApiCard,
  BoardTemplate,
  ActivityType,
} from '../types';

// API functions
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

async function fetchBoards(): Promise<ApiBoard[]> {
  return fetchApi<ApiBoard[]>('/api/boards');
}

async function createBoardApi(data: { name: string; description?: string; color?: string }): Promise<ApiBoard> {
  return fetchApi<ApiBoard>('/api/boards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function deleteBoardApi(boardId: string): Promise<void> {
  await fetchApi(`/api/boards/${boardId}`, { method: 'DELETE' });
}

async function createColumnApi(boardId: string, name: string): Promise<ApiColumn> {
  return fetchApi<ApiColumn>(`/api/boards/${boardId}/columns`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

async function deleteColumnApi(columnId: string): Promise<void> {
  await fetchApi(`/api/cards/${columnId}`, { method: 'DELETE' });
}

async function createCardApi(columnId: string, data: { title: string; description?: string }): Promise<ApiCard> {
  return fetchApi<ApiCard>('/api/cards', {
    method: 'POST',
    body: JSON.stringify({ ...data, columnId }),
  });
}

async function deleteCardApi(cardId: string): Promise<void> {
  await fetchApi(`/api/cards/${cardId}`, { method: 'DELETE' });
}

// Helper to convert API board to local format
export function apiBoardToLocal(apiBoard: ApiBoard): Board {
  return {
    id: apiBoard.id,
    name: apiBoard.name,
    description: apiBoard.description || undefined,
    color: apiBoard.color || undefined,
    columns: apiBoard.columns.map((apiCol) => ({
      id: apiCol.id,
      name: apiCol.name,
      title: apiCol.name,
      cards: apiCol.cards.map((apiCard) => ({
        id: apiCard.id,
        title: apiCard.title,
        description: apiCard.description || undefined,
        labels: [],
        assignee: apiCard.assignees?.[0]?.name,
        attachments: [],
        checklists: [],
        dueDate: apiCard.dueDate ? new Date(apiCard.dueDate) : null,
        createdAt: new Date(apiCard.createdAt),
        comments: [],
      })),
    })),
    createdAt: new Date(apiBoard.createdAt),
    updatedAt: new Date(apiBoard.updatedAt),
    ownerId: apiBoard.ownerId,
  };
}

// Default columns template
const DEFAULT_COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do', name: 'To Do', cards: [] },
  { id: 'in-progress', title: 'In Progress', name: 'In Progress', cards: [] },
  { id: 'done', title: 'Done', name: 'Done', cards: [] },
];

// Create columns from template names
const createColumnsFromTemplate = (columnNames: string[]): Column[] => {
  return columnNames.map((title, index) => ({
    id: `col-${Date.now()}-${index}`,
    title,
    name: title,
    cards: [],
  }));
};

// Initial board
const createInitialBoard = (name: string = 'My Board', templateColumns?: string[]): Board => ({
  id: `board-${Date.now()}`,
  name,
  description: undefined,
  color: undefined,
  columns: templateColumns ? createColumnsFromTemplate(templateColumns) : DEFAULT_COLUMNS,
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerId: '',
});

// Board templates
export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'kanban',
    name: 'Basic Kanban',
    description: 'Classic 3-column workflow',
    columns: ['To Do', 'In Progress', 'Done'],
  },
  {
    id: 'scrum',
    name: 'Scrum Sprint',
    description: 'Agile sprint workflow with testing',
    columns: ['Backlog', 'Sprint', 'Testing', 'Done'],
  },
  {
    id: 'bug-tracking',
    name: 'Bug Tracking',
    description: 'Track bugs through triage and verification',
    columns: ['New', 'Triage', 'In Progress', 'Fixed', 'Verified'],
  },
];

const STORAGE_KEY = 'trello-clone-boards';

interface UseBoardReturn {
  // State
  boardList: BoardList;
  boardHistory: BoardList[];
  historyIndex: number;
  isLoaded: boolean;

  // Derived
  currentBoard: Board | null;

  // Board CRUD
  createBoard: (name: string, templateColumns?: string[]) => Promise<Board>;
  switchBoard: (boardId: string) => void;
  deleteBoard: (boardId: string) => void;
  duplicateBoard: (boardId: string) => void;

  // Column CRUD
  addColumn: (name: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;

  // Card CRUD
  addCard: (columnId: string, title: string) => void;
  deleteCard: (columnId: string, cardId: string) => void;
  archiveCard: (columnId: string, cardId: string) => void;
  unarchiveCard: (columnId: string, cardId: string) => void;
  permanentlyDeleteCard: (columnId: string, cardId: string) => void;
  duplicateCard: (columnId: string, cardId: string) => void;
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  updateCard: (columnId: string, cardId: string, updates: Partial<Card>) => void;

  // Export
  exportBoard: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // Update helper
  updateCurrentBoard: (updateFn: (board: Board) => Board) => void;
}

export function useBoard(user: { id: string } | null): UseBoardReturn {
  const [boardList, setBoardList] = useState<BoardList>({
    boards: [],
    currentBoardId: null,
  });
  const [boardHistory, setBoardHistory] = useState<BoardList[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoaded, setIsLoaded] = useState(false);
  const MAX_HISTORY = 50;

  // Derived: current board
  const currentBoard = useMemo(() => {
    if (!boardList.currentBoardId) return null;
    return boardList.boards.find((b) => b.id === boardList.currentBoardId) || null;
  }, [boardList]);

  // Helper to push to history
  const pushToHistory = useCallback(
    (newBoardList: BoardList) => {
      const newHistory = boardHistory.slice(0, historyIndex + 1);
      newHistory.push(newBoardList);
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      setBoardHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setBoardList(newBoardList);
    },
    [boardHistory, historyIndex]
  );

  // Board CRUD operations
  const createBoard = useCallback(
    async (name: string, templateColumns?: string[]) => {
      try {
        if (user) {
          // Use API when signed in
          const apiBoard = await createBoardApi({ name });
          const newBoard = apiBoardToLocal(apiBoard);
          const newList: BoardList = {
            boards: [...boardList.boards, newBoard],
            currentBoardId: newBoard.id,
          };
          pushToHistory(newList);
          return newBoard;
        }
      } catch (error) {
        console.error('Failed to create board via API:', error);
      }

      // Local creation fallback
      const newBoard = createInitialBoard(name, templateColumns);
      const newList: BoardList = {
        boards: [...boardList.boards, newBoard],
        currentBoardId: newBoard.id,
      };
      pushToHistory(newList);
      return newBoard;
    },
    [boardList.boards, pushToHistory, user]
  );

  const switchBoard = useCallback(
    (boardId: string) => {
      const newList: BoardList = {
        ...boardList,
        currentBoardId: boardId,
      };
      pushToHistory(newList);
    },
    [boardList, pushToHistory]
  );

  const deleteBoard = useCallback(
    async (boardId: string) => {
      try {
        if (user) {
          await deleteBoardApi(boardId);
        }
      } catch (error) {
        console.error('Failed to delete board via API:', error);
      }

      const newBoards = boardList.boards.filter((b) => b.id !== boardId);
      let newCurrentId = boardList.currentBoardId;
      if (boardId === boardList.currentBoardId) {
        newCurrentId = newBoards[0]?.id || null;
      }
      const newList: BoardList = {
        boards: newBoards,
        currentBoardId: newCurrentId,
      };
      pushToHistory(newList);
    },
    [boardList, pushToHistory, user]
  );

  const duplicateBoard = useCallback(
    (boardId: string) => {
      const original = boardList.boards.find((b) => b.id === boardId);
      if (!original) return;

      const newBoard: Board = {
        ...original,
        id: `board-${Date.now()}`,
        name: `${original.name} (Copy)`,
        createdAt: new Date(),
      };

      const newList: BoardList = {
        boards: [...boardList.boards, newBoard],
        currentBoardId: newBoard.id,
      };
      pushToHistory(newList);
    },
    [boardList, pushToHistory]
  );

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBoardList(boardHistory[newIndex]);
    }
  }, [historyIndex, boardHistory]);

  const redo = useCallback(() => {
    if (historyIndex < boardHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBoardList(boardHistory[newIndex]);
    }
  }, [historyIndex, boardHistory]);

  // Helper to update current board
  const updateCurrentBoard = useCallback(
    (updateFn: (board: Board) => Board) => {
      const newBoards = boardList.boards.map((b) => {
        if (b.id !== boardList.currentBoardId) return b;
        return updateFn(b);
      });
      pushToHistory({ ...boardList, boards: newBoards });
    },
    [boardList, pushToHistory]
  );

  // Column CRUD
  const addColumn = useCallback(
    async (name: string) => {
      if (!currentBoard) return;

      try {
        if (user) {
          await createColumnApi(currentBoard.id, name.trim());
        }
      } catch (error) {
        console.error('Failed to create column via API:', error);
      }

      const newColumn: Column = {
        id: `col-${Date.now()}`,
        title: name.trim(),
        cards: [],
      };

      updateCurrentBoard((board) => ({
        ...board,
        columns: [...board.columns, newColumn],
      }));
    },
    [currentBoard, updateCurrentBoard, user]
  );

  const deleteColumn = useCallback(
    async (columnId: string) => {
      if (!currentBoard) return;

      try {
        if (user) {
          await deleteColumnApi(columnId);
        }
      } catch (error) {
        console.error('Failed to delete column via API:', error);
      }

      updateCurrentBoard((board) => ({
        ...board,
        columns: board.columns.filter((col) => col.id !== columnId),
      }));
    },
    [currentBoard, updateCurrentBoard, user]
  );

  // Card CRUD
  const addCard = useCallback((columnId: string, title: string) => {
    if (!currentBoard) return;

    const newCard: CardType = {
      id: `card-${Date.now()}`,
      title: title.trim(),
      createdAt: new Date(),
      labels: [],
      assignee: undefined,
      attachments: [],
      checklists: [],
      dueDate: null,
      comments: [],
    };

    updateCurrentBoard((board) => ({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col
      ),
    }));
  }, [currentBoard, updateCurrentBoard]);

  const deleteCard = useCallback((columnId: string, cardId: string) => {
    if (!currentBoard) return;

    const column = currentBoard.columns.find((col) => col.id === columnId);
    const card = column?.cards.find((c) => c.id === cardId);
    if (!card) return;

    updateCurrentBoard((board) => ({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: col.cards.filter((c) => c.id !== cardId),
              archivedCards: [...(col.archivedCards || []), { ...card, archived: true }],
            }
          : col
      ),
    }));
  }, [currentBoard, updateCurrentBoard]);

  const archiveCard = useCallback((columnId: string, cardId: string) => {
    if (!currentBoard) return;

    const column = currentBoard.columns.find((col) => col.id === columnId);
    const card = column?.cards.find((c) => c.id === cardId);
    if (!card) return;

    updateCurrentBoard((board) => ({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: col.cards.filter((c) => c.id !== cardId),
              archivedCards: [...(col.archivedCards || []), { ...card, archived: true }],
            }
          : col
      ),
    }));
  }, [currentBoard, updateCurrentBoard]);

  const unarchiveCard = useCallback((columnId: string, cardId: string) => {
    if (!currentBoard) return;

    const column = currentBoard.columns.find((col) => col.id === columnId);
    const card = column?.archivedCards?.find((c) => c.id === cardId);
    if (!card) return;

    updateCurrentBoard((board) => ({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: [...col.cards, { ...card, archived: false }],
              archivedCards: col.archivedCards?.filter((c) => c.id !== cardId) || [],
            }
          : col
      ),
    }));
  }, [currentBoard, updateCurrentBoard]);

  const permanentlyDeleteCard = useCallback((columnId: string, cardId: string) => {
    if (!currentBoard) return;

    updateCurrentBoard((board) => ({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId
          ? { ...col, archivedCards: col.archivedCards?.filter((c) => c.id !== cardId) || [] }
          : col
      ),
    }));
  }, [currentBoard, updateCurrentBoard]);

  const duplicateCard = useCallback((columnId: string, cardId: string) => {
    if (!currentBoard) return;

    const column = currentBoard.columns.find((col) => col.id === columnId);
    const card = column?.cards.find((c) => c.id === cardId);
    if (!card) return;

    const cardIndex = column?.cards.findIndex((c) => c.id === cardId);
    const newCard: CardType = {
      ...card,
      id: `card-${Date.now()}`,
      title: `${card.title} (Copy)`,
      createdAt: new Date(),
      comments: [],
    };

    if (cardIndex === undefined || cardIndex === -1) return;

    updateCurrentBoard((board) => ({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: [
                ...col.cards.slice(0, cardIndex + 1),
                newCard,
                ...col.cards.slice(cardIndex + 1),
              ],
            }
          : col
      ),
    }));
  }, [currentBoard, updateCurrentBoard]);

  const moveCard = useCallback((cardId: string, fromColumnId: string, toColumnId: string) => {
    if (!currentBoard || fromColumnId === toColumnId) return;

    const fromColumn = currentBoard.columns.find((col) => col.id === fromColumnId);
    const card = fromColumn?.cards.find((c) => c.id === cardId);
    if (!card) return;

    updateCurrentBoard((board) => ({
      ...board,
      columns: board.columns.map((col) => {
        if (col.id === fromColumnId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        if (col.id === toColumnId) {
          return { ...col, cards: [...col.cards, card] };
        }
        return col;
      }),
    }));
  }, [currentBoard, updateCurrentBoard]);

  const updateCard = useCallback((columnId: string, cardId: string, updates: Partial<Card>) => {
    if (!currentBoard) return;

    updateCurrentBoard((board) => ({
      ...board,
      columns: board.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: col.cards.map((card) =>
                card.id === cardId ? { ...card, ...updates } : card
              ),
            }
          : col
      ),
    }));
  }, [currentBoard, updateCurrentBoard]);

  // Export board
  const exportBoard = useCallback(() => {
    if (!currentBoard) return;

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      board: {
        id: currentBoard.id,
        name: currentBoard.name,
        columns: currentBoard.columns.map((col) => ({
          ...col,
          cards: col.cards.map((card) => ({
            ...card,
            dueDate: card.dueDate ? new Date(card.dueDate).toISOString() : null,
            createdAt: new Date(card.createdAt).toISOString(),
            archived: card.archived || false,
          })),
          archivedCards: col.archivedCards?.map((card) => ({
            ...card,
            dueDate: card.dueDate ? new Date(card.dueDate).toISOString() : null,
            createdAt: new Date(card.createdAt).toISOString(),
            archived: true,
          })) || [],
        })),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBoard.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentBoard]);

  // Load boards from API or localStorage
  useEffect(() => {
    async function loadBoards() {
      try {
        // Try to fetch boards from API
        const apiBoards = await fetchBoards();
        const boards = apiBoards.map(apiBoardToLocal);
        setBoardList({
          boards,
          currentBoardId: boards[0]?.id || null,
        });
      } catch {
        // Fallback to localStorage if API fails (not authenticated)
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.columns) {
              const oldBoard = parsed;
              oldBoard.columns.forEach((col: Column) => {
                col.cards.forEach((card: Card) => {
                  card.createdAt = new Date(card.createdAt);
                  if (card.dueDate) card.dueDate = new Date(card.dueDate);
                });
              });
              const newBoardList: BoardList = {
                boards: [
                  { ...oldBoard, id: `board-${Date.now()}`, name: 'My Board', createdAt: new Date() },
                ],
                currentBoardId: oldBoard.id,
              };
              newBoardList.boards[0].id = `board-${Date.now()}`;
              setBoardList(newBoardList);
            } else {
              const boardListData = parsed as BoardList;
              boardListData.boards.forEach((board) => {
                board.createdAt = new Date(board.createdAt);
                board.columns.forEach((col) => {
                  col.cards.forEach((card) => {
                    card.createdAt = new Date(card.createdAt);
                    if (card.dueDate) card.dueDate = new Date(card.dueDate);
                  });
                });
              });
              setBoardList(boardListData);
            }
          } catch (e) {
            const initial = createInitialBoard();
            setBoardList({ boards: [initial], currentBoardId: initial.id });
          }
        } else {
          const initial = createInitialBoard();
          setBoardList({ boards: [initial], currentBoardId: initial.id });
        }
      }
      setIsLoaded(true);
    }

    loadBoards();
  }, []);

  // Save boardList to local storage (fallback for offline)
  useEffect(() => {
    if (isLoaded && boardList) {
      // Convert for localStorage (handle Date objects)
      const boardListForStorage = {
        boards: boardList.boards.map((board) => ({
          ...board,
          createdAt:
            board.createdAt instanceof Date ? board.createdAt.getTime() : board.createdAt,
        })),
        currentBoardId: boardList.currentBoardId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(boardListForStorage));
    }
  }, [boardList, isLoaded]);

  return {
    boardList,
    boardHistory,
    historyIndex,
    isLoaded,
    currentBoard,
    createBoard,
    switchBoard,
    deleteBoard,
    duplicateBoard,
    addColumn,
    deleteColumn,
    addCard,
    deleteCard,
    archiveCard,
    unarchiveCard,
    permanentlyDeleteCard,
    duplicateCard,
    moveCard,
    updateCard,
    exportBoard,
    undo,
    redo,
    updateCurrentBoard,
  };
}
