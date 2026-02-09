import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Permission levels in order of access (lowest to highest)
const PERMISSION_LEVELS = ['read', 'comment', 'edit'] as const;
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

function hasPermission(
  userPermission: PermissionLevel,
  requiredPermission: PermissionLevel
): boolean {
  const userLevelIndex = PERMISSION_LEVELS.indexOf(userPermission);
  const requiredLevelIndex = PERMISSION_LEVELS.indexOf(requiredPermission);
  return userLevelIndex >= requiredLevelIndex;
}

function generateShareToken(): string {
  return `share_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

async function checkBoardAccess(boardId: string, userId: string): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { members: true },
  });

  if (!board) return false;

  return board.ownerId === userId || board.members.some(m => m.userId === userId);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;

  // Check authentication
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify board access
  const hasAccess = await checkBoardAccess(boardId, session.user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const shareSettings = await prisma.boardShare.findUnique({
    where: { boardId },
  });

  if (!shareSettings) {
    // Return default settings if none exist
    return NextResponse.json({
      boardId,
      isPublic: false,
      shareToken: null,
      permission: 'read',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json(shareSettings);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;

  // Check authentication
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify board access
  const hasAccess = await checkBoardAccess(boardId, session.user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const shareToken = generateShareToken();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const shareUrl = `${baseUrl}/board/shared/${shareToken}`;

  // Upsert share settings - create if doesn't exist, update if it does
  const shareSettings = await prisma.boardShare.upsert({
    where: { boardId },
    create: {
      boardId,
      shareToken,
      isPublic: true,
      permission: 'read',
    },
    update: {
      shareToken,
      isPublic: true,
    },
  });

  return NextResponse.json({
    ...shareSettings,
    shareUrl,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;

  // Check authentication
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify board access
  const hasAccess = await checkBoardAccess(boardId, session.user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { isPublic, permission } = body;

    // Validate permission if provided
    if (permission && !PERMISSION_LEVELS.includes(permission as PermissionLevel)) {
      return NextResponse.json(
        { error: 'Invalid permission level. Must be: read, comment, or edit' },
        { status: 400 }
      );
    }

    // Check if share settings exist
    const existingSettings = await prisma.boardShare.findUnique({
      where: { boardId },
    });

    if (!existingSettings) {
      return NextResponse.json(
        { error: 'Share settings not found. Generate a share link first.' },
        { status: 404 }
      );
    }

    const updatedSettings = await prisma.boardShare.update({
      where: { boardId },
      data: {
        isPublic: isPublic ?? existingSettings.isPublic,
        permission: permission ?? existingSettings.permission,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
