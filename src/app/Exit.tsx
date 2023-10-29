import * as React from "react";

import { Store } from "./Store.js";

type Props = {
  clear: boolean;
  code: number;
};

export function Exit(props: Props) {
  const actions = Store.useActions();

  React.useEffect(() => {
    process.exitCode = props.code;

    if (props.clear) {
      actions.clear();
    }

    actions.exit();
  }, [props.clear, props.code]);

  return null;
}
