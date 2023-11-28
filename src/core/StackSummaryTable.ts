import type { State } from "../app/Store.js";

type WriteArgs = {
  body: string;
  commit_range: State["commit_range"];
  selected_group_id: string;
};

export function write(args: WriteArgs) {
  const group_list = args.commit_range?.group_list;

  if (!Array.isArray(group_list) || group_list.length === 0) {
    return "";
  }

  const stack_list = [];

  for (const group of group_list) {
    if (group.pr?.url) {
      const selected = args.selected_group_id === group.id;
      const icon = selected ? "👉" : "⏳";
      stack_list.push(`- ${icon} ${group.pr.url}`);
    }
  }

  const stack_table = TEMPLATE.stack_table(
    ["", ...stack_list, "", ""].join("\n")
  );

  let result = args.body;

  if (RE.stack_table.test(result)) {
    // replace stack table
    result = result.replace(new RegExp(RE.stack_table), stack_table);
  } else {
    // append stack table
    result = `${result}\n\n${stack_table}`;
  }

  result = result.trimEnd();

  return result;
}

const TEMPLATE = {
  stack_table(rows: string) {
    return `#### git stack${rows}`;
  },
};

const RE = {
  // https://regex101.com/r/kqB9Ft/1
  stack_table: new RegExp(
    TEMPLATE.stack_table("\\s+(?<rows>(?:- [^\r^\n]*(?:[\r\n]+)?)+)")
  ),
};
