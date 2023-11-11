import * as React from "react";

import * as Ink from "ink";

import { invariant } from "../core/invariant.js";
import { wrap_index } from "../core/wrap_index.js";

import { MultiSelect } from "./MultiSelect.js";
import { Store } from "./Store.js";

import type { State } from "./Store.js";

export function SelectCommitRanges() {
  const commit_range = Store.useState((state) => state.commit_range);

  invariant(commit_range, "commit_range must exist");

  return <SelectCommitRangesInternal commit_range={commit_range} />;
}

type Props = {
  commit_range: NonNullable<State["commit_range"]>;
};

function SelectCommitRangesInternal(props: Props) {
  const group_list = Array.from(props.commit_range.group_map.values());

  const [index, set_index] = React.useReducer((_: unknown, value: number) => {
    return wrap_index(value, group_list);
  }, 0);

  Ink.useInput((_input, key) => {
    if (key.leftArrow) {
      return set_index(index - 1);
    }

    if (key.rightArrow) {
      return set_index(index + 1);
    }
  });

  const group = group_list[index];

  const items = props.commit_range.commit_list.map((meta) => {
    return {
      label: meta.message,
      value: meta,
    };
  });

  items.reverse();

  // <-  (2/4) #742 Title A ->
  const max_group_label_width = 32;
  let group_title_width = max_group_label_width;

  const left_arrow = "← ";
  const right_arrow = " →";
  const group_position = `(${index + 1}/${group_list.length}) `;
  const title = group.pr?.title || "Unassigned";

  group_title_width -= group_position.length;
  group_title_width -= left_arrow.length + right_arrow.length;
  group_title_width = Math.min(title.length, group_title_width);

  // console.debug({ group, max_group_label_width, group_title_width });

  return (
    <Ink.Box flexDirection="column">
      <Ink.Box flexDirection="column" paddingLeft={left_arrow.length}>
        <MultiSelect
          items={items}
          onSelect={(item, state) => {
            console.debug({ item, state });
          }}
        />

        <Ink.Box height={1} />

        <Ink.Text>Select commits to group into this PR</Ink.Text>

        <Ink.Box height={1} />
      </Ink.Box>

      {/* <Ink.Box width={max_group_label_width} flexDirection="row">
        {new Array(max_group_label_width).fill(1).map((_, i) => {
          return <Ink.Text key={i}>{i % 10}</Ink.Text>;
        })}
      </Ink.Box> */}

      <Ink.Box width={max_group_label_width} flexDirection="row">
        <Ink.Text>{left_arrow}</Ink.Text>
        <Ink.Text>{group_position}</Ink.Text>

        <Ink.Box width={group_title_width} justifyContent="center">
          <Ink.Text wrap="truncate-end">{title}</Ink.Text>
        </Ink.Box>

        <Ink.Text>{right_arrow}</Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
