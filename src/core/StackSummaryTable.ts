type WriteArgs = {
  body: string;
  pr_url_list: Array<string>;
  selected_url: string;
};

export function write(args: WriteArgs) {
  const stack_list = [];

  for (const pr_url of args.pr_url_list) {
    if (pr_url) {
      const selected = args.selected_url === pr_url;

      const icon = selected ? "👉" : "⏳";

      stack_list.push(`- ${icon} ${pr_url}`);
    }
  }

  let stack_table;

  if (stack_list.length > 1) {
    stack_table = TEMPLATE.stack_table(["", ...stack_list, "", ""].join("\n"));
  } else {
    stack_table = "";
  }

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
