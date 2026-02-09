'use client';

import {
  Share2,
  Globe,
  Lock,
  ExternalLink,
  Eye,
  MessageSquare,
  Pencil,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useState, useEffect } from 'react';

import { BoardPermission } from '../types';
import { CopyInviteButton } from './CopyInviteButton';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  boardName: string;
}

const PERMISSION_OPTIONS: {
  value: BoardPermission;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'read',
    label: 'Read-only',
    description: 'Can view but cannot make changes',
    icon: <Eye className="h-4 w-4" />,
  },
  {
    value: 'comment',
    label: 'Comment',
    description: 'Can view and add comments',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    value: 'edit',
    label: 'Edit',
    description: 'Can view, comment, and edit',
    icon: <Pencil className="h-4 w-4" />,
  },
];

export function ShareModal({ isOpen, onClose, boardId, boardName }: ShareModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [permission, setPermission] = useState<BoardPermission>('read');
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
        setIsPublic(data.isPublic || false);
        setPermission(data.permission || 'read');
        if (data.shareToken) {
          setInviteLink(`${window.location.origin}/board/shared/${data.shareToken}`);
        }
      } else {
        // Create default settings if not exists
        setIsPublic(false);
        setPermission('read');
        setInviteLink('');
      }
    } catch {
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
        setInviteLink(data.shareUrl);
        setIsPublic(true);
      } else {
        setError('Failed to generate share link');
      }
    } catch {
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
    } catch {
      setError('Failed to update share settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = async (newPermission: BoardPermission) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/boards/${boardId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission: newPermission }),
      });

      if (response.ok) {
        setPermission(newPermission);
      } else {
        setError('Failed to update permission level');
      }
    } catch {
      setError('Failed to update permission level');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedPermissionInfo = () => {
    return PERMISSION_OPTIONS.find(opt => opt.value === permission);
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

          {/* Permission Level Selector */}
          {inviteLink && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Permission Level</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isLoading}>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      {getSelectedPermissionInfo()?.icon}
                      {getSelectedPermissionInfo()?.label}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-full">
                  {PERMISSION_OPTIONS.map(option => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handlePermissionChange(option.value)}
                      className="flex items-start gap-2 p-2"
                    >
                      {option.icon}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">
                Current: {getSelectedPermissionInfo()?.label} —{' '}
                {getSelectedPermissionInfo()?.description}
              </p>
            </div>
          )}
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
