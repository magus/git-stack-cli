import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export type Argv = {
  force: boolean;
  check: boolean;
  sync: boolean;
  verify: boolean;
  rebase: keyof typeof Rebase;
  verbose: boolean;
  update: boolean;
  branch: string | undefined;
  draft: boolean;
  "write-state-json": boolean;
  writeStateJson: boolean;
  template: boolean;
  "mock-metadata": boolean;
  mockMetadata: boolean;
  _: (string | number)[];
  $0: string;
};

export async function command() {
  // https://yargs.js.org/docs/#api-reference-optionkey-opt
  return (
    yargs(hideBin(process.argv))
      .usage("Usage: git stack [command] [options]")

      .command(
        "$0", // Default command
        "Sync commit ranges to Github",
        (yargs) => {
          return yargs
            .option("force", {
              type: "boolean",
              alias: ["f"],
              default: false,
              description: "Force sync even if no changes are detected",
            })

            .option("check", {
              type: "boolean",
              alias: ["c"],
              default: false,
              description: "Print status table and exit without syncing",
            })

            .option("sync", {
              type: "boolean",
              alias: ["s"],
              default: true,
              description:
                "Sync commit ranges to Github, disable with --no-sync",
            })

            .option("verify", {
              type: "boolean",
              default: true,
              description:
                "Run git hooks such as pre-commit and pre-push, disable with --no-verify",
            })

            .option("rebase", {
              type: "string",
              choices: [Rebase["git-revise"], Rebase["cherry-pick"]],
              default: Rebase["git-revise"],
              description: [
                "Strategy used for syncing branches",
                `${Rebase["git-revise"]}: perform faster in-memory rebase`,
                `${Rebase["cherry-pick"]}: use disk and incrementally rebase each commit`,
              ].join(" | "),
            })

            .option("update", {
              type: "boolean",
              alias: ["u", "upgrade"],
              default: false,
              description: "Check and install the latest version",
            })

            .option("branch", {
              type: "string",
              alias: ["b"],
              description:
                'Set the master branch name, defaults to "master" (or "main" if "master" is not found)',
            })

            .option("draft", {
              type: "boolean",
              alias: ["d"],
              default: false,
              description: "Open all PRs as drafts",
            })

            .option("write-state-json", {
              hidden: true,
              type: "boolean",
              default: false,
              description: "Write state to local json file for debugging",
            })

            .option("template", {
              type: "boolean",
              default: true,
              description:
                "Use automatic Github PR template, e.g. .github/pull_request_template.md, disable with --no-template",
            })

            .option("mock-metadata", {
              hidden: true,
              type: "boolean",
              default: false,
              description: "Mock local store metadata for testing",
            });
        }
      )

      .command(
        "fixup [commit]", // Positional command "fixup"
        "Amend staged changes to a specific commit in history",
        (yargs) => {
          return yargs.positional("commit", {
            type: "number",
            default: 1,
            description: [
              "Relative number of commit to amend staged changes.",
              "Most recent is 1, next is 2, etc.",
            ].join("\n"),
          });
        }
      )

      .option("verbose", {
        type: "boolean",
        alias: ["v"],
        default: false,
        description: "Print more detailed logs for debugging internals",
      })

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
      .help("help", "Show usage via `git stack help`").argv
  );
}

const Rebase = Object.freeze({
  "git-revise": "git-revise",
  "cherry-pick": "cherry-pick",
});
