import type { Board, Column, Card, CardLabel, CardAttachment, Checklist, ChecklistItem, Comment } from "@/types";

export interface BoardExportData {
  version: string;
  exportedAt: string;
  board: {
    columns: Array<{
      id: string;
      title: string;
      cards: Array<{
        id: string;
        title: string;
        description?: string;
        labels?: CardLabel[];
        assignee?: string;
        attachments?: CardAttachment[];
        checklists?: Checklist[];
        dueDate: string | null;
        createdAt: string;
        comments?: Comment[];
        archived?: boolean;
        color?: string;
      }>;
      archivedCards?: Array<{
        id: string;
        title: string;
        description?: string;
        labels?: CardLabel[];
        assignee?: string;
        attachments?: CardAttachment[];
        checklists?: Checklist[];
        dueDate: string | null;
        createdAt: string;
        comments?: Comment[];
        archived: boolean;
        color?: string;
      }>;
    }>;
  };
}

/**
 * Export board to JSON format
 */
export function exportBoardToJSON(board: Board): string {
  const exportData: BoardExportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    board: {
      columns: board.columns.map((col) => ({
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

  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate a new unique ID
 */
function generateNewId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a mapping of old IDs to new IDs for a card
 */
function createIdMapping(): Record<string, string> {
  return {};
}

/**
 * Import board from JSON format
 */
export function importBoardFromJSON(jsonData: string): { success: boolean; board?: Board; error?: string } {
  try {
    const parsed = JSON.parse(jsonData);

    // Validate basic structure
    if (!parsed.version || !parsed.board || !parsed.board.columns) {
      return { success: false, error: "Invalid board format: missing version or columns" };
    }

    if (parsed.version !== "1.0") {
      return { success: false, error: "Unsupported board version" };
    }

    // ID mapping to avoid duplicates
    const idMapping: Record<string, string> = {};

    // Map old IDs to new IDs
    const mapId = (oldId: string, prefix: string): string => {
      if (!idMapping[oldId]) {
        idMapping[oldId] = generateNewId(prefix);
      }
      return idMapping[oldId];
    };

    // Transform the imported data
    const importedBoard: Board = {
      id: generateNewId("board"),
      title: "Imported Board",
      description: `Imported on ${new Date().toLocaleDateString()}`,
      isPublic: false,
      columns: parsed.board.columns.map((col: any) => {
        const newColumnId = mapId(col.id, "col");

        return {
          id: newColumnId,
          title: col.title,
          cards: (col.cards || []).map((card: any) => ({
            id: mapId(card.id, "card"),
            title: card.title,
            description: card.description,
            labels: (card.labels || []).map((label: CardLabel) => ({
              ...label,
              id: generateNewId("label"),
            })),
            assignee: card.assignee,
            attachments: (card.attachments || []).map((att: CardAttachment) => ({
              ...att,
              id: generateNewId("attach"),
            })),
            checklists: (card.checklists || []).map((checklist: Checklist) => ({
              ...checklist,
              id: generateNewId("check"),
              items: checklist.items.map((item: ChecklistItem) => ({
                ...item,
                id: generateNewId("item"),
              })),
            })),
            dueDate: card.dueDate ? new Date(card.dueDate) : null,
            createdAt: new Date(card.createdAt),
            comments: (card.comments || []).map((comment: Comment) => ({
              ...comment,
              id: generateNewId("comment"),
              createdAt: new Date(comment.createdAt),
            })),
            archived: card.archived || false,
            color: card.color,
          })),
          archivedCards: (col.archivedCards || []).map((card: any) => ({
            id: mapId(card.id, "card"),
            title: card.title,
            description: card.description,
            labels: (card.labels || []).map((label: CardLabel) => ({
              ...label,
              id: generateNewId("label"),
            })),
            assignee: card.assignee,
            attachments: (card.attachments || []).map((att: CardAttachment) => ({
              ...att,
              id: generateNewId("attach"),
            })),
            checklists: (card.checklists || []).map((checklist: Checklist) => ({
              ...checklist,
              id: generateNewId("check"),
              items: checklist.items.map((item: ChecklistItem) => ({
                ...item,
                id: generateNewId("item"),
              })),
            })),
            dueDate: card.dueDate ? new Date(card.dueDate) : null,
            createdAt: new Date(card.createdAt),
            comments: (card.comments || []).map((comment: Comment) => ({
              ...comment,
              id: generateNewId("comment"),
              createdAt: new Date(comment.createdAt),
            })),
            archived: true,
            color: card.color,
          })),
        };
      }),
    };

    return { success: true, board: importedBoard };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: "Invalid JSON format" };
    }
    return { success: false, error: `Failed to parse board: ${error}` };
  }
}

/**
 * Download board as JSON file
 */
export function downloadBoardAsJSON(board: Board, filename?: string): void {
  const json = exportBoardToJSON(board);
  const defaultFilename = filename || `board-${new Date().toISOString().split("T")[0]}.json`;
  
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultFilename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Validate imported file before processing
 */
export function validateBoardImport(file: File): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Check required fields
        if (!parsed.version) {
          resolve({ valid: false, error: "Missing version field" });
          return;
        }
        
        if (!parsed.board) {
          resolve({ valid: false, error: "Missing board data" });
          return;
        }
        
        if (!parsed.board.columns || !Array.isArray(parsed.board.columns)) {
          resolve({ valid: false, error: "Invalid columns format" });
          return;
        }
        
        resolve({ valid: true });
      } catch (error) {
        resolve({ valid: false, error: "Invalid JSON file" });
      }
    };
    
    reader.onerror = () => {
      resolve({ valid: false, error: "Failed to read file" });
    };
    
    reader.readAsText(file);
  });
}
