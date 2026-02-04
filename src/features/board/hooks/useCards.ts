import { useState, useCallback } from 'react';
import {
  Card,
  CardLabel,
  CardAttachment,
  Checklist,
  ChecklistItem,
  Comment,
  LabelColor,
  ActivityType,
  Activity,
} from '../types';

// Label colors
export const LABEL_COLORS: LabelColor[] = [
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Purple', value: 'bg-purple-500' },
];

// Member suggestions
export const MEMBER_SUGGESTIONS = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];

interface EditingCardState {
  id: string;
  title: string;
  description: string;
  labels: CardLabel[];
  assignee: string | undefined;
  attachments: CardAttachment[];
  checklists: Checklist[];
  dueDate: string;
  columnId: string;
  comments: Comment[];
  color: string;
}

interface UseCardsReturn {
  // State
  editingCard: EditingCardState | null;
  descTab: 'edit' | 'preview';
  newLabelText: string;
  newMemberName: string;
  showMemberSuggestions: boolean;
  newAttachmentUrl: string;
  newAttachmentName: string;
  newChecklistTitle: string;
  newChecklistItem: string;
  newCommentAuthor: string;
  newCommentText: string;
  
  // Actions
  openEditCard: (card: Card, columnId: string) => void;
  closeEditCard: () => void;
  updateCardTitle: (title: string) => void;
  updateCardDescription: (description: string) => void;
  setDescTab: (tab: 'edit' | 'preview') => void;
  
  // Label actions
  addLabel: () => void;
  removeLabel: (labelId: string) => void;
  setNewLabelText: (text: string) => void;
  
  // Member actions
  addMember: () => void;
  removeMember: () => void;
  setNewMemberName: (name: string) => void;
  setShowMemberSuggestions: (show: boolean) => void;
  
  // Attachment actions
  addAttachment: () => void;
  removeAttachment: (attachmentId: string) => void;
  setNewAttachmentUrl: (url: string) => void;
  setNewAttachmentName: (name: string) => void;
  
  // Checklist actions
  addChecklist: () => void;
  removeChecklist: (checklistId: string) => void;
  setNewChecklistTitle: (title: string) => void;
  addChecklistItem: (checklistId: string) => void;
  removeChecklistItem: (checklistId: string, itemId: string) => void;
  toggleChecklistItem: (checklistId: string, itemId: string) => void;
  setNewChecklistItem: (text: string) => void;
  
  // Comment actions
  addComment: () => void;
  deleteComment: (commentId: string) => void;
  setNewCommentAuthor: (author: string) => void;
  setNewCommentText: (text: string) => void;
  
  // Color and date
  setColor: (color: string) => void;
  setDueDate: (date: string) => void;
  
  // Helpers
  getChecklistProgress: (checklist: Checklist) => { checked: number; total: number } | null;
  clearCommentForm: () => void;
}

