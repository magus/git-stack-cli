import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Brackets } from "~/app/Brackets";
import { Parens } from "~/app/Parens";
import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import * as date from "~/core/date";

export function GithubApiError() {
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

      <Ink.Text bold color={colors.yellow}>
        {reset_time}
      </Ink.Text>

      <Ink.Text> </Ink.Text>

      <Parens>
        <Ink.Text>{"in "}</Ink.Text>
        <Ink.Text bold color={colors.yellow}>
          {time_until}
        </Ink.Text>
      </Parens>
    </Ink.Text>,
  );
}
