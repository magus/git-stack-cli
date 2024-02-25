import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
import { Parens } from "~/app/Parens";
import { Store } from "~/app/Store";
import { Url } from "~/app/Url";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { is_command_available } from "~/core/is_command_available";
import * as gh from "~/github/gh";

type Props = {
  children: React.ReactNode;
};

export function DependencyCheck(props: Props) {
  return (
    <CheckGit>
      <CheckGithubCli>
        <CheckGithubCliAuth>
          <CheckGitRevise>
            {/* force line break */}
            {props.children}
          </CheckGitRevise>
        </CheckGithubCliAuth>
      </CheckGithubCli>
    </CheckGit>
  );
}

function CheckGit(props: Props) {
  const actions = Store.useActions();

  return (
    <Await
      fallback={
        <Ink.Text color={colors.yellow}>
          Checking <Command>git</Command> install...
        </Ink.Text>
      }
      function={async () => {
        // await Promise.all([
        //   cli(`for i in $(seq 1 5); do echo $i; sleep 1; done`),
        //   cli(`for i in $(seq 5 1); do printf "$i "; sleep 1; done; echo`),
        // ]);

        if (is_command_available("git")) {
          return;
        }

        actions.output(
          <Ink.Text color={colors.yellow}>
            <Command>git</Command> must be installed.
          </Ink.Text>
        );

        actions.exit(2);
      }}
    >
      {props.children}
    </Await>
  );
}

function CheckGithubCli(props: Props) {
  const actions = Store.useActions();

  return (
    <Await
      fallback={
        <Ink.Text color={colors.yellow}>
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
          <Ink.Text color={colors.yellow}>
            <Command>gh</Command> must be installed.
          </Ink.Text>
        );

        actions.output(
          <FormatText
            wrapper={<Ink.Text color={colors.yellow} />}
            message="Visit {url} to install the official Github CLI {command}"
            values={{
              url: <Url>https://cli.github.com</Url>,

              command: <Command>gh</Command>,
            }}
          />
        );

        actions.exit(3);
      }}
    >
      {props.children}
    </Await>
  );
}

function CheckGithubCliAuth(props: Props) {
  const actions = Store.useActions();

  return (
    <Await
      fallback={
        <Ink.Text color={colors.yellow}>
          <Ink.Text>
            Checking <Command>gh auth status</Command>...
          </Ink.Text>
        </Ink.Text>
      }
      function={async () => {
        const options = { ignoreExitCode: true };
        const auth_status = await cli(`gh auth status`, options);

        if (auth_status.code === 0) {
          const username = gh.auth_status(auth_status.stdout);

          if (username) {
            actions.set((state) => {
              state.username = username;
            });

            return;
          }
        }

        if (actions.isDebug()) {
          actions.error("gh auth status could not find username");
        }

        actions.output(
          <FormatText
            wrapper={<Ink.Text color={colors.yellow} />}
            message="{gh} requires login, please run {command}"
            values={{
              gh: <Command>gh</Command>,

              command: <Command>gh auth login</Command>,
            }}
          />
        );

        actions.exit(4);
      }}
    >
      {props.children}
    </Await>
  );
}

function CheckGitRevise(props: Props) {
  const actions = Store.useActions();
  const argv = Store.useState((state) => state.argv);

  // skip git revise check when `rebase` is not git-revise
  if (argv?.["rebase"] !== "git-revise") {
    return props.children;
  }

  return (
    <Await
      fallback={
        <Ink.Text color={colors.yellow}>
          <Ink.Text>
            Checking <Command>git revise</Command> install...
          </Ink.Text>
        </Ink.Text>
      }
      function={async () => {
        if (is_command_available("git-revise")) {
          return;
        }

        actions.output(
          <Ink.Text color={colors.yellow}>
            <Command>git revise</Command> must be installed.
          </Ink.Text>
        );

        actions.output(
          <FormatText
            wrapper={<Ink.Text color={colors.yellow} />}
            message="Visit {url} to install the {git_revise} CLI for faster, in-memory rebasing {command}"
            values={{
              url: <Url>https://github.com/mystor/git-revise#install</Url>,

              git_revise: <Command>git revise</Command>,

              command: (
                <Parens>
                  <Command>git revise</Command>
                </Parens>
              ),
            }}
          />
        );

        actions.exit(10);
      }}
    >
      {props.children}
    </Await>
  );
}
