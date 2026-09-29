// Round-trip all offsets around a wall time: zero matches = gap, two = overlap.
export function resolveLocalTime(value, timeZone) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return [];
  const wall = Date.parse(value + ":00Z");
  if (!Number.isFinite(wall)) return [];
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const partsAt = (instant) =>
    Object.fromEntries(
      formatter.formatToParts(new Date(instant)).map((p) => [p.type, p.value]),
    );
  const wallAt = (instant) => {
    const p = partsAt(instant);
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  };
  const offsets = new Set(
    [-36, -12, 0, 12, 36].map((h) => {
      const probe = wall + h * 3600000;
      return wallAt(probe) - probe;
    }),
  );
  return [...offsets]
    .map((offset) => wall - offset)
    .filter((instant) => {
      const p = partsAt(instant);
      return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` === value;
    })
    .sort((a, b) => a - b);
}
