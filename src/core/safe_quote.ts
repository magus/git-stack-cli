// escape double-quote for cli
export function safe_quote(value: string) {
  let result = value;
  result = result.replace(RE.all_double_quote, '\\"');
  return result;
}

const RE = {
  all_double_quote: /"/g,
};
