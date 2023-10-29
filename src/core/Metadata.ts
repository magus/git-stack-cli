import { cli } from "../core/cli.js";
import { invariant } from "../core/invariant.js";

type Metadata = {
  id: null | string;
};

export async function write(args: { metadata: Metadata; message: string }) {
  invariant(args.metadata.id, "metadata must have id");

  let message = args.message;
  message = message.replace(RE.all_double_quote, '\\"');

  const line_list = [message, "", TEMPLATE.metadata_id(args.metadata.id)];
  const new_message = line_list.join("\n");

  await cli(`git commit --amend -m "${new_message}"`);
}

export async function read(message: string): Promise<Metadata> {
  const match = message.match(RE.metadata_id);

  const metadata: Metadata = {
    id: null,
  };

  if (!match?.groups) {
    return metadata;
  }

  const id = match.groups["id"];
  invariant(id, "id must exist");

  metadata.id = id;

  return metadata;
}

export function id_regex() {
  return RE.metadata_id;
}

const TEMPLATE = {
  metadata_id(id: string) {
    return `git-multi-diff-id: ${id}`;
  },
};

const RE = {
  all_double_quote: /"/g,
  metadata_id: new RegExp(TEMPLATE.metadata_id("(?<id>[a-z0-9-]+)")),
};
