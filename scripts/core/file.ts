import * as fs from "node:fs/promises";

export async function read_json(filepath: string) {
  const file = Bun.file(filepath);
  const json = await file.json();
  return json;
}

export async function write_json(filepath: string, data: any) {
  const file = Bun.file(filepath);
  await Bun.write(file, JSON.stringify(data, null, 2));
}

export async function read_text(filepath: string) {
  const file = Bun.file(filepath);
  const text = await file.text();
  return text;
}

export async function write_text(filepath: string, text: string) {
  const file = Bun.file(filepath);
  await Bun.write(file, text);
}

export async function exists(filepath: string) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

export async function rm(filepath: string) {
  return fs.rm(filepath);
}

export async function mv(source: string, destination: string) {
  return fs.rename(source, destination);
}
