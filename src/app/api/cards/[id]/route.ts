import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/cards/[id] - Update card
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

    const { title, description, columnId, position, dueDate } = await req.json();

    // Find card and check access
    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        column: {
          include: {
            board: {
              include: { members: true }
            }
          }
        }
      }
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const hasAccess = card.column.board.ownerId === session.user.id ||
      card.column.board.members.some((m: { userId: string }) => m.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (position !== undefined) updateData.position = position;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (columnId !== undefined) updateData.columnId = columnId;

    const updatedCard = await prisma.card.update({
      where: { id },
      data: updateData,
      include: {
        column: {
          include: { cards: true }
        },
        assignees: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });

    // Create activity if moved to different column
    if (columnId && columnId !== card.columnId) {
      const newColumn = await prisma.column.findUnique({
        where: { id: columnId },
        select: { name: true }
      });

      await prisma.activity.create({
        data: {
          action: "card_moved",
          entityType: "card",
          entityId: id,
          userId: session.user.id,
          boardId: card.column.boardId,
          cardId: id,
          details: JSON.stringify({
            fromColumn: card.column.name,
            toColumn: newColumn?.name
          })
        }
      });
    }

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

// DELETE /api/cards/[id] - Delete card
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

    // Find card and check access
    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        column: {
          include: {
            board: {
              include: { members: true }
            }
          }
        }
      }
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const hasAccess = card.column.board.ownerId === session.user.id ||
      card.column.board.members.some((m: { userId: string }) => m.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.card.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}
