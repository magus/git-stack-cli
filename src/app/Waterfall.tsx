import * as React from "react";

import * as Ink from "ink";

import { sleep } from "../core/sleep.js";

import { Await } from "./Await.js";
import { Store } from "./Store.js";

export function Waterfall() {
  return (
    <Await
      fallback={<Ink.Text>Loading...</Ink.Text>}
      function={async () => {
        await sleep(3 * 1000);
        Store.getState().actions.output(<Ink.Text>apple</Ink.Text>);
      }}
    >
      <Await
        fallback={<Ink.Text>Loading...</Ink.Text>}
        function={async () => {
          await sleep(3 * 1000);
          Store.getState().actions.output(<Ink.Text>banana</Ink.Text>);
        }}
      >
        <Await
          fallback={<Ink.Text>Loading...</Ink.Text>}
          function={async () => {
            await sleep(3 * 1000);
            Store.getState().actions.output(<Ink.Text>orange</Ink.Text>);
          }}
        >
          <Ink.Text>Waterfall</Ink.Text>
        </Await>
      </Await>
    </Await>
  );
}
