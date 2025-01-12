export function pretty_json(input: JSONValue): string {
  return JSON.stringify(input, null, 2);
}

type JSONValue =
  | null
  | number
  | string
  | boolean
  | JSONValue[]
  | { [key: string]: JSONValue };
