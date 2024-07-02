type WriteArgs = {
  body: string;
  pr_url_list: Array<string>;
  selected_url: string;
};

export function write(args: WriteArgs) {
  const stack_table = table(args);

  let result = args.body;

  if (RE.stack_table.test(result)) {
    // replace stack table
    result = result.replace(RE.stack_table, stack_table);
  } else {
    // append stack table
    result = `${result}\n\n${stack_table}`;
  }

  result = result.trimEnd();

  return result;
}

export function table(args: WriteArgs) {
  const stack_pr_url_list = [...args.pr_url_list];
  const old_stack = parse(args.body);

  // remove existing stack pr urls from the old stack pr urls
  for (const pr_url of stack_pr_url_list) {
    old_stack.delete(pr_url);
  }

  // add remaining old stack pr urls to the front of stack pr url list
  const old_pr_list = Array.from(old_stack.keys());
  old_pr_list.reverse();
  for (const pr_url of old_pr_list) {
    stack_pr_url_list.unshift(pr_url);
  }

  const stack_list = [];
  const num_digits = String(stack_pr_url_list.length).length;

  for (let i = 0; i < stack_pr_url_list.length; i++) {
    const pr_url = stack_pr_url_list[i];

    const selected = args.selected_url === pr_url;

    let icon;
    if (old_stack.has(pr_url)) {
      icon = "✅";
    } else if (selected) {
      icon = "👉";
    } else {
      icon = "⏳";
    }

    const num = String(i + 1).padStart(num_digits, "0");

    stack_list.push(TEMPLATE.row({ icon, num, pr_url }));
  }

  if (!stack_list.length) {
    return "";
  }

  return TEMPLATE.stack_table(["", ...stack_list, "", ""].join("\n"));
}

export function parse(body: string): Map<string, StackTableRow> {
  const stack_table_match = body.match(RE.stack_table);

  if (!stack_table_match?.groups) {
    return new Map();
  }

  const rows_string = stack_table_match.groups["rows"];
  const row_list = rows_string.split("\n");

  const result = new Map<string, StackTableRow>();

  for (const row of row_list) {
    const row_match = row.match(RE.row);
    const parsed_row = row_match?.groups as StackTableRow;

    if (!parsed_row) {
      // skip invalid row
      continue;
    }

    if (!RE.pr_url.test(parsed_row.pr_url)) {
      continue;
    }

    result.set(parsed_row.pr_url, parsed_row);
  }

  return result;
}

const TEMPLATE = {
  stack_table(rows: string) {
    return `#### git stack${rows}`;
  },

  row(args: StackTableRow) {
    return `- ${args.icon} \`${args.num}\` ${args.pr_url}`;
  },
};

const RE = {
  // https://regex101.com/r/kqB9Ft/1
  stack_table: new RegExp(
    TEMPLATE.stack_table("\\s+(?<rows>(?:- [^\r^\n]*(?:[\r\n]+)?)+)")
  ),

  row: new RegExp(
    TEMPLATE.row({
      icon: "(?<icon>.+)",
      num: "(?<num>\\d+)",
      pr_url: "(?<pr_url>.+)",
    })
  ),

  pr_url: /^https:\/\/.*$/,
};

type StackTableRow = {
  icon: string;
  num: string;
  pr_url: string;
};
