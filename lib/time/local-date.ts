export function validateTimeZone(value: unknown) {
  const candidate = typeof value === "string" && value.length <= 80 ? value : "Asia/Tokyo";
  try { new Intl.DateTimeFormat("ja-JP", { timeZone: candidate }).format(); return candidate; } catch { return "Asia/Tokyo"; }
}

export function localDateAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: validateTimeZone(timeZone), year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
