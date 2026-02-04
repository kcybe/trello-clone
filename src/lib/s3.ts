// Local filesystem storage for development
// For production, replace with AWS S3 or similar

import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function saveFile(file: File, cardId: string): Promise<{ filename: string; url: string }> {
  ensureUploadDir();
  
  const ext = file.name.split(".").pop() || "";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  
  fs.writeFileSync(filepath, buffer);
  
  return {
    filename,
    url: `/uploads/${filename}`,
  };
}

export function deleteFile(filename: string): void {
  const filepath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}
