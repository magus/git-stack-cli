import React from "react";

import { main } from "../main.js";

import { Counter } from "./Counter.js";

import type { Argv } from "../command.js";

type Props = {
  argv: Argv;
};

export function App(props: Props) {
  React.useEffect(() => {
    main(props.argv).catch(console.error);
  }, []);

  return <Counter {...props} />;
}
