export function assertNever(value: never): asserts value is never {
  // eslint-disable-next-line no-console
  console.error("[assertNever]", { value });
}
