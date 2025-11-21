import * as fs from "node:fs/promises";
import path from "node:path";
import * as util from "util";

import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

const parsed_args = util.parseArgs({
  args: Bun.argv,
  options: {
    watch: {
      type: "boolean",
      default: false,
    },
    verbose: {
      type: "boolean",
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
});

const WATCH = parsed_args.values.watch;
const VERBOSE = parsed_args.values.verbose;

function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  console.debug(`[${timestamp}]`, ...args);
}

log("📦 bundle", WATCH ? "watch" : "build");

if (VERBOSE) {
  log(parsed_args);
}

const REPO_ROOT = (await spawn.sync("git rev-parse --show-toplevel")).stdout;

async function get_define() {
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

async function run_build() {
  const start = Date.now();

  const define = await get_define();

  if (VERBOSE) {
    log({ define });
  }

  const result = await Bun.build({
    entrypoints: ["./src/index.tsx"],
    outdir: "./dist/js",
    target: "node",
    env: "inline",
    format: "esm",
    define,
  });

  const duration_ms = Date.now() - start;

  log(`✅ Build (${duration_ms}ms)`);

  if (VERBOSE) {
    log({ result });
  }
}

if (!WATCH) {
  await run_build();
} else {
  await run_build();

  let GITIGNORE = (await file.read_text(path.join(REPO_ROOT, ".gitignore"))).split("\n");
  GITIGNORE = GITIGNORE.filter((line) => line.trim() && !line.startsWith("#"));
  GITIGNORE.push(".git");

  log("👀 Watching for changes…");

  const { signal } = new AbortController();
  const watcher = fs.watch(REPO_ROOT, { recursive: true, signal });

  for await (const event of watcher) {
    const filename = event.filename;

    if (!filename) {
      continue;
    }

    // ignore this file
    if (import.meta.filename == path.join(REPO_ROOT, filename)) {
      continue;
    }

    // ignore files in gitignore
    const ignored = GITIGNORE.some((pattern) => filename.startsWith(pattern));
    if (ignored) {
      continue;
    }

    // ignore bun build files
    if (filename.includes(".bun-build")) {
      continue;
    }

    log(`⚠️ Change ${filename}`);

    if (VERBOSE) {
      log({ ignored, filename, event });
    }

    await run_build();
  }
}
