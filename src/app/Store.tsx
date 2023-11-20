import * as React from "react";

import * as Ink from "ink";
import { createStore, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

import { Exit } from "./Exit.js";

import type { Argv } from "../command.js";
import type * as CommitMetadata from "../core/CommitMetadata.js";
import type { PullRequest } from "../core/github.js";
import type { Instance as InkInstance } from "ink";

type Setter = (state: State) => void;

type CommitMap = Parameters<typeof CommitMetadata.range>[0];

export type State = {
  argv: null | Argv;
  ink: null | InkInstance;

  cwd: null | string;
  username: null | string;
  repo_path: null | string;
  head: null | string;
  merge_base: null | string;
  branch_name: null | string;
  commit_range: null | CommitMetadata.CommitRange;
  commit_map: null | CommitMap;

  step:
    | "github-api-error"
    | "loading"
    | "status"
    | "pre-select-commit-ranges"
    | "select-commit-ranges"
    | "manual-rebase"
    | "manual-rebase-no-sync"
    | "post-rebase-status";

  output: Array<React.ReactNode>;

  pr: { [branch: string]: PullRequest };

  actions: {
    exit(code: number, clear?: boolean): void;
    clear(): void;
    unmount(): void;
    newline(): void;
    json(value: object): void;
    output(node: React.ReactNode): void;
    debug(node: React.ReactNode): void;

    reset_pr(): void;

    set(setter: Setter): void;
  };

  mutate: {
    output(state: State, node: React.ReactNode): void;
  };
};

const BaseStore = createStore<State>()(
  immer((set, get) => ({
    argv: null,
    ink: null,

    cwd: null,
    username: null,
    repo_path: null,
    head: null,
    merge_base: null,
    branch_name: null,
    commit_range: null,
    commit_map: null,

    step: "loading",

    output: [],

    pr: {},

    actions: {
      exit(code, clear = true) {
        set((state) => {
          state.mutate.output(state, <Exit clear={clear} code={code} />);
        });
      },

      clear() {
        get().ink?.clear();
      },

      unmount() {
        get().ink?.unmount();
      },

      newline() {
        set((state) => {
          state.mutate.output(state, "‎");
        });
      },

      json(value) {
        set((state) => {
          state.mutate.output(state, JSON.stringify(value, null, 2));
        });
      },

      output(node: React.ReactNode) {
        set((state) => {
          state.mutate.output(state, node);
        });
      },

      debug(node: React.ReactNode) {
        set((state) => {
          if (state.argv?.debug) {
            state.mutate.output(state, node);
          }
        });
      },

      reset_pr() {
        set((state) => {
          state.pr = {};
        });
      },

      set(setter) {
        set((state) => {
          setter(state);
        });
      },
    },

    mutate: {
      output(state, node) {
        switch (typeof node) {
          case "boolean":
          case "number":
          case "string":
            state.output.push(<Ink.Text>{String(node)}</Ink.Text>);
            return;
        }

        state.output.push(node);
      },
    },
  }))
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
