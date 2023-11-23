import * as React from "react";

import { AutoUpdate } from "./AutoUpdate.js";
import { Debug } from "./Debug.js";
import { DependencyCheck } from "./DependencyCheck.js";
import { GatherMetadata } from "./GatherMetadata.js";
import { GithubApiError } from "./GithubApiError.js";
import { LocalCommitStatus } from "./LocalCommitStatus.js";
import { Main } from "./Main.js";
import { Output } from "./Output.js";
import { Providers } from "./Providers.js";
import { Store } from "./Store.js";

export function App() {
  const actions = Store.useActions();

  const ink = Store.useState((state) => state.ink);
  const argv = Store.useState((state) => state.argv);

  if (!ink || !argv) {
    return null;
  }

  // // debug component
  // return (
  //   <React.Fragment>
  //     <Debug />
  //     <Output />

  //     <GithubApiError />
  //   </React.Fragment>
  // );

  return (
    <Providers>
      <Debug />
      <Output />

      {!argv.debug ? null : <GithubApiError />}

      <DependencyCheck>
        <AutoUpdate
          name="git-stack-cli"
          verbose={argv.debug}
          onOutput={actions.output}
        >
          <GatherMetadata>
            <LocalCommitStatus>
              <Main />
            </LocalCommitStatus>
          </GatherMetadata>
        </AutoUpdate>
      </DependencyCheck>
    </Providers>
  );
}
