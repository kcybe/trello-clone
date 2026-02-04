import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/invite/[code]/accept - Accept invite and add user as member
export async function POST(req: NextRequest, props: { params: Promise<{ code: string }> }) {
  const { params } = props;
  try {
    const { code } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to accept this invite' },
        { status: 401 }
      );
    }

    // Find the board share by token
    const boardShare = await prisma.boardShare.findUnique({
      where: { shareToken: code },
      include: { board: true },
    });

    if (!boardShare) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    if (!boardShare.isPublic) {
      return NextResponse.json({ error: 'This invite link is no longer active' }, { status: 403 });
    }

    // Check if already a member
    const existingMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: boardShare.board.id,
          userId: session.user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this board' },
        { status: 400 }
      );
    }

    // Add user as member
    const member = await prisma.boardMember.create({
      data: {
        boardId: boardShare.board.id,
        userId: session.user.id,
        role: boardShare.canEdit ? 'member' : 'viewer',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the board',
      boardId: boardShare.board.id,
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
}
