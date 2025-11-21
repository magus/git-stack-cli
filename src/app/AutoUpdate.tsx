import * as React from "react";

import * as Ink from "ink-cjs";

import { Brackets } from "~/app/Brackets";
import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
import { YesNoPrompt } from "~/app/YesNoPrompt";
import { assertNever } from "~/core/assertNever";
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
  force?: boolean;
  timeoutMs?: number;
  onError?: (error: Error) => void;
  onOutput?: (output: React.ReactNode) => void;
  onDone?: () => void;
};

type State = {
  error: null | Error;
  local_version: null | string;
  latest_version: null | string;
  status: "init" | "prompt" | "install" | "done";
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
    switch (state.status) {
      case "init":
      case "prompt":
      case "install":
        break;

      case "done": {
        props.onDone?.();
        break;
      }

      default:
        assertNever(state.status);
    }
  }, [state.status]);

  React.useEffect(() => {
    let status: State["status"] = "init";
    let latest_version: string | null = null;
    let is_brew_bun_standalone = false;

    const local_version = process.env.CLI_VERSION;
    const is_output = props_ref.current.verbose || props_ref.current.force;

    async function auto_update() {
      if (!local_version) {
        throw new Error("Auto update requires process.env.CLI_VERSION to be set");
      }

      const timeout_ms = is_finite_value(props.timeoutMs) ? props.timeoutMs : 2 * 1000;

      const npm_json = await Promise.race([
        fetch_json(`https://registry.npmjs.org/${props.name}`),

        sleep(timeout_ms).then(() => {
          throw new Error("AutoUpdate timeout");
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
      if (props_ref.current.verbose) {
        handle_output(<Ink.Text dimColor>{JSON.stringify({ semver_result })}</Ink.Text>);
      }

      if (semver_result === 0) {
        status = "done";

        if (is_output) {
          handle_output(
            <Ink.Text>
              ✅ Everything up to date. <Brackets>{latest_version}</Brackets>
            </Ink.Text>,
          );
        }
        return;
      }

      if (semver_result === 1) {
        // trigger yes no prompt
        status = "prompt";
      }

      throw new Error("AutoUpdate failed");
    }

    const onError = props_ref.current.onError || (() => {});

    auto_update()
      .then(() => {
        patch({ status, local_version, latest_version, is_brew_bun_standalone });
      })
      .catch((error) => {
        if (props_ref.current.verbose) {
          handle_output(
            <Ink.Text key="error" color={colors.red}>
              {error?.message}
            </Ink.Text>,
          );
        }

        // ensure we always exit
        status = "done";
        patch({ status, error, local_version, latest_version, is_brew_bun_standalone });
        onError(error);
      });
  }, []);

  const status = (function render_status() {
    switch (state.status) {
      case "init":
        return null;

      case "prompt": {
        let install_command = "";
        if (state.is_brew_bun_standalone) {
          install_command = "brew install magus/git-stack/git-stack";
        } else {
          install_command = `npm install -g ${props.name}@latest`;
        }

        return (
          <YesNoPrompt
            message={
              <Ink.Box flexDirection="column">
                <Ink.Box flexDirection="column">
                  <Ink.Text color={colors.yellow}>
                    <FormatText
                      wrapper={<Ink.Text />}
                      message="New version available {latest_version}"
                      values={{
                        latest_version: <Brackets>{state.latest_version}</Brackets>,
                      }}
                    />
                    ,
                  </Ink.Text>
                  <Ink.Text> </Ink.Text>
                  <Command>{install_command}</Command>
                  <Ink.Text> </Ink.Text>
                </Ink.Box>
                <Ink.Box>
                  <FormatText
                    wrapper={<Ink.Text color={colors.yellow} />}
                    message="Would you like to run the above command to update?"
                  />
                </Ink.Box>
              </Ink.Box>
            }
            onYes={async () => {
              handle_output(<Command>{install_command}</Command>);

              patch({ status: "install" });

              await cli(install_command, {
                env: {
                  ...process.env,
                  HOMEBREW_COLOR: "1",
                },
                onOutput: (data: string) => {
                  handle_output(<Ink.Text>{data}</Ink.Text>);
                },
              });

              handle_output(
                <Ink.Text key="done">
                  ✅ Installed <Brackets>{state.latest_version}</Brackets>
                </Ink.Text>,
              );

              patch({ status: "done" });
            }}
            onNo={() => {
              patch({ status: "done" });
            }}
          />
        );
      }

      case "install":
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
