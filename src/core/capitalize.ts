export function capitalize(value: string) {
  const first_char = value.substring(0, 1).toLocaleUpperCase();
  const rest_char = value.substring(1, value.length);
  return first_char + rest_char;
}
