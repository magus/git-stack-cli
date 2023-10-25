import * as child from "node:child_process";

type Options = {
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
  unsafe_options?: Options,
): Promise<Return> {
  const options = Object.assign({}, unsafe_options);

  return new Promise((resolve, reject) => {
    const childProcess = child.spawn("sh", ["-c", command]);

    let stdout = "";
    let stderr = "";
    let output = "";

    childProcess.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
      output += data.toString();
    });

    childProcess.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
      output += data.toString();
    });

    childProcess.on("close", (code) => {
      if (!options.ignoreExitCode && code !== 0) {
        reject(new Error(`[${command}] (${code})`));
      } else {
        resolve({
          code: code || 0,
          stdout: stdout.trimEnd(),
          stderr: stderr.trimEnd(),
          output: output.trimEnd(),
        });
      }
    });

    childProcess.on("error", (err) => {
      reject(err);
    });
  });
}
