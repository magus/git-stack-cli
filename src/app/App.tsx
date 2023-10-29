import * as React from "react";

import * as Ink from "ink";

import { cli } from "../core/cli.js";
import { dependency_check } from "../core/dependency_check.js";
import { sleep } from "../core/sleep.js";

import { Await } from "./Await.js";
import { Counter } from "./Counter.js";
import { MultiSelect } from "./MultiSelect.js";
import { Store } from "./Store.js";

import type { Argv } from "../command.js";
import type { Instance as InkInstance } from "ink";

type Props = {
  ink: InkInstance;
  argv: Argv;
};

export function App(props: Props) {
  const { isFocused } = Ink.useFocus();

  // import { main } from "../main.js";
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

  const merge_base = Store.useState((state) => state.merge_base);
  const head = Store.useState((state) => state.head);
  const output = Store.useState((state) => state.output);

  if (!dep_check) {
    return (
      <Ink.Box>
        <Ink.Text>Checking dependencies...</Ink.Text>
      </Ink.Box>
    );
  }

  // handle when there are no detected changes
  if (head && head === merge_base) {
    return <Ink.Text>No changes detected.</Ink.Text>;
  }

  const items = [
    {
      label: "One",
      value: 1,
    },
    {
      label: "Two",
      value: 2,
    },
    {
      label: "Three",
      value: 3,
    },
  ];

  return (
    <React.Fragment>
      {output.map((node, i) => {
        return <React.Fragment key={i}>{node}</React.Fragment>;
      })}

      <Await
        fallback={<Ink.Text>Loading metadata...</Ink.Text>}
        function={async () => {
          const head = (await cli("git rev-parse HEAD")).stdout;
          const merge_base = (await cli("git merge-base HEAD master")).stdout;

          Store.getState().actions.output(<Ink.Text>apple</Ink.Text>);
          await sleep(3 * 1000);
          Store.getState().actions.output(<Ink.Text>banana</Ink.Text>);
          await sleep(3 * 1000);
          Store.getState().actions.output(<Ink.Text>orange</Ink.Text>);
          await sleep(3 * 1000);

          Store.setState((state) => {
            state.head = head;
            state.merge_base = merge_base;
          });
        }}
      >
        {/* <KeepAlive /> */}
        <Counter />

        <Ink.Box flexDirection="column">
          <MultiSelect
            items={items}
            onSelect={(item, state) => {
              console.debug({ item, state });
            }}
          />

          <Ink.Text>Ready</Ink.Text>
          <Ink.Text>force={String(props.argv.force)}</Ink.Text>
          <Ink.Text>focus={String(isFocused)}</Ink.Text>
        </Ink.Box>
      </Await>
    </React.Fragment>
  );
}
