import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";

import { cli } from "./cli.js";

export async function pr_status(branch: string): Promise<null | PullRequest> {
  const result = await cli(
    `gh pr view ${branch} --json number,state,baseRefName,headRefName,commits`,
    {
      ignoreExitCode: true,
    }
  );

  if (result.code !== 0) {
    return null;
  }

  const cache = CACHE.getState().pr[branch];
  if (cache) {
    console.debug("pr_status", "CACHE", "HIT", branch);
    return cache;
  }

  console.debug("pr_status", "CACHE", "MISS", branch);

  const pr: PullRequest = JSON.parse(result.stdout);

  CACHE.getState().actions.set((state) => {
    state.pr[pr.headRefName] = pr;
  });

  return pr;
}

export async function pr_create(branch: string, base: string) {
  await cli(`gh pr create --fill --head ${branch} --base ${base}`);
}

export async function pr_base(branch: string, base: string) {
  await cli(`gh pr edit ${branch} --base ${base}`);
}

const CACHE = createStore<State>()(
  immer((set) => ({
    pr: {},

    actions: {
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
  }))
);

type State = {
  pr: { [branch: string]: PullRequest };

  actions: {
    reset_pr(): void;
    set(setter: (state: State) => void): void;
  };
};

type Commit = {
  authoredDate: string; // "2023-10-22T23:13:35Z"
  authors: [
    {
      email: string;
      id: string;
      login: string; // magus
      name: string; // magus
    },
  ];
  committedDate: string; // "2023-10-23T08:41:27Z"
  messageBody: string;
  messageHeadline: string;
  oid: string; // "ce7eadaa73518a92ae6a892c1e54c4f4afa6fbdd"
};

type PullRequest = {
  number: number;
  state: "OPEN" | "CLOSED";
  baseRefName: string;
  headRefName: string;
  commits: Array<Commit>;
};
