import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Brackets } from "~/app/Brackets";
import { FormatText } from "~/app/FormatText";
import { Parens } from "~/app/Parens";
import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import * as date from "~/core/date";

type Props = {
  exit?: boolean;
};

export function GithubApiError(props: Props) {
  return (
    <Await
      fallback={<Ink.Text color={colors.yellow}>Fetching Github API usage…</Ink.Text>}
      function={() => run(props)}
    />
  );
}

async function run(props: Props) {
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
    <FormatText
      message="Github {graphql} API rate limit {ratio} will reset at {reset_time} {time_until}"
      values={{
        graphql: <Brackets>graphql</Brackets>,
        ratio: (
          <Brackets>
            <FormatText message="{used}/{limit}" values={{ used, limit }} />
          </Brackets>
        ),
        reset_time: (
          <Ink.Text bold color={colors.yellow}>
            {reset_time}
          </Ink.Text>
        ),
        time_until: (
          <Parens>
            <FormatText
              message="in {time_until}"
              values={{
                time_until: (
                  <Ink.Text bold color={colors.yellow}>
                    {time_until}
                  </Ink.Text>
                ),
              }}
            />
          </Parens>
        ),
      }}
    />,
  );

  if (props.exit) {
    actions.exit(0);
  }
}
