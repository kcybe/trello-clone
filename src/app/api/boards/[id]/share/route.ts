import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

function generateShareToken(): string {
  return `share_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;

  const shareSettings = await prisma.boardShare.findUnique({
    where: { boardId },
  });

  if (!shareSettings) {
    // Return default settings if none exist
    return NextResponse.json({
      boardId,
      isPublic: false,
      shareToken: null,
      canEdit: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json(shareSettings);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;

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
      canEdit: false,
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

  try {
    const body = await request.json();
    const { isPublic, canEdit } = body;

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
        canEdit: canEdit ?? existingSettings.canEdit,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
