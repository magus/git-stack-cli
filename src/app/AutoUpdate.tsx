import * as React from "react";

import fs from "node:fs/promises";
import path from "node:path";

import * as Ink from "ink-cjs";

import { Brackets } from "~/app/Brackets";
import { FormatText } from "~/app/FormatText";
import { YesNoPrompt } from "~/app/YesNoPrompt";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { fetch_json } from "~/core/fetch_json";
import { is_finite_value } from "~/core/is_finite_value";
import { read_json } from "~/core/read_json";
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
    let local_version: string | null = null;
    let latest_version: string | null = null;

    async function auto_update() {
      if (props_ref.current.verbose) {
        handle_output(
          <Ink.Text key="init">Checking for latest version...</Ink.Text>
        );
      }

      const timeout_ms = is_finite_value(props.timeoutMs)
        ? props.timeoutMs
        : 2 * 1000;

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

      const script_path = await fs.realpath(process.argv[1]);
      const script_dir = path.dirname(script_path);

      // dist/ts/index.js
      const package_json_path = path.join(
        script_dir,
        "..",
        "..",
        "package.json"
      );

      type PackageJson = { version: string };
      const package_json = await read_json<PackageJson>(package_json_path);

      if (!package_json) {
        // unable to find read package.json, skip auto update
        throw new Error(`Unable to read package.json [${package_json_path}]`);
      }

      local_version = package_json.version;

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
          />
        );
      }

      const semver_result = semver_compare(latest_version, local_version);

      if (semver_result === 0) {
        return;
      }

      if (semver_result === -1) {
        // latest version is less than or equal to local version, skip auto update
        throw new Error(
          `latest version < local_version, skipping auto update [${latest_version} < ${local_version}]`
        );
      }

      // trigger yes no prompt
      status = "prompt";
    }

    const onError = props_ref.current.onError || (() => {});

    auto_update()
      .then(() => {
        patch({ status, local_version, latest_version });
      })
      .catch((error) => {
        patch({ status, error, local_version, latest_version });
        onError(error);

        if (props_ref.current.verbose) {
          handle_output(
            <Ink.Text key="error" color={colors.red}>
              {error?.message}
            </Ink.Text>
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

      case "prompt":
        return (
          <YesNoPrompt
            message={
              <Ink.Text color={colors.yellow}>
                New version available, would you like to update?
              </Ink.Text>
            }
            onYes={async () => {
              handle_output(
                <FormatText
                  key="install"
                  wrapper={<Ink.Text />}
                  message="Installing {name}@{version}..."
                  values={{
                    name: (
                      <Ink.Text color={colors.yellow}>{props.name}</Ink.Text>
                    ),
                    version: (
                      <Ink.Text color={colors.blue}>
                        {state.latest_version}
                      </Ink.Text>
                    ),
                  }}
                />
              );

              patch({ status: "install" });

              await cli(`npm install -g ${props.name}@latest`);

              patch({ status: "exit" });

              handle_output(<Ink.Text key="done">Auto update done.</Ink.Text>);
            }}
            onNo={() => {
              patch({ status: "done" });
            }}
          />
        );

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