export function useCards(): UseCardsReturn {
  const [editingCard, setEditingCard] = useState<EditingCardState | null>(null);
  const [descTab, setDescTab] = useState<'edit' | 'preview'>('edit');
  const [newLabelText, setNewLabelText] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  const openEditCard = useCallback((card: Card, columnId: string) => {
    setDescTab('edit');
    setEditingCard({
      id: card.id,
      title: card.title,
      description: card.description || '',
      labels: card.labels || [],
      assignee: card.assignee || '',
      attachments: card.attachments || [],
      checklists: card.checklists || [],
      dueDate: card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '',
      columnId,
      comments: card.comments || [],
      color: card.color || '',
    });
  }, []);

  const closeEditCard = useCallback(() => {
    setEditingCard(null);
  }, []);

  const updateCardTitle = useCallback((title: string) => {
    setEditingCard((prev) => (prev ? { ...prev, title } : null));
  }, []);

  const updateCardDescription = useCallback((description: string) => {
    setEditingCard((prev) => (prev ? { ...prev, description } : null));
  }, []);

  // Label actions
  const addLabel = useCallback(() => {
    if (!newLabelText.trim() || !editingCard) return;

    const newLabel: CardLabel = {
      id: `label-${Date.now()}`,
      text: newLabelText.trim(),
      color: LABEL_COLORS[editingCard.labels.length % LABEL_COLORS.length].value,
    };

    setEditingCard({
      ...editingCard,
      labels: [...editingCard.labels, newLabel],
    });

    setNewLabelText('');
  }, [newLabelText, editingCard]);

  const removeLabel = useCallback((labelId: string) => {
    setEditingCard((prev) =>
      prev
        ? {
            ...prev,
            labels: prev.labels.filter((l) => l.id !== labelId),
          }
        : null
    );
  }, []);

  // Member actions
  const addMember = useCallback(() => {
    if (!newMemberName.trim() || !editingCard) return;
    setEditingCard({ ...editingCard, assignee: newMemberName.trim() });
    setNewMemberName('');
    setShowMemberSuggestions(false);
  }, [newMemberName, editingCard]);

  const removeMember = useCallback(() => {
    setEditingCard((prev) => (prev ? { ...prev, assignee: undefined } : null));
  }, []);

  // Attachment actions
  const addAttachment = useCallback(() => {
    if (!newAttachmentUrl.trim() || !editingCard) return;
    const newAttachment: CardAttachment = {
      id: `attach-${Date.now()}`,
      name: newAttachmentName.trim() || 'Attachment',
      url: newAttachmentUrl.trim(),
      type: 'link',
    };
    setEditingCard({
      ...editingCard,
      attachments: [...(editingCard.attachments || []), newAttachment],
    });
    setNewAttachmentUrl('');
    setNewAttachmentName('');
  }, [newAttachmentUrl, newAttachmentName, editingCard]);

  const removeAttachment = useCallback((attachmentId: string) => {
    setEditingCard((prev) =>
      prev
        ? {
            ...prev,
            attachments: prev.attachments.filter((a) => a.id !== attachmentId),
          }
        : null
    );
  }, []);

  // Checklist actions
  const addChecklist = useCallback(() => {
    if (!newChecklistTitle.trim() || !editingCard) return;
    const newChecklist: Checklist = {
      id: `check-${Date.now()}`,
      title: newChecklistTitle.trim(),
      items: [],
    };
    setEditingCard({
      ...editingCard,
      checklists: [...(editingCard.checklists || []), newChecklist],
    });
    setNewChecklistTitle('');
  }, [newChecklistTitle, editingCard]);

  const removeChecklist = useCallback((checklistId: string) => {
    setEditingCard((prev) =>
      prev
        ? {
            ...prev,
            checklists: prev.checklists.filter((c) => c.id !== checklistId),
          }
        : null
    );
  }, []);

  const addChecklistItem = useCallback(
    (checklistId: string) => {
      if (!newChecklistItem.trim() || !editingCard) return;
      setEditingCard({
        ...editingCard,
        checklists: editingCard.checklists.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: [
                  ...c.items,
                  { id: `item-${Date.now()}`, text: newChecklistItem.trim(), checked: false },
                ],
              }
            : c
        ),
      });
      setNewChecklistItem('');
    },
    [newChecklistItem, editingCard]
  );

  const removeChecklistItem = useCallback((checklistId: string, itemId: string) => {
    setEditingCard((prev) =>
      prev
        ? {
            ...prev,
            checklists: prev.checklists.map((c) =>
              c.id === checklistId
                ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
                : c
            ),
          }
        : null
    );
  }, []);

  const toggleChecklistItem = useCallback((checklistId: string, itemId: string) => {
    setEditingCard((prev) =>
      prev
        ? {
            ...prev,
            checklists: prev.checklists.map((c) =>
              c.id === checklistId
                ? {
                    ...c,
                    items: c.items.map((i) =>
                      i.id === itemId ? { ...i, checked: !i.checked } : i
                    ),
                  }
                : c
            ),
          }
        : null
    );
  }, []);

  // Comment actions
  const addComment = useCallback(() => {
    if (!newCommentText.trim() || !newCommentAuthor.trim() || !editingCard) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: newCommentAuthor.trim(),
      text: newCommentText.trim(),
      createdAt: new Date(),
    };
    setEditingCard({
      ...editingCard,
      comments: [...(editingCard.comments || []), newComment],
    });
    setNewCommentText('');
  }, [newCommentAuthor, newCommentText, editingCard]);

  const deleteComment = useCallback((commentId: string) => {
    setEditingCard((prev) =>
      prev
        ? {
            ...prev,
            comments: prev.comments.filter((c) => c.id !== commentId),
          }
        : null
    );
  }, []);

  const clearCommentForm = useCallback(() => {
    setNewCommentAuthor('');
    setNewCommentText('');
  }, []);

  // Color and date
  const setColor = useCallback((color: string) => {
    setEditingCard((prev) => (prev ? { ...prev, color } : null));
  }, []);

  const setDueDate = useCallback((date: string) => {
    setEditingCard((prev) => (prev ? { ...prev, dueDate: date } : null));
  }, []);

  // Helpers
  const getChecklistProgress = useCallback((checklist: Checklist) => {
    if (checklist.items.length === 0) return null;
    const checked = checklist.items.filter((i) => i.checked).length;
    return { checked, total: checklist.items.length };
  }, []);

  return {
    editingCard,
    descTab,
    newLabelText,
    newMemberName,
    showMemberSuggestions,
    newAttachmentUrl,
    newAttachmentName,
    newChecklistTitle,
    newChecklistItem,
    newCommentAuthor,
    newCommentText,
    openEditCard,
    closeEditCard,
    updateCardTitle,
    updateCardDescription,
    setDescTab,
    addLabel,
    removeLabel,
    setNewLabelText,
    addMember,
    removeMember,
    setNewMemberName,
    setShowMemberSuggestions,
    addAttachment,
    removeAttachment,
    setNewAttachmentUrl,
    setNewAttachmentName,
    addChecklist,
    removeChecklist,
    setNewChecklistTitle,
    addChecklistItem,
    removeChecklistItem,
    toggleChecklistItem,
    setNewChecklistItem,
    addComment,
    deleteComment,
    setNewCommentAuthor,
    setNewCommentText,
    setColor,
    setDueDate,
    getChecklistProgress,
    clearCommentForm,
  };
}

// Activity helper hook
export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const ACTIVITIES_STORAGE_KEY = 'trello-clone-activities';

  // Load activities from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActivities(
          parsed.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp),
          }))
        );
      } catch (e) {
        console.error('Failed to load activities', e);
      }
    }
  }, []);

  // Save activities to localStorage
  useEffect(() => {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  // Add activity helper function
  const addActivity = useCallback(
    (
      type: ActivityType,
      cardId: string,
      cardTitle: string,
      options?: {
        fromColumnId?: string;
        fromColumnName?: string;
        toColumnId?: string;
        toColumnName?: string;
        description?: string;
        user?: string;
      }
    ) => {
      const newActivity: Activity = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        cardId,
        cardTitle,
        timestamp: new Date(),
        user: options?.user || 'Current User',
        fromColumnId: options?.fromColumnId,
        fromColumnName: options?.fromColumnName,
        toColumnId: options?.toColumnId,
        toColumnName: options?.toColumnName,
        description: options?.description,
      };
      setActivities((prev) => [newActivity, ...prev].slice(0, 100)); // Keep last 100 activities
    },
    []
  );

  return { activities, addActivity };
}
