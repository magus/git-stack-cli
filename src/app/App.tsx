import * as React from "react";

import { AutoUpdate } from "~/app/AutoUpdate";
import { CherryPickCheck } from "~/app/CherryPickCheck";
import { DependencyCheck } from "~/app/DependencyCheck";
import { DetectInitialPR } from "~/app/DetectInitialPR";
import { DirtyCheck } from "~/app/DirtyCheck";
import { GatherMetadata } from "~/app/GatherMetadata";
import { GithubApiError } from "~/app/GithubApiError";
import { HandleCtrlCSigint } from "~/app/HandleCtrlCSigint";
import { LocalCommitStatus } from "~/app/LocalCommitStatus";
import { Main } from "~/app/Main";
import { Output } from "~/app/Output";
import { Providers } from "~/app/Providers";
import { RebaseCheck } from "~/app/RebaseCheck";
import { RequireBranch } from "~/app/RequireBranch";
import { Store } from "~/app/Store";
import { VerboseDebugInfo } from "~/app/VerboseDebugInfo";
import { Config } from "~/commands/Config";
import { Fixup } from "~/commands/Fixup";
import { Log } from "~/commands/Log";
import { Rebase } from "~/commands/Rebase";
import { Update } from "~/commands/Update";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { ExitingGate } from "~/components/ExitingGate";

export function App() {
  const actions = Store.useActions();

  const ink = Store.useState((state) => state.ink);
  const argv = Store.useState((state) => state.argv);

  if (!ink || !argv || !argv.$0) {
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

  const positional_list = new Set(argv["_"]);
  const is_update = positional_list.has("update") || positional_list.has("upgrade");

  return (
    <Providers>
      <ErrorBoundary>
        <Output />

        <ExitingGate>
          <AutoUpdate
            name="git-stack-cli"
            verbose={argv.verbose}
            force={is_update}
            timeoutMs={is_update ? 30 * 1000 : 2 * 1000}
            onOutput={actions.output}
            onDone={() => {
              if (is_update) {
                actions.exit(0);
              }
            }}
          >
            <VerboseDebugInfo>
              <RebaseCheck>
                <CherryPickCheck>
                  <MaybeMain />
                </CherryPickCheck>
              </RebaseCheck>
            </VerboseDebugInfo>
          </AutoUpdate>

          <HandleCtrlCSigint />
        </ExitingGate>
      </ErrorBoundary>
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
  } else if (positional_list.has("update")) {
    return <Update />;
  } else if (positional_list.has("config")) {
    return <Config />;
  } else if (positional_list.has("api")) {
    return <GithubApiError exit />;
  } else if (positional_list.has("rebase")) {
    return (
      <DependencyCheck>
        <DirtyCheck>
          <GatherMetadata>
            <LocalCommitStatus>
              <Rebase />
            </LocalCommitStatus>
          </GatherMetadata>
        </DirtyCheck>
      </DependencyCheck>
    );
  }

  return (
    <React.Fragment>
      {!argv.verbose ? null : <GithubApiError />}

      <DependencyCheck>
        <DirtyCheck>
          <GatherMetadata>
            <RequireBranch>
              <LocalCommitStatus>
                <DetectInitialPR>
                  <Main />
                </DetectInitialPR>
              </LocalCommitStatus>
            </RequireBranch>
          </GatherMetadata>
        </DirtyCheck>
      </DependencyCheck>
    </React.Fragment>
  );
}
