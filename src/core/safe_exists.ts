import fs from "node:fs/promises";

export async function safe_exists(filepath: string) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}
