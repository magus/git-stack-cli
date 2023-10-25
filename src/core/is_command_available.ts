import fs from "node:fs";
import path from "node:path";

import { invariant } from "./invariant";

export function is_command_available(command: string) {
  const PATH = process.env.PATH;

  invariant(PATH, "PATH env must exist");

  const path_list = PATH.split(path.delimiter);

  for (const dir of path_list) {
    const full_path = path.join(dir, command);
    if (fs.existsSync(full_path)) {
      return true;
    }
  }

  return false;
}
