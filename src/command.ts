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
        description: "Force sync even if no changes are detected",
      })

      .option("check", {
        type: "boolean",
        description: "Print status table without syncing",
      })

      .option("no-verify", {
        type: "boolean",
        description: "Disable the pre-push hook, bypassing it completely",
      })

      .option("debug", {
        type: "boolean",
        alias: ["verbose", "v", "d"],
        description:
          "Enable debug mode with more detailed output for debugging",
      })

      .option("write-state-json", {
        hidden: true,
        type: "boolean",
        description: "Write state to local json file for debugging",
      })

      .option("mock-metadata", {
        hidden: true,
        type: "boolean",
        description: "Mock local store metadata for testing",
      })

      // do not wrap to 80 columns (yargs default)
      // .wrap(yargs().terminalWidth()) will fill terminal (maximuize)
      .wrap(null)
      // disallow unknown options
      .strict()
      .version()
      .help().argv
  );
}
