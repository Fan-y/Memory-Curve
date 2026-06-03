export function toDateKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfDay(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMinutes(durationMs: number): string {
  if (durationMs <= 0) {
    return "0 分钟";
  }

  const minutes = durationMs / 60000;
  return `${minutes.toFixed(1)} 分钟`;
}
