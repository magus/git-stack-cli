export async function spawn(cmd: string) {
  console.debug();
  console.debug("[spawn]", cmd);
  const proc = await Bun.spawn(cmd.split(" "), {
    stdout: "inherit",
    stderr: "inherit",
  });

  await proc.exited;

  console.debug("[end]", cmd);

  return { proc };
}

spawn.sync = async function spawnSync(cmd: string) {
  console.debug();
  console.debug("[spawn.sync]", cmd);
  const proc = await Bun.spawnSync(cmd.split(" "));

  const stdout = String(proc.stdout).trim();
  const stderr = String(proc.stderr).trim();

  console.debug("[end]", cmd);
  console.debug({ stdout, stderr });

  return { proc, stdout, stderr };
};
