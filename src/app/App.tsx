import * as React from "react";

import { AutoUpdate } from "~/app/AutoUpdate";
import { CherryPickCheck } from "~/app/CherryPickCheck";
import { Debug } from "~/app/Debug";
import { DependencyCheck } from "~/app/DependencyCheck";
import { DirtyCheck } from "~/app/DirtyCheck";
import { GatherMetadata } from "~/app/GatherMetadata";
import { GithubApiError } from "~/app/GithubApiError";
import { LocalCommitStatus } from "~/app/LocalCommitStatus";
import { Main } from "~/app/Main";
import { Output } from "~/app/Output";
import { Providers } from "~/app/Providers";
import { RebaseCheck } from "~/app/RebaseCheck";
import { Store } from "~/app/Store";

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

      <AutoUpdate
        name="git-stack-cli"
        verbose={argv.verbose || argv.update}
        timeoutMs={argv.update ? 30 * 1000 : 2 * 1000}
        onOutput={actions.output}
        onDone={() => {
          if (argv.update) {
            actions.exit(0);
          }
        }}
      >
        <DependencyCheck>
          <DirtyCheck>
            <RebaseCheck>
              <CherryPickCheck>
                {!argv.verbose ? null : <GithubApiError />}

                <GatherMetadata>
                  <LocalCommitStatus>
                    <Main />
                  </LocalCommitStatus>
                </GatherMetadata>
              </CherryPickCheck>
            </RebaseCheck>
          </DirtyCheck>
        </DependencyCheck>
      </AutoUpdate>
    </Providers>
  );
}
