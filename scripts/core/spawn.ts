export async function spawn(unsafe_cmd: CommandLike) {
  const cmd = get_cmd(unsafe_cmd);

  console.debug();
  console.debug("[spawn]", cmd.str);

  const env = process.env;
  const proc = await Bun.spawn(cmd.parts, {
    env,
    stdout: "inherit",
    stderr: "inherit",
  });

  await proc.exited;

  if (proc.exitCode) {
    console.error(`(${proc.exitCode})`, cmd.str);

    if (!process.env.GS_NO_CHECK) {
      process.exit(proc.exitCode);
    }
  }

  console.debug("[end]", cmd.str);

  return { proc };
}

spawn.sync = async function spawnSync(unsafe_cmd: CommandLike) {
  const cmd = get_cmd(unsafe_cmd);

  console.debug();
  console.debug("[spawn.sync]", cmd.str);

  const env = process.env;
  const proc = await Bun.spawnSync(cmd.parts, { env });

  const stdout = String(proc.stdout).trim();
  const stderr = String(proc.stderr).trim();
  const exit_code = proc.exitCode;

  const display_cmd_exit = `${cmd.str} (${exit_code})`;
  console.debug("[end]", display_cmd_exit);
  console.debug({ stdout, stderr, exit_code });

  if (exit_code) {
    throw new Error(`[failed] ${display_cmd_exit}`);
  }

  return { proc, stdout, stderr };
};

type CommandLike = string | Array<string>;

function get_cmd(unsafe_cmd: CommandLike) {
  let str;
  let parts;

  if (Array.isArray(unsafe_cmd)) {
    parts = unsafe_cmd;
    str = unsafe_cmd.join(" ");
  } else {
    parts = unsafe_cmd.split(" ");
    str = unsafe_cmd;
  }

  return { parts, str };
}
