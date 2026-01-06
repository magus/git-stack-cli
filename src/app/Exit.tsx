import * as React from "react";

import fs from "node:fs/promises";
import path from "node:path";

import * as Ink from "ink-cjs";

import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { get_tmp_dir } from "~/core/get_tmp_dir";
import * as json from "~/core/json";
import { pretty_json } from "~/core/pretty_json";
import { sleep } from "~/core/sleep";

type Props = {
  clear: boolean;
  code: number;
};

export function Exit(props: Props) {
  React.useEffect(() => {
    // immediately handle exit on mount
    Exit.handle_exit(props).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
  }, [props.clear, props.code]);

  return null;
}

Exit.handle_exit = async function handle_exit(props: Props) {
  const state = Store.getState();
  const actions = state.actions;

  // write state to file for debugging
  if (state.select.debug(state)) {
    const tmp_state_path = path.join(await get_tmp_dir(), "git-stack-state.json");
    await fs.writeFile(tmp_state_path, pretty_json(json.serialize(state)));
    const output = <Ink.Text color={colors.gray}>Wrote state to {tmp_state_path}</Ink.Text>;
    actions.output(output);
  }

  actions.debug(`[Exit] handle_exit ${JSON.stringify(props)}`);

  let exit_code = props.code;

  // run abort_handler if it exists
  if (state.abort_handler) {
    exit_code = await state.abort_handler();
  }

  if (!state.argv.verbose && props.code > 0) {
    actions.output(
      <Ink.Text color={colors.gray}>
        <FormatText message="Try again with `--verbose` to see more information." />
      </Ink.Text>,
    );
  }

  // restore git stash if necessary
  if (state.is_dirty_check_stash) {
    await cli("git stash pop");
    actions.output(<Ink.Text color={colors.green}>✅ Changes restored from stash</Ink.Text>);
  }

  // ensure output has a chance to render
  await sleep(1);

  // finally handle the actual app and process exit
  if (props.clear) {
    actions.clear();
  }

  actions.unmount();

  process.exitCode = exit_code;
  process.exit();
};
