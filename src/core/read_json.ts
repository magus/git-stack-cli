import fs from "node:fs/promises";

export async function read_json<T = unknown>(path: string): Promise<null | T> {
  try {
    const file_buffer = await fs.readFile(path);
    const json_str = String(file_buffer);
    const json = JSON.parse(json_str);
    return json;
  } catch (error) {
    return null;
  }
}
