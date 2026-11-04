// The backend stores naive UTC datetimes and sends them WITHOUT a "Z".
// Browsers would read those as local time, so always go through here.

const TIMEZONE = "Europe/Riga";

export function parseUtc(value) {
  if (!value) return null;

  const text = String(value);
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(text);

  return new Date(hasZone ? text : `${text}Z`);
}

export function formatTime(value) {
  const date = parseUtc(value);
  if (!date) return "-";

  return date.toLocaleTimeString("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value) {
  const date = parseUtc(value);
  if (!date) return "-";

  return date.toLocaleString("en-GB", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value) {
  if (!value) return "-";

  // work_date is a plain "YYYY-MM-DD"
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMinutes(minutes) {
  if (minutes == null || !Number.isFinite(Number(minutes))) return "-";

  const m = Number(minutes);
  if (m < 60) return `${m} min`;

  const h = Math.floor(m / 60);
  const rest = m % 60;

  return rest ? `${h} h ${rest} min` : `${h} h`;
}
