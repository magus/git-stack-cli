import * as fs from "node:fs/promises";
import path from "node:path";
import * as util from "util";

import type { BuildConfig } from "bun";

import * as file from "~/core/file";
import { get_define } from "~/core/get_define";
import { get_local_iso } from "~/core/get_local_iso";
import { spawn } from "~/core/spawn";

const parsed_args = util.parseArgs({
  args: Bun.argv,
  options: {
    watch: {
      type: "boolean",
      default: false,
    },
    dev: {
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
const DEV = parsed_args.values.dev;

function log(...args: any[]) {
  const timestamp = get_local_iso(new Date());
  console.debug(`[${timestamp}]`, ...args);
}

log("📦 bundle", WATCH ? "watch" : "build");

if (VERBOSE) {
  log(parsed_args);
}

const REPO_ROOT = (await spawn.sync("git rev-parse --show-toplevel")).stdout;

const define = await get_define();

const BUILD_CONFIG = {
  entrypoints: ["./src/index.tsx"],
  outdir: "./dist/js",
  target: "node",
  env: "inline",
  format: "esm",
  sourcemap: "inline",
  define,
  minify: !DEV,
} satisfies BuildConfig;

log({ BUILD_CONFIG });

async function run_build() {
  const start = Date.now();

  const result = await Bun.build(BUILD_CONFIG);

  const duration_ms = Date.now() - start;
  const status = result.success ? "✅" : "❌";

  log(`${status} build (${duration_ms}ms)`);

  if (VERBOSE || !result.success) {
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
