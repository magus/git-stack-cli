import * as React from "react";

import * as Ink from "ink";

import { invariant } from "../core/invariant.js";

import { MultiSelect } from "./MultiSelect.js";
import { Store } from "./Store.js";

export function SelectCommitRanges() {
  const commit_range = Store.useState((state) => state.commit_range);

  invariant(commit_range, "commit_range must exist");

  const items = commit_range.commit_list.map((meta) => {
    return {
      label: meta.message,
      value: meta,
    };
  });

  items.reverse();

  return (
    <Ink.Box flexDirection="column">
      <MultiSelect
        items={items}
        onSelect={(item, state) => {
          console.debug({ item, state });
        }}
      />

      <Ink.Box height={1} />

      <Ink.Text>Select commits...</Ink.Text>
    </Ink.Box>
  );
}
