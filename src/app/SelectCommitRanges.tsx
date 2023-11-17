import * as React from "react";

import * as Ink from "ink";
import { v4 as uuid_v4 } from "uuid";

import { invariant } from "../core/invariant.js";
import { wrap_index } from "../core/wrap_index.js";

import { FormatText } from "./FormatText.js";
import { MultiSelect } from "./MultiSelect.js";
import { Parens } from "./Parens.js";
import { Store } from "./Store.js";

import type { State } from "./Store.js";

export function SelectCommitRanges() {
  const commit_range = Store.useState((state) => state.commit_range);

  invariant(commit_range, "commit_range must exist");

  return <SelectCommitRangesInternal commit_range={commit_range} />;
}

type Props = {
  commit_range: CommitRange;
};

type CommitRange = NonNullable<State["commit_range"]>;
type SimpleGroup = { id: string; title: string };

function SelectCommitRangesInternal(props: Props) {
  const actions = Store.useActions();

  const [new_group_list, create_group] = React.useReducer(
    (group_list: Array<SimpleGroup>, id: string) => {
      return group_list.concat({
        id,
        title: id,
      });
    },
    []
  );

  const [commit_map, update_commit_map] = React.useReducer(
    (
      map: Map<string, null | string>,
      args: { key: string; value: null | string }
    ) => {
      map.set(args.key, args.value);

      // console.debug("update_commit_map", map, args);
      return new Map(map);
    },
    new Map(),
    (map) => {
      for (const commit of props.commit_range.commit_list) {
        map.set(commit.sha, commit.branch_id);
      }

      return new Map(map);
    }
  );

  const group_list: Array<SimpleGroup> = [];

  // detect if there are unassigned commits
  // unshift an unassigned group if so to collect them
  let unassigned_count = 0;
  for (const [, group_id] of commit_map.entries()) {
    if (group_id === null) {
      // console.debug("unassigned commit detected", sha);
      unassigned_count++;
    }
  }

  if (unassigned_count) {
    group_list.push({
      id: "unassigned",
      title: "Unassigned",
    });
  }

  group_list.push(...new_group_list);

  for (const group of props.commit_range.group_list) {
    if (group.id !== props.commit_range.UNASSIGNED) {
      group_list.push({
        id: group.id,
        title: group.pr?.title || group.id,
      });
    }
  }

  const [selected_group_id, set_selected_group_id] = React.useState(
    group_list[0].id
  );

  const isUnassigned = selected_group_id === "unassigned";
  const current_index = group_list.findIndex((g) => g.id === selected_group_id);

  Ink.useInput((input, key) => {
    const inputLower = input.toLowerCase();

    const hasUnassignedCommits = unassigned_count > 0;

    if (!hasUnassignedCommits && (inputLower === "r" || inputLower === "s")) {
      actions.set((state) => {
        state.commit_map = {};
        for (const [sha, id] of commit_map.entries()) {
          if (id) {
            state.commit_map[sha] = id;
          }
        }

        switch (inputLower) {
          case "s":
            state.step = "manual-rebase";
            break;

          case "r":
            state.step = "manual-rebase-no-sync";
        }
      });
      return;
    }

    // only allow create when on unassigned group
    if (hasUnassignedCommits && inputLower === "c") {
      const id = uuid_v4();

      actions.output(
        <Ink.Box>
          <Ink.Text dimColor>{"Created new group "}</Ink.Text>
          <Ink.Text color="blueBright">{id}</Ink.Text>
        </Ink.Box>
      );

      create_group(id);
      set_selected_group_id(id);
      return;
    }

    if (key.leftArrow) {
      const new_index = wrap_index(current_index - 1, group_list);
      const next_group = group_list[new_index];
      return set_selected_group_id(next_group.id);
    }

    if (key.rightArrow) {
      const new_index = wrap_index(current_index + 1, group_list);
      const next_group = group_list[new_index];
      return set_selected_group_id(next_group.id);
    }
  });

  const group = group_list[current_index];

  // <-  (2/4) #742 Title A ->
  const max_group_label_width = 64;
  let group_title_width = max_group_label_width;

  const left_arrow = `${SYMBOL.left} `;
  const right_arrow = ` ${SYMBOL.right}`;
  const group_position = `(${current_index + 1}/${group_list.length}) `;
  const title = group.title || "Unassigned";

  group_title_width -= group_position.length;
  group_title_width -= left_arrow.length + right_arrow.length;
  group_title_width = Math.min(title.length, group_title_width);

  const items = props.commit_range.commit_list.map((commit) => {
    const commit_metadata_id = commit_map.get(commit.sha);

    const selected = commit_metadata_id !== null;

    let disabled;
    if (isUnassigned) {
      disabled = true;
    } else {
      disabled = Boolean(selected && commit_metadata_id !== group.id);
    }

    return {
      label: commit.message,
      value: commit,
      selected,
      disabled,
    };
  });

  items.reverse();

  // console.debug({ current_index, group, isUnassigned });

  return (
    <Ink.Box flexDirection="column">
      <Ink.Box height={1} />

      <MultiSelect
        key={group.id}
        items={items}
        onSelect={(args) => {
          // console.debug("onSelect", args);

          const key = args.item.sha;

          let value;
          if (args.selected) {
            value = group.id;
          } else {
            value = null;
          }

          update_commit_map({ key, value });
        }}
      />

      <Ink.Box height={1} />

      <Ink.Box width={max_group_label_width} flexDirection="row">
        <Ink.Text>{left_arrow}</Ink.Text>
        <Ink.Text>{group_position}</Ink.Text>

        <Ink.Box width={group_title_width} justifyContent="center">
          <Ink.Text wrap="truncate-end">{title}</Ink.Text>
        </Ink.Box>

        <Ink.Text>{right_arrow}</Ink.Text>
      </Ink.Box>

      <Ink.Box height={1} />

      {unassigned_count > 0 ? (
        <FormatText
          wrapper={<Ink.Text color="gray" />}
          message="{count} unassigned commits, press {c} to {create} a new group"
          values={{
            count: (
              <Ink.Text color="#3b82f6" bold>
                {unassigned_count}
              </Ink.Text>
            ),
            c: (
              <Ink.Text bold color="#22c55e">
                c
              </Ink.Text>
            ),
            create: (
              <Ink.Text bold color="#22c55e">
                <Parens>c</Parens>reate
              </Ink.Text>
            ),
          }}
        />
      ) : (
        <React.Fragment>
          <Ink.Text>
            {"🎉 Done! Press "}
            <Ink.Text bold color="#22c55e">
              s
            </Ink.Text>
            {" to "}
            <Ink.Text bold color="#22c55e">
              <Parens>s</Parens>ync
            </Ink.Text>
            {" the commits to Github"}
          </Ink.Text>

          <Ink.Text color="gray">
            <Ink.Text>{"Press "}</Ink.Text>
            <Ink.Text bold color="#22c55e">
              r
            </Ink.Text>
            {" to locally "}
            <Ink.Text bold color="#22c55e">
              <Parens>r</Parens>ebase
            </Ink.Text>
            {" only"}
          </Ink.Text>
        </React.Fragment>
      )}

      <Ink.Box>
        <Ink.Text color="gray">
          <Ink.Text>{"Press "}</Ink.Text>
          <Ink.Text bold color="#22c55e">
            {SYMBOL.left}
          </Ink.Text>
          {" and "}
          <Ink.Text bold color="#22c55e">
            {SYMBOL.right}
          </Ink.Text>
          {" to view PR groups"}
        </Ink.Text>
      </Ink.Box>

      <Ink.Box>
        <Ink.Text color="gray">
          <Ink.Text>{"Press "}</Ink.Text>
          <Ink.Text bold color="#22c55e">
            {SYMBOL.enter}
          </Ink.Text>
          {" to toggle commit selection"}
        </Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}

const SYMBOL = {
  left: "←",
  right: "→",
  enter: "Enter",
};
