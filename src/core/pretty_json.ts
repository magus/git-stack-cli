export namespace pretty_json {
  export type JSONValue =
    | null
    | number
    | string
    | boolean
    | { [key: string]: JSONValue }
    | Array<JSONValue>;
}

export function pretty_json<T extends pretty_json.JSONValue>(input: T): string {
  return JSON.stringify(input, null, 2);
}
