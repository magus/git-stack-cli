type WriteArgs = {
  body: string;
  pr_url_list: Array<string>;
  selected_url: string;
};

export function write(args: WriteArgs) {
  const stack_list = [];

  const digits = String(args.pr_url_list.length).length;

  for (let i = 0; i < args.pr_url_list.length; i++) {
    const pr_url = args.pr_url_list[i];

    if (pr_url) {
      const selected = args.selected_url === pr_url;

      const icon = selected ? "👉" : "⏳";

      const num = String(i + 1).padStart(digits, "0");

      stack_list.push(`- ${icon} \`${num}\` ${pr_url}`);
    }
  }

  // reverse order of pr list to match the order of git stack
  stack_list.reverse();

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
