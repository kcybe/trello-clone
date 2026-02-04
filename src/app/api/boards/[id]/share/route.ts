import { NextRequest, NextResponse } from "next/server";

// In-memory store for demo (in production, use database)
const shareSettingsStore = new Map<string, {
  boardId: string;
  isPublic: boolean;
  shareToken: string | null;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
}>();

function generateShareToken(): string {
  return `share_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: boardId } = await params;
  
  let settings = shareSettingsStore.get(boardId);
  
  if (!settings) {
    // Return default settings
    return NextResponse.json({
      boardId,
      isPublic: false,
      shareToken: null,
      canEdit: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  return NextResponse.json(settings);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: boardId } = await params;
  
  const shareToken = generateShareToken();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const shareUrl = `${baseUrl}/board/shared/${shareToken}`;
  
  const settings = {
    boardId,
    isPublic: true,
    shareToken,
    canEdit: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  shareSettingsStore.set(boardId, settings);
  
  return NextResponse.json({
    ...settings,
    shareUrl,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: boardId } = await params;
  
  try {
    const body = await request.json();
    const { isPublic, canEdit } = body;
    
    let settings = shareSettingsStore.get(boardId);
    
    if (!settings) {
      settings = {
        boardId,
        isPublic: false,
        shareToken: null,
        canEdit: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    const updatedSettings = {
      ...settings,
      isPublic: isPublic ?? settings.isPublic,
      canEdit: canEdit ?? settings.canEdit,
      updatedAt: new Date().toISOString(),
    };
    
    shareSettingsStore.set(boardId, updatedSettings);
    
    return NextResponse.json(updatedSettings);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
