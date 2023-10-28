import * as React from "react";

import * as Ink from "ink";

import { dependency_check } from "../core/dependency_check.js";
// import { main } from "../main.js";

import { Counter } from "./Counter.js";
import { KeepAlive } from "./KeepAlive.js";

import type { Argv } from "../command.js";
import type { Instance as InkInstance } from "ink";

type Props = {
  ink: InkInstance;
  argv: Argv;
};

export function App(props: Props) {
  // React.useEffect(() => {
  //   main(props.argv).catch(console.error);
  // }, []);

  const [dep_check, set_dep_check] = React.useState(false);

  React.useEffect(() => {
    async function run_dependency_check() {
      const ready = await dependency_check();

      if (!ready) {
        props.ink.clear();
        props.ink.unmount();
      }

      set_dep_check(true);
    }

    run_dependency_check().catch(console.error);
  }, []);

  if (!dep_check) {
    return (
      <Ink.Box>
        <Ink.Text>Checking dependencies...</Ink.Text>
      </Ink.Box>
    );
  }

  return (
    <React.Fragment>
      <KeepAlive />
      <Counter {...props} />

      <Ink.Box flexDirection="column">
        <Ink.Text>Ready</Ink.Text>
        <Ink.Text>force={String(props.argv.force)}</Ink.Text>
      </Ink.Box>
    </React.Fragment>
  );
}
