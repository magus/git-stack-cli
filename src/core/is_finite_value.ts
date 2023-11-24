export function is_finite_value(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
