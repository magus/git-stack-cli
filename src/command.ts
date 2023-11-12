import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export type Argv = Awaited<ReturnType<typeof command>>;

export async function command() {
  return (
    yargs(hideBin(process.argv))
      .option("force", {
        type: "boolean",
        description: "Force sync even if no changes are detected",
      })

      .option("check", {
        type: "boolean",
        description: "Print status table without syncing",
      })

      .option("verbose", {
        type: "boolean",
        description: "Log extra information during execution",
      })

      .option("debug", {
        type: "boolean",
        description: "Log debugging information during execution",
      })
      .option("mock-metadata", {
        type: "boolean",
        description: "Mock local store metadata for testing",
      })
      // disallow unknown options
      .strict()
      .help().argv
  );
}
