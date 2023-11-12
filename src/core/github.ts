import { Store } from "../app/Store.js";

import { cli } from "./cli.js";

export async function pr_status(branch: string): Promise<null | PullRequest> {
  const result = await cli(
    `gh pr view ${branch} --json number,state,baseRefName,headRefName,commits,title,url`,
    {
      ignoreExitCode: true,
    }
  );

  if (result.code !== 0) {
    return null;
  }

  const cache = Store.getState().pr[branch];
  if (cache) {
    return cache;
  }

  const pr: PullRequest = JSON.parse(result.stdout);

  Store.getState().actions.set((state) => {
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

export type PullRequest = {
  number: number;
  state: "OPEN" | "CLOSED";
  baseRefName: string;
  headRefName: string;
  commits: Array<Commit>;
  title: string;
  url: string;
};
