import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { command } from "~/command";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";

export function Config() {
  return <Await fallback={null} function={run} />;

  async function run() {
    const state = Store.getState();
    const actions = state.actions;

    const config = await get_explicit_args();
    const config_json = JSON.stringify(config).replace(/"/g, '\\"');

    actions.output(
      <Ink.Box flexDirection="column" gap={1} paddingTop={1}>
        <Ink.Text></Ink.Text>

        <FormatText
          message="Add the line below to your shell rc file ({zshrc}, {bashrc}, etc.)"
          values={{
            zshrc: <Ink.Text color={colors.gray}>.zshrc</Ink.Text>,
            bashrc: <Ink.Text color={colors.gray}>.bashrc</Ink.Text>,
          }}
        />

        <FormatText
          message={`{export} {ENV_VAR}{e}{q}{config_json}{q}`}
          values={{
            export: <Ink.Text color={colors.purple}>export</Ink.Text>,
            ENV_VAR: <Ink.Text color={colors.yellow}>{ENV_VAR}</Ink.Text>,
            e: <Ink.Text color={colors.purple}>{"="}</Ink.Text>,
            q: <Ink.Text color={colors.white}>{'"'}</Ink.Text>,
            config_json: <Ink.Text color={colors.green}>{config_json}</Ink.Text>,
          }}
        />
      </Ink.Box>,
    );

    actions.exit(0);
  }
}

export async function argv_with_config_from_env() {
  if (!process.env.GIT_STACK_CONFIG) {
    return await command(process.argv);
  }

  const env_config = parse_env_config();
  return await command(process.argv, { env_config });
}

function parse_env_config() {
  const GIT_STACK_CONFIG = process.env.GIT_STACK_CONFIG;
  invariant(GIT_STACK_CONFIG, "GIT_STACK_CONFIG must exist");

  try {
    const env_config = JSON.parse(GIT_STACK_CONFIG);
    return env_config;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`ERROR GIT_STACK_CONFIG=${GIT_STACK_CONFIG}`);
    // eslint-disable-next-line no-console
    console.error("ERROR GIT_STACK_CONFIG environment variable is not valid JSON");
    process.exit(18);
  }
}

async function get_explicit_args() {
  const default_argv = await command(["git", "stack"], COMMAND_OPTIONS);
  const state_argv = await command(process.argv, COMMAND_OPTIONS);

  const config: Record<string, any> = {};

  // find delta between default_argv and argv
  for (const key of Object.keys(state_argv)) {
    if (key === "_" || key === "$0") continue;

    const state_value = state_argv[key];
    const default_value = default_argv[key];
    const is_set = default_value !== state_value;
    if (is_set) {
      config[key] = state_value;
    }
  }

  return config;
}

const ENV_VAR = "GIT_STACK_CONFIG";

type CommandOptions = NonNullable<Parameters<typeof command>[1]>;

const COMMAND_OPTIONS = {
  parserConfiguration: {
    // Should aliases be removed before returning results? Default is `false`
    "strip-aliased": true,
  },
} satisfies CommandOptions;
