import * as React from "react";

import * as Ink from "ink";
import { DateTime } from "luxon";

export function LogTimestamp() {
  return (
    <Ink.Text dimColor>
      {DateTime.now().toFormat("[yyyy-MM-dd HH:mm:ss.SSS] ")}
    </Ink.Text>
  );
}
