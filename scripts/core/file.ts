export async function read_json(path: string) {
  const file = Bun.file(path, { type: "application/json" });
  const json = await file.json();
  return json;
}

export async function write_json(path: string, data: any) {
  const file = Bun.file(path);
  await Bun.write(file, JSON.stringify(data, null, 2));
}

export async function read_text(path: string) {
  const file = Bun.file(path);
  const text = await file.text();
  return text;
}

export async function write_text(path: string, text: string) {
  const file = Bun.file(path);
  await Bun.write(file, text);
}
