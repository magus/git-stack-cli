import * as React from "react";

import * as Ink from "ink";

import { Store } from "../app/Store.js";

import { cli } from "./cli.js";

export async function pr_status(branch: string): Promise<null | PullRequest> {
  const state = Store.getState();
  const actions = state.actions;

  const result = await cli(
    `gh pr view ${branch} --json number,state,baseRefName,headRefName,commits,title,url`,
    {
      ignoreExitCode: true,
    }
  );

  if (result.code !== 0) {
    actions.output(<Ink.Text color="#ef4444">{result.output}</Ink.Text>);
    actions.exit(6);
  }

  const cache = state.pr[branch];

  if (cache) {
    actions.output(
      <Ink.Text>
        <Ink.Text dimColor>Github pr_status cache</Ink.Text>
        <Ink.Text> </Ink.Text>
        <Ink.Text bold color="#22c55e">
          {"HIT "}
        </Ink.Text>
        <Ink.Text> </Ink.Text>
        <Ink.Text dimColor>{branch}</Ink.Text>
      </Ink.Text>
    );

    return cache;
  }

  actions.output(
    <Ink.Text>
      <Ink.Text dimColor>Github pr_status cache</Ink.Text>
      <Ink.Text> </Ink.Text>
      <Ink.Text bold color="#ef4444">
        MISS
      </Ink.Text>
      <Ink.Text> </Ink.Text>
      <Ink.Text dimColor>{branch}</Ink.Text>
    </Ink.Text>
  );

  const pr: PullRequest = JSON.parse(result.stdout);

  actions.set((state) => {
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
