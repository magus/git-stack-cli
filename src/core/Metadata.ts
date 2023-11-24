import { invariant } from "../core/invariant.js";
import { safe_quote } from "../core/safe_quote.js";

export function write(message: string, branch_id: string) {
  let result = message;

  // escape double-quote for cli
  result = safe_quote(result);

  // remove any previous metadata lines
  result = remove(result);

  const line_list = [result, "", TEMPLATE.branch_id(branch_id)];
  const new_message = line_list.join("\n");

  return new_message;
}

export function read(message: string): null | string {
  const match = message.match(RE.branch_id);

  if (!match?.groups) {
    return null;
  }

  const id = match.groups["id"];
  invariant(id, "id must exist");

  return id;
}

export function remove(message: string) {
  let result = message;

  // remove metadata
  result = result.replace(new RegExp(RE.branch_id, "g"), "");

  result = result.trimEnd();

  return result;
}

const TEMPLATE = {
  branch_id(id: string) {
    return `git-stack-id: ${id}`;
  },
};

const RE = {
  all_double_quote: /"/g,
  branch_id: new RegExp(TEMPLATE.branch_id("(?<id>[a-z0-9-+]+)"), "i"),
};
