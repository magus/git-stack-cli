import * as React from "react";

import * as Ink from "ink";

import { cli } from "../core/cli.js";
import { is_command_available } from "../core/is_command_available.js";

import { Await } from "./Await.js";
import { Exit } from "./Exit.js";
import { Store } from "./Store.js";

type Props = {
  children: React.ReactNode;
};

export function DependencyCheck(props: Props) {
  const actions = Store.useActions();

  return (
    <Await
      fallback={
        <Ink.Box>
          <Ink.Text>Checking git install...</Ink.Text>
        </Ink.Box>
      }
      function={async () => {
        if (is_command_available("git")) {
          return;
        }

        actions.output(
          <Ink.Text>
            <Ink.Text color="yellow">git</Ink.Text> must be installed.
          </Ink.Text>
        );

        actions.output(<Exit clear code={2} />);
      }}
    >
      <Await
        fallback={
          <Ink.Box>
            <Ink.Text>Checking gh install...</Ink.Text>
          </Ink.Box>
        }
        function={async () => {
          if (is_command_available("gh")) {
            return;
          }

          actions.output(
            <Ink.Text>
              <Ink.Text color="yellow">gh</Ink.Text> must be installed.
            </Ink.Text>
          );

          actions.output(
            <Ink.Box flexDirection="row" gap={1}>
              <Ink.Text>Visit</Ink.Text>
              <Ink.Text color="#38bdf8">https://cli.github.com</Ink.Text>
              <Ink.Text>to install the github cli</Ink.Text>
              <Ink.Text>
                (<Ink.Text color="yellow">gh</Ink.Text>)
              </Ink.Text>
            </Ink.Box>
          );

          actions.output(<Exit clear code={3} />);
        }}
      >
        <Await
          fallback={
            <Ink.Box>
              <Ink.Text>Checking gh auth status...</Ink.Text>
            </Ink.Box>
          }
          function={async () => {
            const gh_auth_status_cli = await cli(`gh auth status`, {
              ignoreExitCode: true,
            });

            if (gh_auth_status_cli.code === 0) {
              return;
            }

            actions.output(
              <Ink.Box flexDirection="row" gap={1}>
                <Ink.Text color="yellow">gh</Ink.Text>
                <Ink.Text>requires login, please run</Ink.Text>
                <Ink.Text>
                  <Ink.Text color="yellow">gh auth login</Ink.Text>
                </Ink.Text>
              </Ink.Box>
            );

            actions.output(<Exit clear code={4} />);
          }}
        >
          {props.children}
        </Await>
      </Await>
    </Await>
  );
}
