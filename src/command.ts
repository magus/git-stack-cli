import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import type { Options, InferredOptionTypes, Arguments } from "yargs";

export type Argv = Arguments & TGlobalOptions & TFixupOptions & TDefaultOptions;

export async function command() {
  // https://yargs.js.org/docs/#api-reference-optionkey-opt
  return (
    yargs(hideBin(process.argv))
      .usage("Usage: git stack [command] [options]")

      .command("$0", "Sync commit ranges to Github", (yargs) =>
        yargs.options(DefaultOptions)
      )

      .command(
        "fixup [commit]",
        "Amend staged changes to a specific commit in history",
        (yargs) => yargs.positional("commit", FixupOptions.commit)
      )

      .command(
        "log [args...]",
        "Print an abbreviated log with numbered commits, useful for git stack fixup",
        (yargs) => yargs.strict(false)
      )

      .option("verbose", GlobalOptions.verbose)

      // yargs default wraps to 80 columns
      // passing null will wrap to terminal width
      // value below if what seems to look decent
      .wrap(123)

      // disallow unknown options
      .strict()
      .version(process.env.CLI_VERSION || "unknown")
      .showHidden(
        "show-hidden",
        "Show hidden options via `git stack help --show-hidden`"
      )
      .help("help", "Show usage via `git stack help`")
      .argv as unknown as Promise<Argv>
  );
}

const Rebase = Object.freeze({
  "git-revise": "git-revise",
  "cherry-pick": "cherry-pick",
});

const GlobalOptions = {
  verbose: {
    type: "boolean",
    alias: ["v"],
    default: false,
    description: "Print more detailed logs for debugging internals",
  },
} satisfies YargsOptions;

const DefaultOptions = {
  "force": {
    type: "boolean",
    alias: ["f"],
    default: false,
    description: "Force sync even if no changes are detected",
  },

  "check": {
    type: "boolean",
    alias: ["c"],
    default: false,
    description: "Print status table and exit without syncing",
  },

  "sync": {
    type: "boolean",
    alias: ["s"],
    default: true,
    description: "Sync commit ranges to Github, disable with --no-sync",
  },

  "verify": {
    type: "boolean",
    default: true,
    description:
      "Run git hooks such as pre-commit and pre-push, disable with --no-verify",
  },

  "rebase": {
    type: "string",
    choices: [Rebase["git-revise"], Rebase["cherry-pick"]],
    default: Rebase["git-revise"],
    description: [
      "Strategy used for syncing branches",
      `${Rebase["git-revise"]}: perform faster in-memory rebase`,
      `${Rebase["cherry-pick"]}: use disk and incrementally rebase each commit`,
    ].join(" | "),
  },

  "update": {
    type: "boolean",
    alias: ["u", "upgrade"],
    default: false,
    description: "Check and install the latest version",
  },

  "branch": {
    type: "string",
    alias: ["b"],
    description:
      'Set the master branch name, defaults to "master" (or "main" if "master" is not found)',
  },

  "draft": {
    type: "boolean",
    alias: ["d"],
    default: false,
    description: "Open all PRs as drafts",
  },

  "write-state-json": {
    hidden: true,
    type: "boolean",
    default: false,
    description: "Write state to local json file for debugging",
  },

  "template": {
    type: "boolean",
    default: true,
    description:
      "Use automatic Github PR template, e.g. .github/pull_request_template.md, disable with --no-template",
  },

  "mock-metadata": {
    hidden: true,
    type: "boolean",
    default: false,
    description: "Mock local store metadata for testing",
  },
} satisfies YargsOptions;

const FixupOptions = {
  commit: {
    type: "number",
    default: 1,
    description: [
      "Relative number of commit to amend staged changes.",
      "Most recent is 1, next is 2, etc.",
    ].join("\n"),
  },
} satisfies YargsOptions;

type YargsOptions = { [key: string]: Options };

type TGlobalOptions = InferredOptionTypes<typeof GlobalOptions>;
type TFixupOptions = InferredOptionTypes<typeof FixupOptions>;
type TDefaultOptions = InferredOptionTypes<typeof DefaultOptions>;
