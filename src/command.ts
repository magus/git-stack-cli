import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export type Argv = Awaited<ReturnType<typeof command>>;

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

      .option("verbose", {
        type: "boolean",
        alias: ["v"],
        default: false,
        description: "Print more detailed logs for debugging internals",
      })

      .option("update", {
        type: "boolean",
        alias: ["u"],
        default: false,
        description: "Check for updates",
      })

      .option("branch", {
        type: "string",
        alias: ["b"],
        description: `Set the master branch name, defaults to "master" (or "main" if "master" is not found)`,
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

      // do not wrap to 80 columns (yargs default)
      // .wrap(yargs().terminalWidth()) will fill terminal (maximuize)
      .wrap(null)
      // disallow unknown options
      .strict()
      .version()
      .help("help").argv
  );
}
