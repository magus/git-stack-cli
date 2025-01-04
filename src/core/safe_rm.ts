import fs from "node:fs/promises";

export async function safe_rm(filepath: string) {
  try {
    await fs.access(filepath);
    await fs.rm(filepath);
  } catch {
    // if access fails there is no file to remove this is safe
  }
}
