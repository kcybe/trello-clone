// Board permission levels
export type BoardPermission = 'read' | 'comment' | 'edit';

// Board sharing types
export interface ShareSettings {
  boardId: string;
  isPublic: boolean;
  shareToken: string | null;
  permission: BoardPermission;
  createdAt: string;
  updatedAt: string;
}

export interface ShareLinkResponse {
  shareUrl: string;
  shareToken: string;
}

export interface UpdateShareSettingsRequest {
  isPublic?: boolean;
  permission?: BoardPermission;
}

export interface ShareState {
  isOpen: boolean;
  shareSettings: ShareSettings | null;
  isLoading: boolean;
  error: string | null;
  copied: boolean;
}
