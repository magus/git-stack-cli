import { createStore, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

type Setter = (state: State) => void;

type State = {
  head: null | string;
  merge_base: null | string;

  output: Array<React.ReactNode>;

  actions: {
    output(node: React.ReactNode): void;
    set(setter: Setter): void;
  };
};

const BaseStore = createStore<State>()(
  immer((set) => ({
    head: null,
    merge_base: null,

    output: [],

    actions: {
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
