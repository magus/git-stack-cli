import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export type Argv = Awaited<ReturnType<typeof command>>;

export async function command() {
  return yargs(hideBin(process.argv))
    .option("force", {
      type: "boolean",
      description: "force",
    })

    .option("check", {
      type: "boolean",
      description: "check",
    })

    .option("debug", {
      type: "boolean",
      description: "debug",
    })

    .help().argv;
}
