// The backend stores naive UTC datetimes and sends them WITHOUT a "Z".
// Parsing them directly would treat them as phone-local time, so always
// go through these helpers. Everything is shown in the restaurant's time.

const TIMEZONE = 'Europe/Riga';

export function parseUtc(value?: string | null): Date | null {
  if (!value) return null;

  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTime(value?: string | null): string {
  const date = parseUtc(value);
  if (!date) return '—';

  return date.toLocaleTimeString('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(value?: string | null): string {
  const date = parseUtc(value);
  if (!date) return '—';

  return date.toLocaleString('en-GB', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// work_date is a plain "YYYY-MM-DD"
export function formatDate(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export function formatMinutes(minutes?: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return '—';
  if (minutes < 60) return `${minutes} min`;

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m ? `${h} h ${m} min` : `${h} h`;
}

// Today's date in the restaurant's timezone as YYYY-MM-DD
export function todayInRiga(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

// "YYYY-MM-DD" shifted by whole days (pure calendar math, no timezones)
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export const SOURCE_LABELS: Record<string, string> = {
  qr: 'QR scan',
  button: 'Button',
  manual: 'Manual',
};
