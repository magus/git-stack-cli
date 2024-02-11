import * as React from "react";

import * as Ink from "ink";

import { Await } from "~/app/Await";
import { Store } from "~/app/Store";
import { sleep } from "~/core/sleep";

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
