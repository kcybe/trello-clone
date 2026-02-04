import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/boards/[id] - Get single board
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

    const board = await prisma.board.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        columns: {
          include: {
            cards: {
              orderBy: { position: "asc" }
            }
          },
          orderBy: { position: "asc" }
        },
        owner: {
          select: { id: true, name: true, email: true, image: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      }
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json({ error: "Failed to fetch board" }, { status: 500 });
  }
}

// PATCH /api/boards/[id] - Update board
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, color } = await req.json();

    // Check if user has access
    const existingBoard = await prisma.board.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: { in: ["admin", "member"] } } } }
        ]
      }
    });

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color?.trim() || null;
    updateData.updatedAt = new Date();

    const board = await prisma.board.update({
      where: { id },
      data: updateData,
      include: {
        columns: {
          include: { cards: true },
          orderBy: { position: "asc" }
        }
      }
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error("Error updating board:", error);
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
  }
}

// DELETE /api/boards/[id] - Delete board
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner or admin
    const board = await prisma.board.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: "admin" } } }
        ]
      }
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 });
    }

    await prisma.board.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting board:", error);
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
  }
}
