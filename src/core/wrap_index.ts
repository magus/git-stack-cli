export function wrap_index(value: number, list: Array<unknown>) {
  const max = list.length - 1;

  if (value === -1) {
    return max;
  } else if (value > max) {
    return 0;
  }

  return value;
}
