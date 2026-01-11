import * as React from "react";

import crypto from "node:crypto";

import * as Ink from "ink-cjs";
import { createStore, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

import { DebugOutput } from "~/app/DebugOutput";
import { Exit } from "~/app/Exit";
import { colors } from "~/core/colors";
import { pretty_json } from "~/core/pretty_json";

import type { Instance as InkInstance } from "ink-cjs";
import type { Argv } from "~/command";
import type * as CommitMetadata from "~/core/CommitMetadata";
import type { PullRequest } from "~/core/github";

type Setter = (state: State) => void;

type CommitMap = Parameters<typeof CommitMetadata.range>[0];

type MutateOutputArgs = {
  node: React.ReactNode;
  id?: string;
};

type SyncGithubState = {
  commit_range: CommitMetadata.CommitRange;
};

// async function that returns exit code
type AbortHandler = () => Promise<number>;

type ExitArgs = {
  quiet?: boolean;
  clear?: boolean;
};

export type State = {
  // set immediately in `index.tsx` so no `null` scenario
  process_argv: Array<string>;
  argv: Argv;
  ink: InkInstance;
  cwd: string;

  username: null | string;
  repo_path: null | string;
  repo_root: null | string;
  master_branch: string;
  head: null | string;
  branch_name: null | string;
  merge_base: null | string;
  commit_range: null | CommitMetadata.CommitRange;
  commit_map: null | CommitMap;
  pr_templates: Array<string>;
  pr_template_body: null | string;
  sync_github: null | SyncGithubState;
  is_dirty_check_stash: boolean;
  abort_handler: null | AbortHandler;
  exit_mode: null | "normal" | "quiet";

  step:
    | "github-api-error"
    | "loading"
    | "status"
    | "pre-local-merge-rebase"
    | "local-merge-rebase"
    | "select-commit-ranges"
    | "pre-manual-rebase"
    | "manual-rebase"
    | "sync-github"
    | "post-rebase-status";

  output: Array<[string, React.ReactNode]>;
  pending_output: Record<string, Array<string>>;

  // cache
  pr: { [branch: string]: PullRequest };
  cache_gh_cli_by_branch: { [branch: string]: { [command: string]: string } };

  actions: {
    exit(code: number, args?: ExitArgs): void;
    clear(): void;
    unmount(): void;
    newline(): void;
    json(value: pretty_json.JSONValue): void;
    error(error: unknown): void;
    output(node: React.ReactNode): void;
    debug(node: React.ReactNode): void;
    debug_pending(id: string, content: string): void;
    debug_pending_end(id: string): void;

    isDebug(): boolean;

    register_abort_handler(abort_handler: AbortHandler): void;
    unregister_abort_handler(): void;

    set(setter: Setter): void;
  };

  mutate: {
    output(state: State, args: MutateOutputArgs): void;
  };

  select: {
    debug(state: State): boolean;
  };
};

const BaseStore = createStore<State>()(
  immer((set, get) => ({
    // set immediately in `index.tsx` so no `null` scenario
    process_argv: [],
    argv: {} as Argv,
    ink: {} as InkInstance,
    cwd: "",

    username: null,
    repo_path: null,
    repo_root: null,
    master_branch: "origin/master",
    head: null,
    branch_name: null,
    merge_base: null,
    commit_range: null,
    commit_map: null,
    pr_templates: [],
    pr_template_body: null,
    sync_github: null,
    is_dirty_check_stash: false,
    abort_handler: null,
    exit_mode: null,

    step: "loading",

    output: [],
    pending_output: {},

    pr: {},
    cache_gh_cli_by_branch: {},

    actions: {
      exit(code, args) {
        const clear = args?.clear ?? true;

        set((state) => {
          if (args?.quiet ?? code === 0) {
            state.exit_mode = "quiet";
          } else {
            state.exit_mode = "normal";
          }

          const node = <Exit clear={clear} code={code} />;
          state.mutate.output(state, { node });
        });

        if (code > 0) {
          throw new Error(`exit(${JSON.stringify({ code, clear })})`);
        }
      },

      clear() {
        get().ink?.clear();
      },

      unmount() {
        get().ink?.unmount();
      },

      newline() {
        set((state) => {
          const node = "‎";
          state.mutate.output(state, { node });
        });
      },

      json(value) {
        set((state) => {
          const node = pretty_json(value);
          state.actions.debug(node);
        });
      },

      error(error) {
        let node: React.ReactNode;

        if (typeof error === "string") {
          node = <Ink.Text color={colors.red}>{error}</Ink.Text>;
        } else if (error instanceof Error) {
          node = (
            <Ink.Box flexDirection="column">
              <Ink.Text color={colors.red}>{error.stack}</Ink.Text>
            </Ink.Box>
          );
        } else {
          node = (
            <Ink.Text color={colors.red}>{`Unhandled error: ${JSON.stringify(error)}`}</Ink.Text>
          );
        }

        set((state) => {
          state.mutate.output(state, { node });
        });
      },

      output(node) {
        set((state) => {
          state.mutate.output(state, { node });
        });
      },

      debug(node) {
        if (get().actions.isDebug()) {
          set((state) => {
            state.mutate.output(state, { node: <DebugOutput node={node} /> });
          });
        }
      },

      debug_pending(id, content) {
        if (get().actions.isDebug()) {
          set((state) => {
            if (!state.pending_output[id]) {
              state.pending_output[id] = [];
            }

            state.pending_output[id].push(content);
          });
        }
      },

      debug_pending_end(id) {
        set((state) => {
          delete state.pending_output[id];
        });
      },

      isDebug() {
        const state = get();
        return state.select.debug(state);
      },

      register_abort_handler(abort_handler) {
        set((state) => {
          state.abort_handler = abort_handler;
        });
      },

      unregister_abort_handler() {
        set((state) => {
          state.abort_handler = null;
        });
      },

      set(setter) {
        set((state) => {
          setter(state);
        });
      },
    },

    mutate: {
      output(state, args) {
        const id = crypto.randomUUID();
        state.output.push([id, args.node]);
      },
    },

    select: {
      debug(state) {
        return state.argv?.verbose || false;
      },
    },
  })),
);

function useState<R>(selector: (state: State) => R): R {
  return useStore(BaseStore, selector);
}

function useActions() {
  return useState((state) => state.actions);
}

const getState = BaseStore.getState;
const setState = BaseStore.setState;
const subscribe = BaseStore.subscribe;

export const Store = { useActions, useState, getState, setState, subscribe };
