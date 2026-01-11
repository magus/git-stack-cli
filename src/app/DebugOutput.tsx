import * as React from "react";

import * as Ink from "ink-cjs";
import { DateTime } from "luxon";

type Props = {
  node: React.ReactNode;
  withoutTimestamp?: boolean;
};

export function DebugOutput(props: Props) {
  const { stdout } = Ink.useStdout();
  const available_width = stdout.columns;

  const timestamp_format = "yyyy-MM-dd HH:mm:ss.SSS";

  const maybe_timestamp = props.withoutTimestamp
    ? " ".repeat(timestamp_format.length)
    : DateTime.now().toFormat(timestamp_format);

  const timestamp_width = timestamp_format.length;
  const content_width = available_width - timestamp_width - 2;

  const content = (function () {
    switch (typeof props.node) {
      case "boolean":
      case "number":
      case "string": {
        return <Ink.Text dimColor>{String(props.node)}</Ink.Text>;
      }
      default:
        return props.node;
    }
  })();

  return (
    <Ink.Box flexDirection="column">
      <Ink.Box flexDirection="row" gap={1} width={available_width}>
        <Ink.Box width={timestamp_format.length} flexDirection="column">
          <Ink.Text dimColor>{maybe_timestamp}</Ink.Text>
        </Ink.Box>

        <Ink.Box width={content_width}>{content}</Ink.Box>
      </Ink.Box>
    </Ink.Box>
  );
}
