export function get_local_iso(date: Date) {
  const d: Record<string, string> = {};
  for (const part of FORMATTER.formatToParts(date)) {
    d[part.type] = part.value;
  }

  const ms = String(date.getMilliseconds()).padStart(3, "0");
  const timestamp = `${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}:${d.second}.${ms}Z`;
  return timestamp;
}

const FORMATTER = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
