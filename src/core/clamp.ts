export function clamp(value: number, min: number, max: number) {
  let result = value;
  result = Math.max(result, min);
  result = Math.min(result, max);
  return result;
}
