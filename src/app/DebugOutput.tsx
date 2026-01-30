import * as React from "react";

import * as Ink from "ink-cjs";
import { DateTime } from "luxon";

import { render_node } from "~/core/render_node";

type Props = {
  node: React.ReactNode;
};

export function DebugOutput(props: Props) {
  const { stdout } = Ink.useStdout();
  const available_width = stdout.columns;

  const timestamp = DateTime.now().toFormat("yyyy-MM-dd HH:mm:ss.SSS");
  const content_width = available_width - timestamp.length - 2;

  const content = render_node(props.node);

  return (
    <Ink.Box flexDirection="column">
      <Ink.Box flexDirection="row" gap={1} width={available_width}>
        <Ink.Box width={timestamp.length} flexDirection="column">
          <Ink.Text dimColor>{timestamp}</Ink.Text>
        </Ink.Box>

        <Ink.Box width={content_width}>{content}</Ink.Box>
      </Ink.Box>
    </Ink.Box>
  );
}
