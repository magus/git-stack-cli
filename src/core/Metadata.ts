import { invariant } from "../core/invariant.js";
import { safe_quote } from "../core/safe_quote.js";

export function write(message: string, stack_id: string) {
  let result = message;

  // escape double-quote for cli
  result = safe_quote(result);

  // remove any previous metadata lines
  result = remove(result);

  const line_list = [result, "", TEMPLATE.stack_id(stack_id)];
  const new_message = line_list.join("\n");

  return new_message;
}

export function read(message: string): null | string {
  const match = message.match(RE.stack_id);

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
  result = result.replace(new RegExp(RE.stack_id, "gmi"), "");

  result = result.trimEnd();

  return result;
}

const TEMPLATE = {
  stack_id(id: string) {
    return `git-stack-id: ${id}`;
  },
};

const RE = {
  stack_id: new RegExp(TEMPLATE.stack_id("(?<id>[a-z0-9-+=]+)"), "i"),
};
