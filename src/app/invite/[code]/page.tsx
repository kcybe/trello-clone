'use client';

import { X, Users, Link2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Board, Column, Card, CardLabel, CardAttachment, Checklist } from '@/types';

import { useEffect, useState, use } from 'react';

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

interface InviteBoardResponse {
  board: Board;
  shareToken: string;
  canEdit: boolean;
  isMember: boolean;
  isOwner: boolean;
}

export default function InvitePage({ params }: InvitePageProps) {
  const resolvedParams = use(params);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await fetch(`/api/invite/${resolvedParams.code}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load board');
        }
        const data: InviteBoardResponse = await response.json();
        setBoard(data.board);
        setIsMember(data.isMember);
        setIsOwner(data.isOwner);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load board');
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [resolvedParams.code]);

  const handleAcceptInvite = async () => {
    setAccepting(true);
    try {
      const response = await fetch(`/api/invite/${resolvedParams.code}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept invite');
      }

      setIsMember(true);
      // Redirect to the board
      router.push('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Oops!</h1>
          <p className="text-muted-foreground mb-4">{error || 'Board not found'}</p>
          <Link href="/">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold text-lg hover:underline">
              Trello Clone
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-medium">{board.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOwner ? (
              <Link href={`/board/${board.id}`}>
                <Button variant="outline" size="sm">
                  Open in Editor
                </Button>
              </Link>
            ) : isMember ? (
              <Link href="/">
                <Button variant="outline" size="sm">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Button onClick={handleAcceptInvite} disabled={accepting}>
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Accept Invite
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Board Content - Read Only */}
      <div className="p-4 overflow-x-auto h-[calc(100vh-64px)]">
        <div className="flex gap-4 h-full">
          {board.columns.map(column => (
            <div key={column.id} className="w-72 flex-shrink-0 bg-muted/50 rounded-lg p-3">
              <h3 className="font-medium text-sm mb-3 px-1">{column.name}</h3>
              <div className="space-y-2">
                {column.cards.map(card => (
                  <ReadOnlyCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Read-only banner */}
      <div className="fixed bottom-4 right-4 bg-muted/90 px-4 py-2 rounded-full text-sm text-muted-foreground">
        Read-only view {isMember ? '(You are a member)' : ''}
      </div>
    </div>
  );
}

function ReadOnlyCard({ card }: { card: Card }) {
  return (
    <div className="bg-background rounded-md p-3 shadow-sm border cursor-default hover:shadow-md transition-shadow">
      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map(label => (
            <span
              key={label.id}
              className={`${label.color} text-white text-xs px-2 py-0.5 rounded-full`}
            >
              {label.text}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="font-medium text-sm mb-2">{card.title}</h4>

      {/* Badges */}
      <div className="flex items-center gap-3 text-muted-foreground">
        {card.attachments && card.attachments.length > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Link2 className="h-3 w-3" />
            <span>{card.attachments.length}</span>
          </div>
        )}
        {card.checklists && card.checklists.length > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <span>
              ✓ {card.checklists.reduce((acc, c) => acc + c.items.filter(i => i.checked).length, 0)}
              /{card.checklists.reduce((acc, c) => acc + c.items.length, 0)}
            </span>
          </div>
        )}
        {card.dueDate && (
          <div className="flex items-center gap-1 text-xs">
            <span>📅 {new Date(card.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
