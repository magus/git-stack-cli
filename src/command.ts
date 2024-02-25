import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export type Argv = Awaited<ReturnType<typeof command>> & {
  ["rebase"]: keyof typeof Rebase;
};

export async function command() {
  // https://yargs.js.org/docs/#api-reference-optionkey-opt
  return (
    yargs(hideBin(process.argv))
      .usage("Usage: git stack [options]")

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
        description: "Print status table without syncing",
      })

      .option("verify", {
        type: "boolean",
        default: true,
        description: "Skip git hooks such as pre-commit and pre-push",
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

      .option("verbose", {
        type: "boolean",
        alias: ["v"],
        default: false,
        description: "Print more detailed logs for debugging internals",
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

      .option("write-state-json", {
        hidden: true,
        type: "boolean",
        default: false,
        description: "Write state to local json file for debugging",
      })

      .option("mock-metadata", {
        hidden: true,
        type: "boolean",
        default: false,
        description: "Mock local store metadata for testing",
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
