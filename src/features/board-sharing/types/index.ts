// Board sharing types
export interface ShareSettings {
  boardId: string;
  isPublic: boolean;
  shareToken: string | null;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShareLinkResponse {
  shareUrl: string;
  shareToken: string;
}

export interface UpdateShareSettingsRequest {
  isPublic?: boolean;
  canEdit?: boolean;
}

export interface ShareState {
  isOpen: boolean;
  shareSettings: ShareSettings | null;
  isLoading: boolean;
  error: string | null;
  copied: boolean;
}
