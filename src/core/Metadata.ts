import { invariant } from "~/core/invariant";
import { safe_quote } from "~/core/safe_quote";

type InputMetadataValues = {
  id: string;
  title?: string;
};

type OutputMetadataValues = {
  id: null | string;
  title: null | string;
};

export function write(message: string, values: InputMetadataValues) {
  let result = message;

  // escape double-quote for cli
  result = safe_quote(result);

  // remove any previous metadata lines
  result = remove(result);

  const line_list = [result, "", TEMPLATE.stack_id(values.id)];

  if (values.title) {
    line_list.push(TEMPLATE.group_title(values.title));
  }

  const new_message = line_list.join("\n");

  return new_message;
}

export function read(message: string): OutputMetadataValues {
  const values: OutputMetadataValues = { id: null, title: null };

  const match_id = message.match(RE.stack_id);

  if (match_id?.groups) {
    values.id = match_id.groups["id"];
    invariant(values.id, "id must exist");
  }

  const match_title = message.match(RE.group_title);

  if (match_title?.groups) {
    values.title = match_title.groups["title"];
  }

  return values;
}

export function remove(message: string) {
  let result = message;

  // remove metadata
  result = result.replace(new RegExp(RE.stack_id, "gmi"), "");
  result = result.replace(new RegExp(RE.group_title, "gmi"), "");

  result = result.trimEnd();

  return result;
}

const TEMPLATE = {
  stack_id(id: string) {
    return `git-stack-id: ${id}`;
  },

  group_title(title: string) {
    return `git-stack-title: ${title}`;
  },
};

const RE = {
  stack_id: new RegExp(TEMPLATE.stack_id("(?<id>[a-z0-9-+=]+)"), "i"),
  group_title: new RegExp(TEMPLATE.group_title("(?<title>[^\\n^\\r]+)"), "i"),
};
