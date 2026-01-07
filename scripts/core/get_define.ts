import path from "node:path";

import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

const REPO_ROOT = (await spawn.sync("git rev-parse --show-toplevel")).stdout;

export async function get_define(): Promise<Record<string, string>> {
  const PACKAGE_JSON = await file.read_json(path.join(REPO_ROOT, "package.json"));
  const GIT_SEQUENCE_EDITOR_SCRIPT_PATH = path.join(REPO_ROOT, "scripts", "git-sequence-editor.sh");
  const UNSAFE_GIT_SEQUENCE_EDITOR_SCRIPT = await file.read_text(GIT_SEQUENCE_EDITOR_SCRIPT_PATH);
  const GIT_SEQUENCE_EDITOR_SCRIPT = UNSAFE_GIT_SEQUENCE_EDITOR_SCRIPT.replace(/`/g, "\\`");

  const define = {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env.CLI_VERSION": JSON.stringify(String(PACKAGE_JSON.version)),
    "process.env.GIT_SEQUENCE_EDITOR_SCRIPT": JSON.stringify(GIT_SEQUENCE_EDITOR_SCRIPT),
  };

  return define;
}
