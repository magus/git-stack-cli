import * as React from "react";

import * as Ink from "ink";

import { invariant } from "../core/invariant.js";
import { short_id } from "../core/short_id.js";
import { wrap_index } from "../core/wrap_index.js";

import { Brackets } from "./Brackets.js";
import { FormatText } from "./FormatText.js";
import { MultiSelect } from "./MultiSelect.js";
import { Parens } from "./Parens.js";
import { Store } from "./Store.js";
import { TextInput } from "./TextInput.js";

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

  const [selected_group_id, set_selected_group_id] = React.useState(
    props.commit_range.UNASSIGNED
  );

  const [group_input, set_group_input] = React.useState(false);

  const [new_group_list, create_group] = React.useReducer(
    (group_list: Array<SimpleGroup>, group: SimpleGroup) => {
      return group_list.concat(group);
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
  let unassigned_count = 0;
  for (const [, group_id] of commit_map.entries()) {
    if (group_id === null) {
      // console.debug("unassigned commit detected", sha);
      unassigned_count++;
    }
  }

  group_list.push(...new_group_list);

  const total_group_count =
    new_group_list.length + props.commit_range.group_list.length;

  for (const group of props.commit_range.group_list) {
    if (group.pr?.state === "MERGED") continue;

    if (group.id === props.commit_range.UNASSIGNED) {
      // only include unassigned group when there are no other groups
      if (total_group_count === 1) {
        group_list.push({
          id: group.id,
          title: "Unassigned",
        });
      }

      continue;
    }

    group_list.push({
      id: group.id,
      title: group.pr?.title || group.id,
    });
  }

  let current_index = group_list.findIndex((g) => g.id === selected_group_id);
  if (current_index === -1) {
    current_index = 0;
  }

  Ink.useInput((input, key) => {
    const inputLower = input.toLowerCase();

    const hasUnassignedCommits = unassigned_count > 0;

    if (!hasUnassignedCommits && inputLower === "s") {
      actions.set((state) => {
        state.commit_map = {};

        for (const [sha, id] of commit_map.entries()) {
          if (id) {
            const group = group_list.find((g) => g.id === id);
            // console.debug({ sha, id, group });
            if (group) {
              state.commit_map[sha] = group;
            }
          }
        }

        switch (inputLower) {
          case "s":
            state.step = "manual-rebase";
            break;
        }
      });
      return;
    }

    // only allow create when on unassigned group
    if (hasUnassignedCommits && inputLower === "c") {
      set_group_input(true);
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

  const items = props.commit_range.commit_list.map((commit) => {
    const commit_metadata_id = commit_map.get(commit.sha);

    const selected = commit_metadata_id !== null;

    let disabled;

    if (group.id === props.commit_range.UNASSIGNED) {
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

  // <-  (2/4) #742 Title A ->

  const left_arrow = `${SYMBOL.left} `;
  const right_arrow = ` ${SYMBOL.right}`;
  const group_position = `(${current_index + 1}/${group_list.length}) `;

  const max_group_label_width = 80;
  let group_title_width = max_group_label_width;
  group_title_width -= group_position.length;
  group_title_width -= left_arrow.length + right_arrow.length;
  group_title_width = Math.min(group.title.length, group_title_width);

  let max_item_width = max_group_label_width;
  max_item_width -= left_arrow.length + right_arrow.length;

  return (
    <Ink.Box flexDirection="column">
      <Ink.Box height={1} />

      <MultiSelect
        key={group.id}
        items={items}
        maxWidth={max_item_width}
        disabled={group_input}
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
          <Ink.Text wrap="truncate-end">{group.title}</Ink.Text>
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
          <FormatText
            wrapper={<Ink.Text />}
            message="🎉 Done! Press {s} to {sync} the commits to Github"
            values={{
              s: (
                <Ink.Text bold color="#22c55e">
                  s
                </Ink.Text>
              ),
              sync: (
                <Ink.Text bold color="#22c55e">
                  <Parens>s</Parens>ync
                </Ink.Text>
              ),
            }}
          />
        </React.Fragment>
      )}

      {!group_input ? null : (
        <React.Fragment>
          <Ink.Box height={1} />

          <FormatText
            wrapper={<Ink.Text color="gray" />}
            message="Enter a title for the PR {note}"
            values={{
              note: (
                <Parens>
                  <FormatText
                    message="press {enter} to submit"
                    values={{
                      enter: (
                        <Ink.Text bold color="#22c55e">
                          {SYMBOL.enter}
                        </Ink.Text>
                      ),
                    }}
                  />
                </Parens>
              ),
            }}
          />

          <TextInput onSubmit={submit_group_input} />

          <Ink.Box height={1} />
        </React.Fragment>
      )}

      <Ink.Box>
        <FormatText
          wrapper={<Ink.Text color="gray" />}
          message="Press {left} and {right} to view PR groups"
          values={{
            left: (
              <Ink.Text bold color="#22c55e">
                {SYMBOL.left}
              </Ink.Text>
            ),
            right: (
              <Ink.Text bold color="#22c55e">
                {SYMBOL.right}
              </Ink.Text>
            ),
          }}
        />
      </Ink.Box>

      <Ink.Box>
        <FormatText
          wrapper={<Ink.Text color="gray" />}
          message="Press {enter} to toggle commit selection"
          values={{
            enter: (
              <Ink.Text bold color="#22c55e">
                {SYMBOL.enter}
              </Ink.Text>
            ),
          }}
        />
      </Ink.Box>
    </Ink.Box>
  );

  function submit_group_input(title: string) {
    const id = short_id();

    actions.output(
      <FormatText
        wrapper={<Ink.Text dimColor />}
        message="Created new group {group} {note}"
        values={{
          group: <Brackets>{title}</Brackets>,
          note: <Parens>{id}</Parens>,
        }}
      />
    );

    // console.debug("submit_group_input", { title, id });
    create_group({ id, title });
    set_selected_group_id(id);
    set_group_input(false);
  }
}

const SYMBOL = {
  left: "←",
  right: "→",
  enter: "Enter",
};
