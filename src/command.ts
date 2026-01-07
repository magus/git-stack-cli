import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import type { Options, InferredOptionTypes, Arguments, ParserConfigurationOptions } from "yargs";

export type Argv = Arguments & TGlobalOptions & TFixupOptions & TDefaultOptions;

type CommandOptions = {
  env_config?: Partial<Argv>;
  parserConfiguration?: Partial<ParserConfigurationOptions>;
};

export async function command(argv: string[], options: CommandOptions = {}) {
  // https://yargs.js.org/docs/#api-reference-optionkey-opt
  let builder = yargs(hideBin(argv));

  if (options.parserConfiguration) {
    builder = builder.parserConfiguration(options.parserConfiguration);
  }

  const parsed = await builder
    .scriptName("git stack")
    .usage("Usage: git stack [command] [options]")

    .command("$0", "Sync commit ranges to Github", (yargs) => {
      let builder = yargs.options(DefaultOptions);

      // apply overrides from config
      // higher precedence than defaults, but lower precendence than cli flags
      // perfect since that's what we want, prefer config only if not explicitly set on cli
      if (options.env_config) {
        builder = builder.config(options.env_config);
      }

      return builder;
    })

    .command("fixup [commit]", "Amend staged changes to a specific commit in history", (yargs) =>
      yargs.positional("commit", FixupOptions.commit),
    )

    .command(
      "log [args...]",
      "Print an abbreviated log with numbered commits, useful for git stack fixup",
      (yargs) => yargs.strict(false),
    )

    .command(
      "rebase",
      "Update local branch via rebase with latest changes from origin master branch",
      (yargs) => yargs,
    )

    .command(
      ["update", "upgrade"],
      "Check and install the latest version of git stack",
      (yargs) => yargs,
    )

    .command(
      "config",
      "Generate a one-time configuration json based on the passed arguments",
      (yargs) => {
        // match options for default command (since we are generating a config for its options)
        let builder = yargs.options(DefaultOptions);
        return builder;
      },
    )

    .command(
      //
      "api",
      "Check Github API quota and rate limits",
      (yargs) => yargs,
    )

    .option("verbose", GlobalOptions.verbose)

    // yargs default wraps to 80 columns
    // passing null will wrap to terminal width
    // value below if what seems to look decent
    .wrap(123)

    // disallow unknown options
    .strict()
    .version(process.env.CLI_VERSION || "unknown")
    .showHidden("show-hidden", "Show hidden options via `git stack help --show-hidden`")
    .help("help", "Show usage via `git stack help`");

  const result = parsed.argv as unknown as Argv;
  return result;
}

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
    description: [
      // force line break
      "Run git hooks such as pre-commit and pre-push",
      "Disable with --no-verify",
    ].join("\n"),
  },

  "branch": {
    type: "string",
    alias: ["b"],
    description: [
      // force line break
      "Set the master branch name, defaults to 'origin/master'",
      "(or 'origin/main' if 'origin/master' is not found)",
    ].join("\n"),
  },

  "draft": {
    type: "boolean",
    alias: ["d"],
    default: false,
    description: "Open all PRs as drafts",
  },

  "revise-sign": {
    type: "boolean",
    default: true,
    description: "Disable GPG signing for git revise with --no-revise-sign",
  },

  "template": {
    type: "boolean",
    default: true,
    description: [
      // force line break
      "Use automatic Github PR template, e.g. .github/pull_request_template.md",
      "Disable with --no-template",
    ].join("\n"),
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
