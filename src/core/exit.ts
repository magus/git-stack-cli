export function exit(code: number): never {
  process.exitCode = code;
  process.exit();
}
