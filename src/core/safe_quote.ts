// escape double-quote for cli
export function safe_quote(value: string) {
  let result = value;
  result = result.replace(RE.all_backslash, "\\\\");
  result = result.replace(RE.all_double_quote, '\\"');
  result = result.replace(RE.all_backtick, "\\`");
  return result;
}

const RE = {
  all_double_quote: /"/g,
  all_backtick: /`/g,
  all_backslash: /\\/g,
};
