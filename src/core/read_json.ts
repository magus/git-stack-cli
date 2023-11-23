import fs from "node:fs";

export function read_json<T = unknown>(path: string): null | T {
  try {
    const file_buffer = fs.readFileSync(path);
    const json_str = String(file_buffer);
    const json = JSON.parse(json_str);
    return json;
  } catch (error) {
    return null;
  }
}
