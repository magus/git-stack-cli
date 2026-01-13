import * as React from "react";

import * as Ink from "ink-cjs";

import { FormatText } from "~/app/FormatText";
import { colors } from "~/core/colors";

type CacheMessageArgs = {
  hit: boolean;
  message: React.ReactNode;
  extra: React.ReactNode;
};

export function cache_message(args: CacheMessageArgs) {
  const status = args.hit ? (
    <Ink.Text bold color={colors.green}>
      HIT
    </Ink.Text>
  ) : (
    <Ink.Text bold color={colors.red}>
      MISS
    </Ink.Text>
  );

  return (
    <FormatText
      wrapper={<Ink.Text dimColor />}
      message="{message} {status} {extra}"
      values={{
        message: args.message,
        status,
        extra: args.extra,
      }}
    />
  );
}
