import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/boards - List all boards for user
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        columns: {
          include: { cards: true },
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
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 });
  }
}

// POST /api/boards - Create new board
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, color } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Board name is required" }, { status: 400 });
    }

    const board = await prisma.board.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color?.trim() || null,
        ownerId: session.user.id,
        columns: {
          create: [
            { name: "To Do", position: 0 },
            { name: "In Progress", position: 1 },
            { name: "Done", position: 2 }
          ]
        }
      },
      include: {
        columns: true,
        owner: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });

    // Create board membership for owner
    await prisma.boardMember.create({
      data: {
        boardId: board.id,
        userId: session.user.id,
        role: "admin"
      }
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }
}
