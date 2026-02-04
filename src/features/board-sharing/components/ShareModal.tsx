'use client';

import { Share2, Globe, Lock, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useState, useEffect } from 'react';

import { ShareSettings, UpdateShareSettingsRequest } from '../types';
import { CopyInviteButton } from './CopyInviteButton';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  boardName: string;
}

export function ShareModal({ isOpen, onClose, boardId, boardName }: ShareModalProps) {
  const [shareSettings, setShareSettings] = useState<ShareSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (isOpen && boardId) {
      fetchShareSettings();
    }
  }, [isOpen, boardId]);

  const fetchShareSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/boards/${boardId}/share`);
      if (response.ok) {
        const data = await response.json();
        setShareSettings(data);
        setIsPublic(data.isPublic || false);
        if (data.shareToken) {
          setInviteLink(`${window.location.origin}/board/shared/${data.shareToken}`);
        }
      } else {
        // Create default settings if not exists
        setIsPublic(false);
        setInviteLink('');
      }
    } catch (err) {
      setError('Failed to load share settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/boards/${boardId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setShareSettings(data);
        setInviteLink(data.shareUrl);
        setIsPublic(true);
      } else {
        setError('Failed to generate share link');
      }
    } catch (err) {
      setError('Failed to generate share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    const newIsPublic = !isPublic;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/boards/${boardId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newIsPublic }),
      });

      if (response.ok) {
        setIsPublic(newIsPublic);
      } else {
        setError('Failed to update share settings');
      }
    } catch (err) {
      setError('Failed to update share settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{boardName}"
          </DialogTitle>
          <DialogDescription>
            Share this board with others or generate an invite link.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
        )}

        <div className="space-y-4">
          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-sm font-medium">
                  {isPublic ? 'Public board' : 'Private board'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? 'Anyone with the link can view this board'
                    : 'Only you can access this board'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleTogglePublic} disabled={isLoading}>
              {isPublic ? 'Make Private' : 'Make Public'}
            </Button>
          </div>

          {/* Invite Link Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Invite Link</Label>

            {inviteLink ? (
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="flex-1" />
                <CopyInviteButton inviteLink={inviteLink} />
              </div>
            ) : (
              <Button onClick={handleGenerateLink} disabled={isLoading} className="w-full">
                {isLoading ? 'Generating...' : 'Generate Invite Link'}
              </Button>
            )}

            {inviteLink && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span>Share this link with anyone you want to invite</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
