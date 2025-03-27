import path from "node:path";
import * as util from "util";

import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

const parsed_args = util.parseArgs({
  args: Bun.argv,
  options: {
    target: {
      type: "string",
    },
    verbose: {
      type: "boolean",
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
});

const TARGET = parsed_args.values.target;
const VERBOSE = parsed_args.values.verbose;

console.debug("📦 compile");

if (VERBOSE) {
  console.debug(parsed_args);
}

const REPO_ROOT = (await spawn.sync("git rev-parse --show-toplevel")).stdout;
const DIST_DIR = path.join(REPO_ROOT, "dist");
const INPUT_JS = path.join(DIST_DIR, "js", "index.js");

if (!(await file.exists(INPUT_JS))) {
  console.error(`❌ Missing ${path.relative(REPO_ROOT, INPUT_JS)}`);
  console.debug("Run `pnpm run build` first to generate the input file.");
  process.exit(12);
}

if (TARGET) {
  const target = TARGET;
  await compile_target({ target });
  process.exit(0);
}

const TARGET_LIST = ["bun-linux-x64", "bun-windows-x64", "bun-darwin-arm64", "bun-darwin-x64"];

for (const target of TARGET_LIST) {
  await compile_target({ target });
}

type CompileTargetArgs = {
  target: string;
};
async function compile_target(args: CompileTargetArgs) {
  const outfile = path.join(DIST_DIR, "bin", `git-stack-${args.target}`);

  const start = Date.now();

  // pnpm bun build --compile --target=bun-darwin-arm64 ./dist/js/index.js --outfile git-stack-bun-darwin-arm64
  const bun_compile = await spawn.sync([
    "bun",
    "build",
    "--compile",
    `--target=${args.target}`,
    INPUT_JS,
    `--outfile=${outfile}`,
  ]);

  if (bun_compile.proc.exitCode) {
    console.error(bun_compile.stderr);
    process.exit(bun_compile.proc.exitCode);
  }

  const duration_ms = Date.now() - start;

  console.debug(`✅ ${path.relative(REPO_ROOT, outfile)} (${duration_ms}ms)`);
}
