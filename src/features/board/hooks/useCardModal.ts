import { CardModalProps, Card, CardAttachment, Checklist } from '@/types';

export interface UseCardModalOptions {
  editingCard: {
    card: Card;
    columnId: string;
    index: number;
  } | null;
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
  onClose: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onSetDescTab: (tab: 'edit' | 'preview') => void;
  onAddLabel: () => void;
  onRemoveLabel: (labelId: string) => void;
  onSetNewLabelText: (text: string) => void;
  onAddMember: () => void;
  onRemoveMember: () => void;
  onSetNewMemberName: (name: string) => void;
  onSetShowMemberSuggestions: (show: boolean) => void;
  onAddAttachment: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onSetNewAttachmentUrl: (url: string) => void;
  onSetNewAttachmentName: (name: string) => void;
  onAddUploadedAttachment: (attachment: CardAttachment) => void;
  onAddChecklist: () => void;
  onRemoveChecklist: (checklistId: string) => void;
  onSetNewChecklistTitle: (title: string) => void;
  onAddChecklistItem: (checklistId: string) => void;
  onRemoveChecklistItem: (checklistId: string, itemId: string) => void;
  onToggleChecklistItem: (checklistId: string, itemId: string) => void;
  onSetNewChecklistItem: (text: string) => void;
  onAddComment: () => void;
  onDeleteComment: (commentId: string) => void;
  onSetNewCommentAuthor: (author: string) => void;
  onSetNewCommentText: (text: string) => void;
  onSetColor: (color: string) => void;
  onSetDueDate: (date: string) => void;
  getChecklistProgress: (checklist: Checklist) => { checked: number; total: number } | null;
  onSave: () => void;
}

export function useCardModal(options: UseCardModalOptions): CardModalProps {
  const editingCard = options.editingCard?.card
    ? {
        id: options.editingCard.card.id,
        title: options.editingCard.card.title,
        description: options.editingCard.card.description,
        labels: options.editingCard.card.labels,
        assignee: options.editingCard.card.assignee,
        attachments: options.editingCard.card.attachments,
        checklists: options.editingCard.card.checklists,
        dueDate: options.editingCard.card.dueDate,
        columnId: options.editingCard.columnId,
        comments: options.editingCard.card.comments,
        color: options.editingCard.card.color,
      }
    : null;

  return {
    isOpen: !!editingCard,
    editingCard,
    descTab: options.descTab,
    newLabelText: options.newLabelText,
    newMemberName: options.newMemberName,
    showMemberSuggestions: options.showMemberSuggestions,
    newAttachmentUrl: options.newAttachmentUrl,
    newAttachmentName: options.newAttachmentName,
    newChecklistTitle: options.newChecklistTitle,
    newChecklistItem: options.newChecklistItem,
    newCommentAuthor: options.newCommentAuthor,
    newCommentText: options.newCommentText,
    onClose: options.onClose,
    onUpdateTitle: options.onUpdateTitle,
    onUpdateDescription: options.onUpdateDescription,
    onSetDescTab: options.onSetDescTab,
    onAddLabel: options.onAddLabel,
    onRemoveLabel: options.onRemoveLabel,
    onSetNewLabelText: options.onSetNewLabelText,
    onAddMember: options.onAddMember,
    onRemoveMember: options.onRemoveMember,
    onSetNewMemberName: options.onSetNewMemberName,
    onSetShowMemberSuggestions: options.onSetShowMemberSuggestions,
    onAddAttachment: options.onAddAttachment,
    onRemoveAttachment: options.onRemoveAttachment,
    onSetNewAttachmentUrl: options.onSetNewAttachmentUrl,
    onSetNewAttachmentName: options.onSetNewAttachmentName,
    onAddUploadedAttachment: options.onAddUploadedAttachment,
    onAddChecklist: options.onAddChecklist,
    onRemoveChecklist: options.onRemoveChecklist,
    onSetNewChecklistTitle: options.onSetNewChecklistTitle,
    onAddChecklistItem: options.onAddChecklistItem,
    onRemoveChecklistItem: options.onRemoveChecklistItem,
    onToggleChecklistItem: options.onToggleChecklistItem,
    onSetNewChecklistItem: options.onSetNewChecklistItem,
    onAddComment: options.onAddComment,
    onDeleteComment: options.onDeleteComment,
    onSetNewCommentAuthor: options.onSetNewCommentAuthor,
    onSetNewCommentText: options.onSetNewCommentText,
    onSetColor: options.onSetColor,
    onSetDueDate: options.onSetDueDate,
    getChecklistProgress: options.getChecklistProgress,
    onSave: options.onSave,
  };
}
