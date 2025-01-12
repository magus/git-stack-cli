import * as React from "react";

import * as Ink from "ink-cjs";

import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { sleep } from "~/core/sleep";

type Props = {
  clear: boolean;
  code: number;
};

export function Exit(props: Props) {
  React.useEffect(() => {
    // immediately handle exit on mount
    handle_exit().catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });

    async function handle_exit() {
      const state = Store.getState();
      const actions = state.actions;

      actions.debug(`[Exit] handle_exit ${JSON.stringify(props)}`);

      let exit_code = props.code;

      // run abort_handler if it exists
      if (state.abort_handler) {
        exit_code = await state.abort_handler();
      }

      // restore git stash if necessary
      if (state.is_dirty_check_stash) {
        await cli("git stash pop");
        actions.output(
          <Ink.Text color={colors.green}>
            ✅ Changes restored from stash
          </Ink.Text>
        );
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
    }
  }, [props.clear, props.code]);

  return null;
}
