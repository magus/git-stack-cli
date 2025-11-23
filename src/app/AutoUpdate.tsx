import * as React from "react";

import * as Ink from "ink-cjs";

import { Brackets } from "~/app/Brackets";
import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
import { Url } from "~/app/Url";
import { YesNoPrompt } from "~/app/YesNoPrompt";
import { assertNever } from "~/core/assertNever";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { fetch_json } from "~/core/fetch_json";
import { get_timeout_fn } from "~/core/get_timeout_fn";
import { is_finite_value } from "~/core/is_finite_value";
import { semver_compare } from "~/core/semver_compare";

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
  status: "init" | "prompt" | "install" | "done";
  local_version: null | string;
  latest_version: null | string;
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
    status: "init",
    local_version: null,
    latest_version: null,
    is_brew_bun_standalone: false,

    // // debugging
    // status: "prompt",
    // local_version: "2.5.3",
    // latest_version: "2.7.0",
    // is_brew_bun_standalone: true,
  });

  React.useEffect(handle_init_state, []);
  React.useEffect(handle_status, [state.latest_version]);
  React.useEffect(handle_on_done, [state.status]);

  const status = render_status();

  return (
    <React.Fragment>
      {output}
      {status}
    </React.Fragment>
  );

  function render_status() {
    switch (state.status) {
      case "init":
        return null;

      case "install":
        return null;

      case "done":
        return props.children;

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
              <Ink.Box flexDirection="column" gap={1}>
                <Command>{install_command}</Command>
                <FormatText
                  wrapper={<Ink.Text color={colors.yellow} />}
                  message="Would you like to run the above command to update?"
                />
              </Ink.Box>
            }
            onNo={() => {
              patch({ status: "done" });
            }}
            onYes={async () => {
              info(<Command>{install_command}</Command>);

              patch({ status: "install" });

              await cli(install_command, {
                env: {
                  ...process.env,
                  HOMEBREW_COLOR: "1",
                },
                onOutput: (data: string) => {
                  info(<Ink.Text>{data}</Ink.Text>);
                },
              });

              info(
                <Ink.Text key="done">
                  ✅ Installed <Brackets>{state.latest_version}</Brackets>
                </Ink.Text>,
              );

              patch({ status: "done" });
            }}
          />
        );
      }
    }
  }

  function handle_on_done() {
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
  }

  function handle_init_state() {
    init_state().catch(abort);

    async function init_state() {
      if (state.latest_version !== null) return;

      const local_version = process.env.CLI_VERSION;
      const latest_version = await get_latest_version();
      const is_brew_bun_standalone = get_is_brew_bun_standalone();
      patch({ local_version, latest_version, is_brew_bun_standalone });
    }

    async function get_latest_version() {
      const timeout_ms = is_finite_value(props.timeoutMs) ? props.timeoutMs : 2 * 1000;
      const timeout = get_timeout_fn(timeout_ms, "AutoUpdate timeout");
      const npm_json = await timeout(fetch_json(`https://registry.npmjs.org/${props.name}`));
      const maybe_version = npm_json?.["dist-tags"]?.latest;
      if (typeof maybe_version === "string") {
        return maybe_version;
      }
      throw new Error("Unable to retrieve latest version from npm");
    }

    function get_is_brew_bun_standalone() {
      const binary_path = process.argv[1];
      debug(<Ink.Text dimColor>{JSON.stringify({ binary_path })}</Ink.Text>);

      const is_bunfs_path = binary_path.startsWith("/$bunfs");
      debug(
        <Ink.Text dimColor>
          {is_bunfs_path
            ? "brew install detected (compiled bun standalone)"
            : "npm install detected"}
        </Ink.Text>,
      );

      return is_bunfs_path;
    }
  }

  function handle_status() {
    const latest_version = state.latest_version;

    if (latest_version === null) {
      return;
    }

    const local_version = state.local_version;

    if (!local_version) {
      throw new Error("Auto update requires process.env.CLI_VERSION to be set");
    }

    debug(
      <FormatText
        key="versions"
        wrapper={<Ink.Text dimColor />}
        message="Auto update found latest version {latest_version} and current local version {local_version}"
        values={{
          latest_version: <Brackets>{latest_version}</Brackets>,
          local_version: <Brackets>{local_version}</Brackets>,
        }}
      />,
    );

    const semver_result = semver_compare(latest_version, local_version);
    debug(<Ink.Text dimColor>{JSON.stringify({ semver_result })}</Ink.Text>);

    switch (semver_result) {
      case 0: {
        info_quiet(
          <Ink.Text>
            ✅ Everything up to date. <Brackets>{latest_version}</Brackets>
          </Ink.Text>,
        );

        return patch({ status: "done" });
      }

      case 1: {
        const old_tag = local_version;
        const new_tag = state.latest_version;
        const url = `https://github.com/magus/git-stack-cli/compare/${old_tag}...${new_tag}`;

        info(
          <Ink.Box flexDirection="column" gap={1} paddingTop={1} paddingBottom={1}>
            <Ink.Text>
              🆕 New version available! <Brackets>{latest_version}</Brackets>
            </Ink.Text>
            <Ink.Box flexDirection="column">
              <Ink.Text dimColor>Changelog</Ink.Text>
              <Url>{url}</Url>
            </Ink.Box>
          </Ink.Box>,
        );

        return patch({ status: "prompt" });
      }

      case -1: {
        info_quiet(
          <FormatText
            message="⚠️ Local version {local_version} is newer than latest version {latest_version}"
            values={{
              local_version: <Brackets>{local_version}</Brackets>,
              latest_version: <Brackets>{latest_version}</Brackets>,
            }}
          />,
        );

        return patch({ status: "done" });
      }

      default: {
        assertNever(semver_result);
        abort(new Error("AutoUpdate failed"));
      }
    }
  }

  function info(node: React.ReactNode) {
    handle_output(node);
  }

  function info_quiet(node: React.ReactNode) {
    if (props_ref.current.verbose || props_ref.current.force) {
      handle_output(node);
    }
  }

  function debug(node: React.ReactNode) {
    if (props_ref.current.verbose) {
      handle_output(node);
    }
  }
  function abort(error: Error) {
    info_quiet(
      <Ink.Text key="error" color={colors.red}>
        {error.message}
      </Ink.Text>,
    );
    patch({ status: "done" });
    props_ref.current.onError?.(error);
  }

  function handle_output(node: React.ReactNode) {
    if (typeof props.onOutput === "function") {
      props.onOutput(node);
    } else {
      set_output((current) => {
        return [...current, node];
      });
    }
  }
}
