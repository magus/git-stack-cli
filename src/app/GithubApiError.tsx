import * as React from "react";

import * as Ink from "ink";

import { cli } from "../core/cli.js";
import * as date from "../core/date.js";
import { invariant } from "../core/invariant.js";

import { Await } from "./Await.js";
import { Brackets } from "./Brackets.js";
import { Parens } from "./Parens.js";
import { Store } from "./Store.js";

export function GithubApiError() {
  const argv = Store.useState((state) => state.argv);
  invariant(argv, "argv must exist");

  return <Await fallback={null} function={run} />;
}

async function run() {
  const actions = Store.getState().actions;

  const res = await cli(`gh api https://api.github.com/rate_limit`);

  const res_json = JSON.parse(res.stdout);

  const resources_graphql = res_json.resources.graphql;

  const used = resources_graphql.used;
  const limit = resources_graphql.limit;
  const reset_date = new Date(resources_graphql.reset * 1000);

  // calculate the time remaining in minutes
  const now = new Date();
  const diff_seconds = (reset_date.getTime() - now.getTime()) / 1000;
  const diff_minutes = Math.round(diff_seconds / 60);

  const reset_time = date.format_time(reset_date);

  let time_until;
  if (diff_minutes < 0) {
    time_until = `${diff_seconds} seconds`;
  } else {
    time_until = `${diff_minutes} minutes`;
  }

  actions.output(
    <Ink.Text dimColor>
      <Ink.Text>{"Github "}</Ink.Text>

      <Brackets>graphql</Brackets>

      <Ink.Text>{" API rate limit "}</Ink.Text>

      <Brackets>
        <Ink.Text>{used}</Ink.Text>
        <Ink.Text>/</Ink.Text>
        <Ink.Text>{limit}</Ink.Text>
      </Brackets>

      <Ink.Text>{" will reset at "}</Ink.Text>

      <Ink.Text bold color="yellow">
        {reset_time}
      </Ink.Text>

      <Ink.Text> </Ink.Text>

      <Parens>
        <Ink.Text>{"in "}</Ink.Text>
        <Ink.Text bold color="yellow">
          {time_until}
        </Ink.Text>
      </Parens>
    </Ink.Text>
  );
}
