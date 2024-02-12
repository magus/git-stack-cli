export async function spawn(cmd: string) {
  console.debug();
  console.debug("[spawn]", cmd);

  const env = process.env;
  const proc = await Bun.spawn(cmd.split(" "), {
    env,
    stdout: "inherit",
    stderr: "inherit",
  });

  await proc.exited;

  if (proc.exitCode) {
    console.error(`(${proc.exitCode})`, cmd);

    if (!process.env.GS_NO_CHECK) {
      process.exit(proc.exitCode);
    }
  }

  console.debug("[end]", cmd);

  return { proc };
}

spawn.sync = async function spawnSync(cmd: string) {
  console.debug();
  console.debug("[spawn.sync]", cmd);

  const env = process.env;
  const proc = await Bun.spawnSync(cmd.split(" "), { env });

  const stdout = String(proc.stdout).trim();
  const stderr = String(proc.stderr).trim();

  console.debug("[end]", cmd);
  console.debug({ stdout, stderr });

  return { proc, stdout, stderr };
};
