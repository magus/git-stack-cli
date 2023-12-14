import * as child from "node:child_process";

import { Store } from "../app/Store.js";

type SpawnOptions = Parameters<typeof child.spawn>[2];

type Options = SpawnOptions & {
  ignoreExitCode?: boolean;
};

type Return = {
  command: string;
  code: number;
  stdout: string;
  stderr: string;
  output: string;
};

let i = 0;

export async function cli(
  unsafe_command: string | Array<string | number>,
  unsafe_options?: Options
): Promise<Return> {
  const options = Object.assign({}, unsafe_options);

  const state = Store.getState();

  let command: string;
  if (Array.isArray(unsafe_command)) {
    command = unsafe_command.join(" ");
  } else {
    command = unsafe_command;
  }

  return new Promise((resolve, reject) => {
    const childProcess = child.spawn("sh", ["-c", command], options);

    let stdout = "";
    let stderr = "";
    let output = "";

    const id = `${++i}-${command}`;
    state.actions.debug(`[start] ${command}`);
    state.actions.debug(`[⏳] ${command}\n`, id);

    function write_output(value: string) {
      output += value;
      state.actions.debug(value, id);
    }

    childProcess.stdout?.on("data", (data: Buffer) => {
      const value = String(data);
      stdout += value;
      write_output(value);
    });

    childProcess.stderr?.on("data", (data: Buffer) => {
      const value = String(data);
      stderr += value;
      write_output(value);
    });

    childProcess.on("close", (unsafe_code) => {
      const result = {
        command,
        code: unsafe_code || 0,
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        output: output.trimEnd(),
      };

      state.actions.set((state) => state.mutate.end_pending_output(state, id));
      state.actions.debug(`[end] ${command} (${result.code})`);
      state.actions.debug(result.output);

      if (!options.ignoreExitCode && result.code !== 0) {
        reject(new Error(`[${command}] (${result.code})`));
      } else {
        resolve(result);
      }
    });

    childProcess.on("error", (err) => {
      reject(err);
    });
  });
}

cli.sync = function cli_sync(
  unsafe_command: string | Array<string | number>,
  unsafe_options?: Options
): Return {
  const options = Object.assign({}, unsafe_options);

  const state = Store.getState();

  let command: string;
  if (Array.isArray(unsafe_command)) {
    command = unsafe_command.join(" ");
  } else {
    command = unsafe_command;
  }

  state.actions.debug(`[start] ${command}`);
  const spawn_return = child.spawnSync("sh", ["-c", command], options);

  const stdout = String(spawn_return.stdout);
  const stderr = String(spawn_return.stderr);

  const result = {
    command,
    code: spawn_return.status || 0,
    stdout,
    stderr,
    output: [stdout, stderr].join(""),
  };

  state.actions.debug(`[end] ${command} (${result.code})`);
  state.actions.debug(result.output);

  if (!options.ignoreExitCode && result.code !== 0) {
    throw new Error(`[${command}] (${result.code})`);
  }

  return result;
};
