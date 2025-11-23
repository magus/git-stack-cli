import { invariant } from "~/core/invariant";

type InputMetadataValues = {
  id: string;
  title?: string;
};

type OutputMetadataValues = {
  subject: null | string;
  id: null | string;
  title: null | string;
};

export function write(message: string, values: InputMetadataValues) {
  let result = message;

  // remove any previous metadata lines
  result = remove(result);

  const line_list = [result, "", TEMPLATE.stack_id(values.id)];

  if (values.title) {
    line_list.push(TEMPLATE.group_title(values.title));
  }

  let new_message = line_list.join("\n");

  return new_message;
}

export function read(message: string): OutputMetadataValues {
  const values: OutputMetadataValues = { subject: null, id: null, title: null };

  const match_subject = message.match(RE.subject_line);

  if (match_subject?.groups) {
    values.subject = match_subject.groups["subject"];
    invariant(values.subject, "subject must exist");
  }

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
  // https://regex101.com/r/pOrChS/1
  subject_line: /^(?<subject>[^\n]*)/,
  // https://regex101.com/r/wLmGVq/1
  stack_id: new RegExp(`${TEMPLATE.stack_id("(?<id>[^\\s]+)")}`, "i"),
  group_title: new RegExp(TEMPLATE.group_title("(?<title>[^\\n^\\r]+)"), "i"),
};
