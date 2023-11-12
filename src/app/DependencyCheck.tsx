import * as React from "react";

import * as Ink from "ink";

import { cli } from "../core/cli.js";
import { is_command_available } from "../core/is_command_available.js";
import { match_group } from "../core/match_group.js";

import { Await } from "./Await.js";
import { Command } from "./Command.js";
import { Parens } from "./Parens.js";
import { Store } from "./Store.js";
import { Url } from "./Url.js";

type Props = {
  children: React.ReactNode;
};

export function DependencyCheck(props: Props) {
  const actions = Store.useActions();

  return (
    <Await
      fallback={
        <Ink.Text color="yellow">
          Checking <Command>git</Command> install...
        </Ink.Text>
      }
      function={async () => {
        if (is_command_available("git")) {
          return;
        }

        actions.output(
          <Ink.Text color="yellow">
            <Command>git</Command> must be installed.
          </Ink.Text>
        );

        actions.exit(2);
      }}
    >
      <Await
        fallback={
          <Ink.Text color="yellow">
            <Ink.Text>
              Checking <Command>gh</Command> install...
            </Ink.Text>
          </Ink.Text>
        }
        function={async () => {
          if (is_command_available("gh")) {
            return;
          }

          actions.output(
            <Ink.Text color="yellow">
              <Command>gh</Command> must be installed.
            </Ink.Text>
          );

          actions.output(
            <Ink.Text color="yellow">
              <Ink.Text>{"Visit "}</Ink.Text>
              <Url>https://cli.github.com</Url>
              <Ink.Text>{" to install the github cli "}</Ink.Text>

              <Parens>
                <Command>gh</Command>
              </Parens>
            </Ink.Text>
          );

          actions.exit(3);
        }}
      >
        <Await
          fallback={
            <Ink.Text color="yellow">
              <Ink.Text>
                Checking <Command>gh auth status</Command>...
              </Ink.Text>
            </Ink.Text>
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
              <Ink.Text color="yellow">
                <Command>gh</Command>
                <Ink.Text>{" requires login, please run "}</Ink.Text>
                <Command>gh auth login</Command>
              </Ink.Text>
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
