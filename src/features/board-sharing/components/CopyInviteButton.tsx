'use client';

import { Copy, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useState } from 'react';

interface CopyInviteButtonProps {
  inviteLink: string;
}

export function CopyInviteButton({ inviteLink }: CopyInviteButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="flex items-center gap-2">
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>Copy invite link</span>
        </>
      )}
    </Button>
  );
}
