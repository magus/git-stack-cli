import * as React from "react";

import { DependencyCheck } from "./DependencyCheck.js";
import { GatherMetadata } from "./GatherMetadata.js";
import { Main } from "./Main.js";
import { Output } from "./Output.js";
import { Store } from "./Store.js";

export function App() {
  const ink = Store.useState((state) => state.ink);

  if (!ink) {
    return null;
  }

  return (
    <React.Fragment>
      <Output />

      <DependencyCheck>
        <GatherMetadata>
          <Main />
        </GatherMetadata>
      </DependencyCheck>
    </React.Fragment>
  );
}
