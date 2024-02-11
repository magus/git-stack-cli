import * as child from "node:child_process";

import { Store } from "~/app/Store";
import { Timer } from "~/core/Timer";

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
  duration: string;
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
    state.actions.debug(log.start(command));
    state.actions.debug(log.pending(command), id);

    const timer = Timer();

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
      const duration = timer.duration();

      const result = {
        command,
        code: unsafe_code || 0,
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        output: output.trimEnd(),
        duration,
      };

      state.actions.set((state) => state.mutate.end_pending_output(state, id));
      state.actions.debug(log.end(result));
      state.actions.debug(result.output);
      state.actions.debug("\n");

      if (!options.ignoreExitCode && result.code !== 0) {
        reject(new Error(log.error(result)));
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

  state.actions.debug(log.start(command));

  const timer = Timer();

  const spawn_return = child.spawnSync("sh", ["-c", command], options);

  const duration = timer.duration();

  const stdout = String(spawn_return.stdout);
  const stderr = String(spawn_return.stderr);

  const result = {
    command,
    code: spawn_return.status || 0,
    stdout,
    stderr,
    output: [stdout, stderr].join(""),
    duration,
  };

  state.actions.debug(log.end(result));
  state.actions.debug(result.output);

  if (!options.ignoreExitCode && result.code !== 0) {
    throw new Error(log.error(result));
  }

  return result;
};

const log = {
  start(command: string) {
    return `[start] ${command}`;
  },

  pending(command: string) {
    return `[⏳] ${command}\n`;
  },

  end(result: Return) {
    const { command, code, duration } = result;
    return `[end] ${command} (exit_code=${code} duration=${duration})`;
  },

  error(result: Return) {
    const { command, code, duration } = result;
    return `${command} (exit_code=${code} duration=${duration})`;
  },
};
