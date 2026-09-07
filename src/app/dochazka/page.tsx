import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, firstDayOfMonthISO, todayISO } from "@/lib/utils";
import FilterForm from "./FilterForm";

type Row = {
  id: string;
  amount: number;
  trainee_id: string;
  trainees: { full_name: string } | null;
  sessions: {
    session_date: string;
    location: "hala" | "venku";
    training_units: { name: string } | null;
  } | null;
};

export default async function DochazkaPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const from = searchParams.from || firstDayOfMonthISO();
  const to = searchParams.to || todayISO();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("session_participants")
    .select(
      "id, amount, trainee_id, trainees(full_name), sessions!inner(session_date, location, training_units(name))"
    )
    .gte("sessions.session_date", from)
    .lte("sessions.session_date", to)
    .order("session_date", { foreignTable: "sessions", ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  const summaryMap = new Map<string, { name: string; count: number; total: number }>();
  for (const r of rows) {
    const name = r.trainees?.full_name ?? "?";
    const entry = summaryMap.get(r.trainee_id) ?? { name, count: 0, total: 0 };
    entry.count += 1;
    entry.total += r.amount;
    summaryMap.set(r.trainee_id, entry);
  }
  const summary = Array.from(summaryMap.values()).sort((a, b) => a.name.localeCompare(b.name, "cs"));
  const grandTotal = summary.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Docházka a platby</h1>

      <FilterForm from={from} to={to} />

      {error && <p className="text-sm text-red-600">Chyba při načítání dat: {error.message}</p>}

      <div className="card p-0 overflow-hidden">
        <h2 className="font-medium text-gray-900 px-4 pt-4 pb-2">Souhrn za období</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-2 font-medium">Svěřenec</th>
                <th className="px-4 py-2 font-medium text-right">Počet tréninků</th>
                <th className="px-4 py-2 font-medium text-right">Celkem k úhradě</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.name} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2 text-gray-800">{s.name}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{s.count}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">
                    {formatCurrency(s.total)}
                  </td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-gray-500">
                    V tomto období nejsou žádné záznamy.
                  </td>
                </tr>
              )}
            </tbody>
            {summary.length > 0 && (
              <tfoot>
                <tr className="border-t border-gray-200 font-medium">
                  <td className="px-4 py-2">Celkem</td>
                  <td></td>
                  <td className="px-4 py-2 text-right">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <h2 className="font-medium text-gray-900 px-4 pt-4 pb-2">Podrobný přehled</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-2 font-medium">Datum</th>
                <th className="px-4 py-2 font-medium">Jednotka</th>
                <th className="px-4 py-2 font-medium">Místo</th>
                <th className="px-4 py-2 font-medium">Svěřenec</th>
                <th className="px-4 py-2 font-medium text-right">Částka</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                    {r.sessions ? formatDate(r.sessions.session_date) : ""}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{r.sessions?.training_units?.name}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {r.sessions?.location === "hala" ? "hala" : "venku"}
                  </td>
                  <td className="px-4 py-2 text-gray-800">{r.trainees?.full_name}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(r.amount)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-gray-500">
                    Žádné záznamy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
