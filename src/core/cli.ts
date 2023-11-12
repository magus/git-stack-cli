import * as child from "node:child_process";

type SpawnOptions = Parameters<typeof child.spawn>[2];

type Options = SpawnOptions & {
  ignoreExitCode?: boolean;
};

type Return = {
  code: number;
  stdout: string;
  stderr: string;
  output: string;
};

export async function cli(
  command: string,
  unsafe_options?: Options
): Promise<Return> {
  const options = Object.assign({}, unsafe_options);

  return new Promise((resolve, reject) => {
    const childProcess = child.spawn("sh", ["-c", command], options);

    let stdout = "";
    let stderr = "";
    let output = "";

    childProcess.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
      output += data.toString();
    });

    childProcess.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
      output += data.toString();
    });

    childProcess.on("close", (code) => {
      if (!options.ignoreExitCode && code !== 0) {
        reject(new Error(`[${command}] (${code})`));
      } else {
        const result = {
          code: code || 0,
          stdout: stdout.trimEnd(),
          stderr: stderr.trimEnd(),
          output: output.trimEnd(),
        };

        resolve(result);
      }
    });

    childProcess.on("error", (err) => {
      reject(err);
    });
  });
}

cli.sync = function cli_sync(
  command: string,
  unsafe_options?: Options
): Return {
  const options = Object.assign({}, unsafe_options);

  const spawn_return = child.spawnSync("sh", ["-c", command], options);

  const stdout = String(spawn_return.stdout);
  const stderr = String(spawn_return.stderr);
  const output = String(spawn_return.output);
  const code = spawn_return.status || 0;

  return { code, stdout, stderr, output };
};
