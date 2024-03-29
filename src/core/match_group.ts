import { invariant } from "~/core/invariant";

export function match_group(value: string, re: RegExp, group: string) {
  const match = value.match(re);
  const debug = `[${value}.match(${re})]`;
  invariant(match?.groups, `match.groups must exist ${debug}`);
  const result = match?.groups[group];
  invariant(result, `match.groups must contain [${group}] ${debug}`);
  return result;
}

match_group.safe = (value: string, re: RegExp, group: string) => {
  try {
    return match_group(value, re, group);
  } catch (err) {
    return null;
  }
};
