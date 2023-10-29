import * as React from "react";

import { MultiSelect } from "./MultiSelect.js";

export function SelectCommitRanges() {
  const items = [
    {
      label: "One",
      value: 1,
    },
    {
      label: "Two",
      value: 2,
    },
    {
      label: "Three",
      value: 3,
    },
  ];

  return (
    <MultiSelect
      items={items}
      onSelect={(item, state) => {
        console.debug({ item, state });
      }}
    />
  );
}
