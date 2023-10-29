import { createStore, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { Argv } from "../command.js";
import type { Instance as InkInstance } from "ink";

type Setter = (state: State) => void;

type State = {
  argv: null | Argv;
  ink: null | InkInstance;

  head: null | string;
  merge_base: null | string;
  branch_name: null | string;

  output: Array<React.ReactNode>;

  actions: {
    clear(): void;
    exit(): void;
    output(node: React.ReactNode): void;
    set(setter: Setter): void;
  };
};

const BaseStore = createStore<State>()(
  immer((set, get) => ({
    argv: null,
    ink: null,

    head: null,
    merge_base: null,
    branch_name: null,

    output: [],

    actions: {
      clear() {
        get().ink?.clear();
      },

      exit() {
        get().ink?.unmount();
      },

      output(node: React.ReactNode) {
        set((state) => {
          state.output.push(node);
        });
      },

      set(setter) {
        set((state) => {
          setter(state);
        });
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
