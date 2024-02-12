import { spawn } from "~/core/spawn";

// https://github.com/magus/git-stack-cli/releases/download/0.8.9/git-stack-cli-linux
export async function create_asset(filepath: string, options: Options) {
  const sha256_cmd = await spawn.sync(`shasum -a 256 ${filepath}`);
  const match = sha256_cmd.stdout.match(/(?<sha256>[^\s]+)/i);

  if (!match?.groups) {
    throw new Error(`unable to get sha256 for ${filepath}`);
  }

  const sha256 = match.groups.sha256;

  const url = `https://github.com/magus/git-stack-cli/releases/download/${options.version}/${filepath}`;

  return { filepath, sha256, url };
}

type Options = {
  version: string;
};
