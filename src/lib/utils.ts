/** Rozpočítá celkovou částku mezi účastníky, zaokrouhleno nahoru na celé číslo. */
export function splitAmount(total: number, participantCount: number): number {
  if (participantCount <= 0) return 0;
  return Math.ceil(total / participantCount);
}

/** Formátování částky v Kč pro zobrazení v UI. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formátování data v českém formátu (d. m. yyyy). */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
}

/** Dnešní datum ve formátu YYYY-MM-DD (pro <input type="date">). */
export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** První den aktuálního měsíce ve formátu YYYY-MM-DD. */
export function firstDayOfMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Název měsíce v češtině pro dané YYYY-MM. */
export function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });
}
