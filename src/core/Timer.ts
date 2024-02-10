export function Timer() {
  const start_time = Date.now();

  function duration() {
    const duration_ms = Date.now() - start_time;

    if (duration_ms < MS.second) {
      return `${duration_ms}ms`;
    } else if (duration_ms < MS.minute) {
      const seconds = duration_ms / MS.second;
      return `${seconds.toFixed(1)}s`;
    } else if (duration_ms < MS.hour) {
      const minutes = duration_ms / MS.minute;
      return `${minutes.toFixed(1)}min`;
    }

    const hours = duration_ms / MS.hour;
    return `${hours.toFixed(1)}min`;
  }

  return { duration, start_time };
}

const MS = (function () {
  const millisecond = 1;
  const second = millisecond * 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  return {
    millisecond,
    second,
    minute,
    hour,
    day,
    week,
    month,
    year,
  };
})();
