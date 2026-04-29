import { invariant } from "~/core/invariant";

type InputMetadataValues = {
  id: string;
  title?: string;
  base?: string;
};

type OutputMetadataValues = {
  subject: null | string;
  id: null | string;
  title: null | string;
  base: null | string;
};

export function write(message: string, values: InputMetadataValues) {
  let result = message;

  // remove any previous metadata lines
  result = remove(result);

  const line_list = [result, "", TEMPLATE.stack_id(values.id)];

  if (values.title) {
    line_list.push(TEMPLATE.group_title(values.title));
  }

  if (values.base) {
    line_list.push(TEMPLATE.base(values.base));
  }

  let new_message = line_list.join("\n");

  return new_message;
}

export function read(message: string): OutputMetadataValues {
  const values: OutputMetadataValues = {
    subject: null,
    id: null,
    title: null,
    base: null,
  };

  const match_subject = message.match(RE.subject_line);

  if (match_subject?.groups) {
    const subject = match_subject.groups["subject"];
    invariant(subject, "subject must exist");
    values.subject = subject;
  }

  const match_id = message.match(RE.stack_id);

  if (match_id?.groups) {
    const id = match_id.groups["id"];
    invariant(id, "id must exist");
    values.id = id;
  }

  const match_title = message.match(RE.group_title);

  if (match_title?.groups) {
    const title = match_title.groups["title"];
    invariant(title, "title must exist");
    values.title = title;
  }

  const match_base = message.match(RE.base);

  if (match_base?.groups) {
    const base = match_base.groups["ref"];
    invariant(base, "base must exist");
    values.base = base;
  }

  return values;
}

export function remove(message: string) {
  let result = message;

  // remove metadata
  result = result.replace(new RegExp(RE.stack_id, "gmi"), "");
  result = result.replace(new RegExp(RE.group_title, "gmi"), "");
  result = result.replace(new RegExp(RE.base, "gmi"), "");

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

  base(ref: string) {
    return `git-stack-base: ${ref}`;
  },
};

const RE = {
  // https://regex101.com/r/pOrChS/1
  subject_line: /^(?<subject>[^\n]*)/,
  // https://regex101.com/r/wLmGVq/1
  stack_id: new RegExp(`${TEMPLATE.stack_id("(?<id>[^\\s]+)")}`, "i"),
  group_title: new RegExp(TEMPLATE.group_title("(?<title>[^\\n^\\r]+)"), "i"),
  base: new RegExp(`${TEMPLATE.base("(?<ref>[^\\s]+)")}`, "i"),
};
