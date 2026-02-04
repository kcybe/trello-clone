import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/boards/[id]/columns - Get columns for a board
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check access
    const board = await prisma.board.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 });
    }

    const columns = await prisma.column.findMany({
      where: { boardId: id },
      include: {
        cards: {
          orderBy: { position: "asc" }
        }
      },
      orderBy: { position: "asc" }
    });

    return NextResponse.json(columns);
  } catch (error) {
    console.error("Error fetching columns:", error);
    return NextResponse.json({ error: "Failed to fetch columns" }, { status: 500 });
  }
}

// POST /api/boards/[id]/columns - Add column to board
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Column name is required" }, { status: 400 });
    }

    // Check access
    const board = await prisma.board.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: { in: ["admin", "member"] } } } }
        ]
      }
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 });
    }

    // Get the highest position
    const maxPosition = await prisma.column.findFirst({
      where: { boardId: id },
      orderBy: { position: "desc" },
      select: { position: true }
    });

    const column = await prisma.column.create({
      data: {
        name: name.trim(),
        boardId: id,
        position: (maxPosition?.position ?? -1) + 1
      },
      include: {
        cards: true
      }
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json({ error: "Failed to create column" }, { status: 500 });
  }
}
