import * as React from "react";

import * as Ink from "ink-cjs";

import { Brackets } from "~/app/Brackets";
import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
import { MultiSelect } from "~/app/MultiSelect";
import { Parens } from "~/app/Parens";
import { Store } from "~/app/Store";
import { TextInput } from "~/app/TextInput";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";
import { short_id } from "~/core/short_id";
import { wrap_index } from "~/core/wrap_index";

import type * as CommitMetadata from "~/core/CommitMetadata";

type CommitRangeGroup = NonNullable<Parameters<typeof CommitMetadata.range>[0]>[string];
type SimpleGroup = { id: string; title: string };

export function SelectCommitRanges() {
  const actions = Store.useActions();

  const commit_range = Store.useState((state) => state.commit_range);
  invariant(commit_range, "commit_range must exist");

  const argv = Store.useState((state) => state.argv);
  const branch_name = Store.useState((state) => state.branch_name);
  invariant(branch_name, "branch_name must exist");

  const [focused, set_focused] = React.useState("");

  const [selected_group_id, set_selected_group_id] = React.useState(() => {
    const first_group = commit_range.group_list.find((g) => g.id !== commit_range.UNASSIGNED);

    if (first_group) {
      return first_group.id;
    }

    return commit_range.UNASSIGNED;
  });

  const [group_input, set_group_input] = React.useState(false);

  const [new_group_list, create_group] = React.useReducer(
    (group_list: Array<SimpleGroup>, group: SimpleGroup) => {
      const next_group_list = group_list.concat(group);
      return next_group_list;
    },
    [],
  );

  const [group_master_base, set_group_master_base] = React.useReducer(
    (set: Set<string>, group_id: string) => {
      set.has(group_id) ? set.delete(group_id) : set.add(group_id);
      return new Set(set);
    },
    new Set<string>(),
    (set) => {
      for (const group of commit_range.group_list) {
        if (group.master_base) {
          set.add(group.id);
        }
      }

      return new Set(set);
    },
  );

  const [commit_map, update_commit_map] = React.useReducer(
    (map: Map<string, null | string>, args: { key: string; value: null | string }) => {
      map.set(args.key, args.value);

      // console.debug("update_commit_map", map, args);
      return new Map(map);
    },
    new Map(),
    (map) => {
      for (const commit of commit_range.commit_list) {
        map.set(commit.sha, commit.branch_id);
      }

      return new Map(map);
    },
  );

  const group_list: Array<SimpleGroup> = [];

  Ink.useInput((input, key) => {
    const input_lower = input.toLowerCase();

    // do not allow input when inputting group title
    if (group_input) {
      return;
    }

    if (input_lower === SYMBOL.s) {
      if (sync_status === "disabled") {
        return;
      }

      actions.set((state) => {
        const state_commit_map: Record<string, CommitRangeGroup> = {};

        for (let [sha, id] of commit_map.entries()) {
          // console.debug({ sha, id });

          // handle allow_unassigned case
          if (!id) {
            id = commit_range.UNASSIGNED;
            const title = "allow_unassigned";
            state_commit_map[sha] = { id, title, master_base: false };
            continue;
          }

          const group = group_list.find((g) => g.id === id);
          invariant(group, "group must exist");
          // console.debug({ group });
          const master_base = group_master_base.has(id);
          state_commit_map[sha] = { ...group, master_base };
        }

        state.commit_map = state_commit_map;
        state.step = "pre-manual-rebase";
      });

      return;
    }

    // only allow create when on unassigned group
    if (has_unassigned_commits && input_lower === SYMBOL.c) {
      set_group_input(true);
      return;
    }

    // only allow setting base branch when on a created group
    if (group.id !== commit_range.UNASSIGNED && input_lower === SYMBOL.m) {
      const group = group_list[current_index];
      set_group_master_base(group.id);
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

  // detect if there are unassigned commits
  let unassigned_count = 0;
  let assigned_count = 0;
  for (const [, group_id] of commit_map.entries()) {
    if (group_id === null) {
      // console.debug("unassigned commit detected", sha);
      unassigned_count++;
    } else {
      assigned_count++;
    }
  }

  if (!commit_range.group_list.length) {
    return null;
  }

  const total_group_count = new_group_list.length + commit_range.group_list.length;

  for (let i = 0; i < commit_range.group_list.length; i++) {
    const index = commit_range.group_list.length - i - 1;
    const group = commit_range.group_list[index];

    if (group.pr?.state === "MERGED") continue;

    if (group.id === commit_range.UNASSIGNED) {
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
      title: group.pr?.title || group.title || group.id,
    });
  }

  group_list.push(...new_group_list);

  let current_index = group_list.findIndex((g) => g.id === selected_group_id);
  if (current_index === -1) {
    current_index = 0;
  }

  const has_unassigned_commits = unassigned_count > 0;
  const has_assigned_commits = assigned_count > 0;

  const sync_status = detect_sync_status();
  // console.debug({ sync_status });

  const group = group_list[current_index];
  const is_master_base = group_master_base.has(group.id);

  const multiselect_disabled = group_input;
  const multiselect_disableSelect = group.id === commit_range.UNASSIGNED;

  const max_width = 80;
  const has_groups = group.id !== commit_range.UNASSIGNED;

  const items = commit_range.commit_list.map((commit) => {
    const commit_metadata_id = commit_map.get(commit.sha);

    const selected = commit_metadata_id !== null;

    let disabled;

    if (group_input) {
      disabled = true;
    } else if (!has_groups) {
      disabled = true;
    } else {
      disabled = Boolean(selected && commit_metadata_id !== group.id);
    }

    return {
      label: commit.subject_line,
      value: commit,
      selected,
      disabled,
    };
  });

  items.reverse();

  return (
    <Ink.Box flexDirection="column">
      <Ink.Box height={1} />

      {has_groups || group_input ? null : (
        <Ink.Box flexDirection="column">
          <Ink.Text bold color={colors.blue}>
            👋 Welcome to <Command>git stack</Command>!
          </Ink.Text>
          <Ink.Text color={colors.blue}>
            <FormatText
              message="Press {c} to {create} a new PR"
              values={{
                c: (
                  <Ink.Text bold color={colors.green}>
                    c
                  </Ink.Text>
                ),
                create: (
                  <Ink.Text bold color={colors.green}>
                    <Parens>c</Parens>reate
                  </Ink.Text>
                ),
              }}
            />
          </Ink.Text>
        </Ink.Box>
      )}

      {!has_groups || group_input ? null : (
        <React.Fragment>
          <Ink.Box width={max_width} flexDirection="row">
            <Ink.Box flexDirection="row">
              <Ink.Text bold color={colors.green}>
                {SYMBOL.left}
              </Ink.Text>
              <Ink.Box width={1} />
              <Ink.Text color={colors.gray}>Pull request</Ink.Text>
              <Ink.Box width={1} />
              <Ink.Text color={colors.gray}>
                {`(${current_index + 1}/${group_list.length})`}
              </Ink.Text>
              <Ink.Box width={1} />
              <Ink.Text bold color={colors.green}>
                {SYMBOL.right}
              </Ink.Text>
            </Ink.Box>
          </Ink.Box>

          <Ink.Box width={max_width}>
            <Ink.Text wrap="truncate-end" bold color={colors.white}>
              {group.title}
            </Ink.Text>
            {!is_master_base ? null : (
              // show base master
              <Ink.Text color={colors.yellow}> (base: master)</Ink.Text>
            )}
          </Ink.Box>
        </React.Fragment>
      )}

      {!group_input ? null : (
        <React.Fragment>
          <Ink.Box height={1} />

          <FormatText
            wrapper={<Ink.Text color={colors.gray} />}
            message="Enter a title for the PR {note}"
            values={{
              note: (
                <Parens>
                  <FormatText
                    message="press {enter} to submit"
                    values={{
                      enter: (
                        <Ink.Text bold color={colors.green}>
                          {SYMBOL.enter}
                        </Ink.Text>
                      ),
                    }}
                  />
                </Parens>
              ),
            }}
          />

          <TextInput
            defaultValue={focused}
            onSubmit={submit_group_input}
            onCancel={() => set_group_input(false)}
          />
        </React.Fragment>
      )}

      <Ink.Box height={1} />

      <MultiSelect
        startIndex={items.length - 1}
        items={items}
        maxWidth={max_width}
        disabled={multiselect_disabled}
        disableSelect={multiselect_disableSelect}
        onFocus={(args) => {
          // console.debug("onFocus", args);

          set_focused(args.item.subject_line);
        }}
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

      {has_unassigned_commits ? (
        <React.Fragment>
          <FormatText
            wrapper={<Ink.Text color={colors.gray} />}
            message="{count} unassigned commits"
            values={{
              count: (
                <Ink.Text color={colors.yellow} bold>
                  {unassigned_count}
                </Ink.Text>
              ),
            }}
          />

          {group_input ? null : (
            <FormatText
              wrapper={<Ink.Text color={colors.gray} />}
              message="Press {c} to {create} a new PR"
              values={{
                c: (
                  <Ink.Text bold color={colors.green}>
                    c
                  </Ink.Text>
                ),
                create: (
                  <Ink.Text bold color={colors.green}>
                    <Parens>c</Parens>reate
                  </Ink.Text>
                ),
              }}
            />
          )}

          {sync_status !== "allow_unassigned" ? null : (
            <FormatText
              wrapper={<Ink.Text color={colors.gray} />}
              message={
                argv.sync
                  ? "Press {s} to {sync} the {count} assigned commits to Github"
                  : "Press {s} to {sync} the {count} assigned commits locally"
              }
              values={{
                ...S_TO_SYNC_VALUES,
                count: (
                  <Ink.Text color={colors.yellow} bold>
                    {assigned_count}
                  </Ink.Text>
                ),
              }}
            />
          )}
        </React.Fragment>
      ) : (
        <FormatText
          wrapper={<Ink.Text />}
          message={
            argv.sync
              ? "🎉 Done! Press {s} to {sync} the PRs to Github"
              : "🎉 Done! Press {s} to {sync} the PRs locally"
          }
          values={S_TO_SYNC_VALUES}
        />
      )}

      <Ink.Box>
        <FormatText
          wrapper={<Ink.Text color={colors.gray} />}
          message="Press {left} and {right} to view PRs"
          values={{
            left: (
              <Ink.Text bold color={colors.green}>
                {SYMBOL.left}
              </Ink.Text>
            ),
            right: (
              <Ink.Text bold color={colors.green}>
                {SYMBOL.right}
              </Ink.Text>
            ),
          }}
        />
      </Ink.Box>

      <Ink.Box>
        <FormatText
          wrapper={<Ink.Text color={colors.gray} />}
          message="Press {enter} to toggle commit selection"
          values={{
            enter: (
              <Ink.Text bold color={colors.green}>
                {SYMBOL.enter}
              </Ink.Text>
            ),
          }}
        />
      </Ink.Box>

      {group.id === commit_range.UNASSIGNED ? null : (
        <Ink.Box>
          <FormatText
            wrapper={<Ink.Text color={colors.gray} />}
            message={
              is_master_base
                ? "Press {m} to {reset} current PR base to stack position"
                : "Press {m} to set current PR base to master"
            }
            values={{
              m: (
                <Ink.Text bold color={colors.green}>
                  {SYMBOL.m}
                </Ink.Text>
              ),
              reset: <Ink.Text color={colors.yellow}>reset</Ink.Text>,
            }}
          />
        </Ink.Box>
      )}
    </Ink.Box>
  );

  function get_group_id() {
    return `${branch_name}-${short_id()}`;
  }

  function submit_group_input(title: string) {
    const id = get_group_id();

    actions.output(
      <FormatText
        wrapper={<Ink.Text dimColor />}
        message="Created new PR {group} {note}"
        values={{
          group: <Brackets>{title}</Brackets>,
          note: <Parens>{id}</Parens>,
        }}
      />,
    );

    // console.debug("submit_group_input", { title, id });
    create_group({ id, title });
    set_selected_group_id(id);
    set_group_input(false);
  }

  function detect_sync_status() {
    invariant(commit_range, "commit_range must exist");

    if (!has_unassigned_commits) {
      return "allow";
    }

    if (!has_assigned_commits) {
      return "disabled";
    }

    let allow_unassigned_sync = null;

    for (let i = 0; i < commit_range.commit_list.length; i++) {
      const commit = commit_range.commit_list[i];
      const group_id = commit_map.get(commit.sha);
      // console.debug(commit.sha, group_id);

      // before detecting unassigned we are null
      if (allow_unassigned_sync === null) {
        if (group_id === null) {
          // console.debug("allow_unassigned_sync TRUE", { i });
          allow_unassigned_sync = true;
        }
      } else {
        // after detecting unassigned we assume we can unassigned sync
        // unless we detect an invariant violation, i.e. commit assigned to group
        if (group_id) {
          // console.debug("allow_unassigned_sync FALSE", { i });
          allow_unassigned_sync = false;
        }
      }
    }

    if (allow_unassigned_sync) {
      return "allow_unassigned";
    }

    return "disabled";
  }
}

const SYMBOL = {
  left: "←",
  right: "→",
  enter: "Enter",
  c: "c",
  s: "s",
  m: "m",
};

const S_TO_SYNC_VALUES = {
  s: (
    <Ink.Text bold color={colors.green}>
      s
    </Ink.Text>
  ),
  sync: (
    <Ink.Text bold color={colors.green}>
      <Parens>s</Parens>ync
    </Ink.Text>
  ),
};
