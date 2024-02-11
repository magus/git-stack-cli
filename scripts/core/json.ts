export async function read(path: string) {
  const file = Bun.file(path, { type: "application/json" });
  const json = await file.json();
  return json;
}

export async function write(path: string, data: any) {
  const file = Bun.file(path);
  await Bun.write(file, JSON.stringify(data, null, 2));
}
