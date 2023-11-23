import * as React from "react";

import fs from "node:fs";
import path from "node:path";

import * as Ink from "ink";

import { cli } from "../core/cli.js";
import { read_json } from "../core/read_json.js";
import { sleep } from "../core/sleep.js";

import { Brackets } from "./Brackets.js";
import { FormatText } from "./FormatText.js";
import { Parens } from "./Parens.js";
import { YesNoPrompt } from "./YesNoPrompt.js";

type Props = {
  name: string;
  children: React.ReactNode;
  verbose?: boolean;
  onError?: (error: Error) => void;
  onOutput?: (output: React.ReactNode) => void;
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
          <Ink.Text key="init" dimColor>
            Checking for latest version...
          </Ink.Text>
        );
      }

      const timeout_ms = 2 * 1000;

      const npm_res = await Promise.race([
        fetch(`https://registry.npmjs.org/${props.name}`),

        sleep(timeout_ms).then(() => {
          throw new Error("timeout");
        }),
      ]);

      const npm_json = await npm_res.json();

      latest_version = npm_json?.["dist-tags"]?.latest;

      if (!latest_version) {
        throw new Error("unable to retrieve latest version from npm");
      }

      const script_dir = path.dirname(fs.realpathSync(process.argv[1]));
      const package_json_path = path.join(script_dir, "..", "package.json");
      const package_json = read_json<{ version: string }>(package_json_path);

      if (!package_json) {
        // unable to find read package.json, skip auto update
        throw new Error(
          `unable to find read package.json [${package_json_path}]`
        );
      }

      local_version = package_json.version;

      if (props_ref.current.verbose) {
        handle_output(
          <FormatText
            key="versions"
            wrapper={<Ink.Text dimColor />}
            message="Auto update found latest version {latest_version} and current local version {local_version}"
            values={{
              latest_version: <Brackets>{latest_version}</Brackets>,
              local_version: <Parens>{local_version}</Parens>,
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
            <Ink.Text key="error" dimColor color="red">
              {error?.message}
            </Ink.Text>
          );
        }
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
              <Ink.Text color="yellow">
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
                    name: <Ink.Text color="yellow">{props.name}</Ink.Text>,
                    version: (
                      <Ink.Text color="#38bdf8">
                        {state.latest_version}
                      </Ink.Text>
                    ),
                  }}
                />
              );

              patch({ status: "install" });

              await cli(`npm install -g ${props.name}@latest`);

              patch({ status: "exit" });

              handle_output(
                <Ink.Text key="done" dimColor>
                  Auto update done.
                </Ink.Text>
              );
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

// returns +1 if version_a is greater than version_b
// returns -1 if version_a is less than version_b
// returns +0 if version_a is exactly equal to version_b
//
// Examples
//
//   semver_compare("0.1.1", "0.0.2"); //  1
//   semver_compare("1.0.1", "0.0.2"); //  1
//   semver_compare("0.0.1", "1.0.2"); // -1
//   semver_compare("0.0.1", "0.1.2"); // -1
//   semver_compare("1.0.1", "1.0.1"); //  0
//
function semver_compare(version_a: string, version_b: string) {
  const split_a = version_a.split(".").map(Number);
  const split_b = version_b.split(".").map(Number);

  const max_split_parts = Math.max(split_a.length, split_b.length);
  for (let i = 0; i < max_split_parts; i++) {
    const num_a = split_a[i] || 0;
    const num_b = split_b[i] || 0;

    if (num_a > num_b) return 1;
    if (num_a < num_b) return -1;
  }

  return 0;
}
