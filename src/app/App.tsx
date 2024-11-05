import * as React from "react";

import { AutoUpdate } from "~/app/AutoUpdate";
import { CherryPickCheck } from "~/app/CherryPickCheck";
import { Debug } from "~/app/Debug";
import { DependencyCheck } from "~/app/DependencyCheck";
import { DetectInitialPR } from "~/app/DetectInitialPR";
import { DirtyCheck } from "~/app/DirtyCheck";
import { GatherMetadata } from "~/app/GatherMetadata";
import { GithubApiError } from "~/app/GithubApiError";
import { LocalCommitStatus } from "~/app/LocalCommitStatus";
import { Main } from "~/app/Main";
import { Output } from "~/app/Output";
import { Providers } from "~/app/Providers";
import { RebaseCheck } from "~/app/RebaseCheck";
import { Store } from "~/app/Store";
import { VerboseDebugInfo } from "~/app/VerboseDebugInfo";
import { Fixup } from "~/commands/Fixup";
import { Log } from "~/commands/Log";
import { Rebase } from "~/commands/Rebase";

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
        <VerboseDebugInfo>
          <DependencyCheck>
            <RebaseCheck>
              <CherryPickCheck>
                <MaybeMain />
              </CherryPickCheck>
            </RebaseCheck>
          </DependencyCheck>
        </VerboseDebugInfo>
      </AutoUpdate>
    </Providers>
  );
}
function MaybeMain() {
  const argv = Store.useState((state) => state.argv);

  const positional_list = new Set(argv["_"]);

  if (positional_list.has("fixup")) {
    return <Fixup />;
  } else if (positional_list.has("log")) {
    return <Log />;
  } else if (positional_list.has("rebase")) {
    return (
      <GatherMetadata>
        <LocalCommitStatus>
          <Rebase />
        </LocalCommitStatus>
      </GatherMetadata>
    );
  }

  return (
    <DirtyCheck>
      {!argv.verbose ? null : <GithubApiError />}

      <GatherMetadata>
        <LocalCommitStatus>
          <DetectInitialPR>
            <Main />
          </DetectInitialPR>
        </LocalCommitStatus>
      </GatherMetadata>
    </DirtyCheck>
  );
}
