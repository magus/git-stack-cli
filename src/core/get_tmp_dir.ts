import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function get_tmp_dir(): Promise<string> {
  const dir = path.join(os.tmpdir(), "git-stack-cli");

  // ensure tmp directory exists
  await fs.mkdir(dir, { recursive: true });

  return dir;
}
