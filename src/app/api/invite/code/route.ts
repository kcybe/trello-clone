import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/invite/code - Get board by invite code
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;

    // Find the board share by token
    const boardShare = await prisma.boardShare.findUnique({
      where: { shareToken: code },
      include: {
        board: {
          include: {
            columns: {
              include: {
                cards: {
                  orderBy: { position: 'asc' },
                },
              },
              orderBy: { position: 'asc' },
            },
            owner: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (!boardShare) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if share is public
    if (!boardShare.isPublic) {
      return NextResponse.json({ error: 'This invite link is no longer active' }, { status: 403 });
    }

    // Get current user session (if logged in)
    const session = await auth.api.getSession({ headers: req.headers });
    const isMember = session?.user
      ? await prisma.boardMember.findUnique({
          where: {
            boardId_userId: {
              boardId: boardShare.board.id,
              userId: session.user.id,
            },
          },
        })
      : null;

    return NextResponse.json({
      board: boardShare.board,
      shareToken: boardShare.shareToken,
      canEdit: boardShare.canEdit,
      isMember: !!isMember,
      isOwner: session?.user?.id === boardShare.board.ownerId,
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 });
  }
}
