import * as React from "react";

import * as Ink from "ink";

import { cli } from "../core/cli.js";
import { is_command_available } from "../core/is_command_available.js";
import { match_group } from "../core/match_group.js";

import { Await } from "./Await.js";
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

        actions.exit(2);
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

          actions.exit(3);
        }}
      >
        <Await
          fallback={
            <Ink.Box>
              <Ink.Text>Checking gh auth status...</Ink.Text>
            </Ink.Box>
          }
          function={async () => {
            const auth_output = await cli(`gh auth status`, {
              ignoreExitCode: true,
            });

            if (auth_output.code === 0) {
              const username = match_group(
                auth_output.stdout,
                RE.auth_username,
                "username"
              );

              actions.set((state) => {
                state.username = username;
              });

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

            actions.exit(4);
          }}
        >
          {props.children}
        </Await>
      </Await>
    </Await>
  );
}

const RE = {
  // Logged in to github.com as magus
  auth_username: /Logged in to github.com as (?<username>[^\s]+)/,
};
