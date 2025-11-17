import * as React from "react";

import * as Ink from "ink-cjs";

import { Brackets } from "~/app/Brackets";
import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
import { YesNoPrompt } from "~/app/YesNoPrompt";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { fetch_json } from "~/core/fetch_json";
import { is_finite_value } from "~/core/is_finite_value";
import { semver_compare } from "~/core/semver_compare";
import { sleep } from "~/core/sleep";

type Props = {
  name: string;
  children: React.ReactNode;
  verbose?: boolean;
  timeoutMs?: number;
  onError?: (error: Error) => void;
  onOutput?: (output: React.ReactNode) => void;
  onDone?: () => void;
};

type State = {
  error: null | Error;
  local_version: null | string;
  latest_version: null | string;
  status: "init" | "prompt" | "install" | "done" | "exit";
  is_brew_bun_standalone: boolean;
};

function reducer(state: State, patch: Partial<State>) {
  return { ...state, ...patch };
}

export function AutoUpdate(props: Props) {
  const props_ref = React.useRef(props);
  props_ref.current = props;

  const [output, set_output] = React.useState<Array<React.ReactNode>>([]);

  const [state, patch] = React.useReducer(reducer, {
    error: null,
    local_version: null,
    latest_version: null,
    status: "init",
    is_brew_bun_standalone: false,
  });

  function handle_output(node: React.ReactNode) {
    if (typeof props.onOutput === "function") {
      props.onOutput(node);
    } else {
      set_output((current) => {
        return [...current, node];
      });
    }
  }

  React.useEffect(() => {
    let status: State["status"] = "done";
    let latest_version: string | null = null;
    let is_brew_bun_standalone = false;

    const local_version = process.env.CLI_VERSION;

    async function auto_update() {
      if (!local_version) {
        throw new Error("Auto update requires process.env.CLI_VERSION to be set");
      }

      if (props_ref.current.verbose) {
        handle_output(<Ink.Text key="init">Checking for latest version...</Ink.Text>);
      }

      const timeout_ms = is_finite_value(props.timeoutMs) ? props.timeoutMs : 2 * 1000;

      const npm_json = await Promise.race([
        fetch_json(`https://registry.npmjs.org/${props.name}`),

        sleep(timeout_ms).then(() => {
          throw new Error("Timeout");
        }),
      ]);

      latest_version = npm_json?.["dist-tags"]?.latest;

      if (!latest_version) {
        throw new Error("Unable to retrieve latest version from npm");
      }

      const binary_path = process.argv[1];

      if (props_ref.current.verbose) {
        handle_output(<Ink.Text dimColor>{JSON.stringify({ binary_path })}</Ink.Text>);
      }

      is_brew_bun_standalone = binary_path.startsWith("/$bunfs");

      if (props_ref.current.verbose) {
        if (is_brew_bun_standalone) {
          handle_output(
            <Ink.Text dimColor>brew install detected (compiled bun standalone)</Ink.Text>,
          );
        } else {
          handle_output(<Ink.Text dimColor>npm install detected</Ink.Text>);
        }
      }

      if (props_ref.current.verbose) {
        handle_output(
          <FormatText
            key="versions"
            wrapper={<Ink.Text />}
            message="Auto update found latest version {latest_version} and current local version {local_version}"
            values={{
              latest_version: <Brackets>{latest_version}</Brackets>,
              local_version: <Brackets>{local_version}</Brackets>,
            }}
          />,
        );
      }

      const semver_result = semver_compare(latest_version, local_version);

      status = "prompt";

      if (semver_result === 0) {
        return;
      }

      if (semver_result === -1) {
        // latest version is less than or equal to local version, skip auto update
        throw new Error(
          `latest version < local_version, skipping auto update [${latest_version} < ${local_version}]`,
        );
      }

      // trigger yes no prompt
      status = "prompt";
    }

    const onError = props_ref.current.onError || (() => {});

    auto_update()
      .then(() => {
        patch({ status, local_version, latest_version, is_brew_bun_standalone });
      })
      .catch((error) => {
        patch({ status, error, local_version, latest_version, is_brew_bun_standalone });
        onError(error);

        if (props_ref.current.verbose) {
          handle_output(
            <Ink.Text key="error" color={colors.red}>
              {error?.message}
            </Ink.Text>,
          );
        }
      })
      .finally(() => {
        props.onDone?.();
      });
  }, []);

  const status = (function render_status() {
    switch (state.status) {
      case "init":
        return null;

      case "prompt": {
        let install_command = "";
        if (state.is_brew_bun_standalone) {
          install_command = `npm install -g ${props.name}@latest`;
        } else {
          install_command = `HOMEBREW_NO_AUTO_UPDATE=1 brew upgrade magus/git-stack/git-stack`;
        }

        return (
          <YesNoPrompt
            message={
              <Ink.Box flexDirection="column">
                <Ink.Text color={colors.yellow}>
                  New version available, would you like to update?
                </Ink.Text>
                <Ink.Text> </Ink.Text>
                <Command>{install_command}</Command>
                <Ink.Text> </Ink.Text>
                <FormatText
                  wrapper={<Ink.Text color={colors.yellow} />}
                  message="Would you like to run the above command to update?"
                />
              </Ink.Box>
            }
            onYes={async () => {
              handle_output(
                <FormatText
                  key="install"
                  wrapper={<Ink.Text />}
                  message="Installing {name}@{version}..."
                  values={{
                    name: <Ink.Text color={colors.yellow}>{props.name}</Ink.Text>,
                    version: <Ink.Text color={colors.blue}>{state.latest_version}</Ink.Text>,
                  }}
                />,
              );

              patch({ status: "install" });

              await cli(install_command);

              patch({ status: "exit" });

              handle_output(<Ink.Text key="done">Auto update done.</Ink.Text>);
            }}
            onNo={() => {
              patch({ status: "done" });
            }}
          />
        );
      }

      case "install":
        return null;

      case "exit":
        return null;

      case "done":
        return props.children;
    }
  })();

  return (
    <React.Fragment>
      {output}
      {status}
    </React.Fragment>
  );
}
