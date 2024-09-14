import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { invariant } from "~/core/invariant";

export function Log() {
  const { stdout } = Ink.useStdout();
  const available_width = stdout.columns || 80;

  return <Await fallback={null} function={() => run({ available_width })} />;
}

type Args = {
  available_width: number;
};

async function run(args: Args) {
  const state = Store.getState();
  const actions = state.actions;
  const process_argv = state.process_argv;

  invariant(actions, "actions must exist");

  // estimate the number of color characters per line
  // assuming an average of 5 color changes per line and 5 characters per color code
  const color_buffer = 12 * 5;
  const truncation_width = args.available_width + color_buffer;

  // get the number of characters in the short sha for this repo
  const short_sha = (await cli(`git log -1 --format=%h`)).stdout.trim();
  const short_sha_length = short_sha.length + 1;

  // SHA hash - At least 9 characters wide, truncated
  const sha_format = `%C(green)%<(${short_sha_length},trunc)%h`;

  // relative commit date - 15 characters wide, truncated
  const date_format = `%C(white)%<(15,trunc)%cr`;

  // author's abbreviated name - 12 characters wide, truncated
  const author_format = `%C(white)%<(8,trunc)%al`;

  // decorative information like branch heads or tags
  const decoration_format = `%C(auto)%d`;

  // commit subject - 80 characters wide, truncated
  const subject_format = `%<(60,trunc)%s`;

  // combine all the above formats into one
  const format = [
    sha_format,
    date_format,
    author_format,
    decoration_format,
    subject_format,
  ].join(" ");

  // view the SHA, description and history graph of last 20 commits
  const rest_args = process_argv.slice(3).join(" ");
  const command = [
    `git log --pretty=format:"${format}" -n20 --graph --color ${rest_args}`,
    `cut -c 1-"${truncation_width}"`,
    `nl -w3 -s' '`,
  ].join(" | ");

  const result = await cli(command);

  actions.output(result.stdout);
}
