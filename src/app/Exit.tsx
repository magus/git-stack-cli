import * as React from "react";

import { Store } from "~/app/Store";
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

      // ensure output has a chance to render
      await sleep(1);

      // finally handle the actual app and process exit
      if (props.clear) {
        actions.clear();
      }

      actions.unmount();

      process.exitCode = props.code;
      process.exit();
    }
  }, [props.clear, props.code]);

  return null;
}
