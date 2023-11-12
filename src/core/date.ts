export function format(date: Date) {
  const year = intl_format(date, { year: "numeric" });
  const month = intl_format(date, { month: "2-digit" });
  const day = intl_format(date, { day: "2-digit" });

  const time = format_time(date);

  return `${year}-${month}-${day} ${time}`;
}

type IntlDateTimeFormatOptions = Parameters<typeof Intl.DateTimeFormat>[1];

export function intl_format(date: Date, options: IntlDateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function format_time(date: Date) {
  const time = intl_format(date, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return time;
}
