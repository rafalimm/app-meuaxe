import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".storage");

export function storageDir(): string {
  return ROOT;
}

export async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(ROOT, { recursive: true });
}

export function randomStoredName(ext: string): string {
  return `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}${ext}`;
}

export async function saveFile(storedName: string, data: Buffer): Promise<void> {
  await ensureStorageDir();
  await fs.writeFile(path.join(ROOT, storedName), data);
}

export async function readFileBuffer(storedName: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(ROOT, storedName));
  } catch {
    return null;
  }
}

export async function deleteFile(storedName: string): Promise<void> {
  try {
    await fs.unlink(path.join(ROOT, storedName));
  } catch {
    /* arquivo pode já não existir */
  }
}

export async function deleteFiles(storedNames: string[]): Promise<string[]> {
  const missing: string[] = [];
  for (const name of storedNames) {
    try {
      await fs.unlink(path.join(ROOT, name));
    } catch {
      missing.push(name);
    }
  }
  return missing;
}
