export async function spawn(cmd: string) {
  const spawn_cmd = await Bun.spawn(cmd.split(" "), {
    stdout: "inherit",
    stderr: "inherit",
  });

  await spawn_cmd.exited;

  return spawn_cmd;
}
