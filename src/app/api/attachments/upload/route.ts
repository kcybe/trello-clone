import { auth } from "@/lib/auth";
import { saveFile } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const cardId = formData.get("cardId") as string;

    if (!file || !cardId) {
      return NextResponse.json({ error: "Missing file or cardId" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/", "application/pdf", "video/"];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    if (!isValidType) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Max size: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Save to local filesystem
    const { filename, url } = await saveFile(file, cardId);

    // Save to database
    const attachment = await prisma.attachment.create({
      data: {
        cardId,
        filename: file.name,
        url,
        mimeType: file.type,
        size: file.size,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
