import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import SessionEditor from "./SessionEditor";

export default async function TreninkPage({
  searchParams,
}: {
  searchParams: { id?: string; saved?: string };
}) {
  const supabase = createClient();

  const [{ data: units }, { data: trainees }, { data: unitMemberships }, { data: recentSessions }] =
    await Promise.all([
      supabase
        .from("training_units")
        .select("id, name, price_hall, price_outdoor, payment_via_club, active")
        .order("name"),
      supabase.from("trainees").select("id, full_name").eq("active", true).order("full_name"),
      supabase.from("training_unit_trainees").select("training_unit_id, trainee_id"),
      supabase
        .from("sessions")
        .select("id, session_date, session_time, location, amount_total, training_units(name), session_participants(id)")
        .order("session_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  let editingSession = null;
  let editingParticipantIds: string[] = [];

  if (searchParams.id) {
    const { data } = await supabase
      .from("sessions")
      .select("id, training_unit_id, session_date, session_time, location, amount_total, payment_via_club")
      .eq("id", searchParams.id)
      .single();
    editingSession = data;

    if (data) {
      const { data: parts } = await supabase
        .from("session_participants")
        .select("trainee_id")
        .eq("session_id", data.id);
      editingParticipantIds = (parts ?? []).map((p) => p.trainee_id);
    }
  }

  const rosterByUnit: Record<string, string[]> = {};
  (unitMemberships ?? []).forEach((m) => {
    if (!rosterByUnit[m.training_unit_id]) rosterByUnit[m.training_unit_id] = [];
    rosterByUnit[m.training_unit_id].push(m.trainee_id);
  });

  const activeUnits = (units ?? []).filter((u) => u.active);
  // Do výběru zařadíme aktivní jednotky, a pokud upravovaný trénink patří
  // pod mezitím deaktivovanou jednotku, přidáme i tu (aby šla úprava dokončit).
  const editingUnit = editingSession
    ? (units ?? []).find((u) => u.id === editingSession!.training_unit_id)
    : undefined;
  const selectableUnits =
    editingUnit && !editingUnit.active ? [editingUnit, ...activeUnits] : activeUnits;
  // U nového zápisu chceme prázdný formulář - jednotka se nepředvyplňuje,
  // musí se vybrat ručně (teprve poté se doplní cena a seznam svěřenců).
  const defaultUnitId = editingSession?.training_unit_id ?? "";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">
        {editingSession ? "Úprava tréninku" : "Zápis tréninku"}
      </h1>

      {selectableUnits.length === 0 ? (
        <div className="card">
          <p className="text-sm text-gray-600">
            Nejprve je potřeba v administraci založit alespoň jednu tréninkovou jednotku.
          </p>
          <Link href="/admin/jednotky" className="btn-primary mt-3 inline-flex">
            Přejít do administrace
          </Link>
        </div>
      ) : (
        <SessionEditor
          // Klíč se změní při přepnutí na úpravu jiného tréninku i po
          // úspěšném uložení - donutí to formulář se znovu vykreslit od
          // začátku (vyprázdnit) místo aby si držel stará zadaná data.
          key={editingSession?.id ?? searchParams.saved ?? "new"}
          units={selectableUnits}
          defaultUnitId={defaultUnitId}
          allTrainees={trainees ?? []}
          rosterByUnit={rosterByUnit}
          editingSession={editingSession}
          editingParticipantIds={editingParticipantIds}
          justSaved={Boolean(searchParams.saved)}
        />
      )}

      <div className="card p-0 overflow-hidden">
        <h2 className="font-medium text-gray-900 px-4 pt-4 pb-2">Poslední zápisy</h2>
        <div className="divide-y divide-gray-100">
          {(recentSessions ?? []).map((s: any) => (
            <Link
              key={s.id}
              href={`/trenink?id=${s.id}`}
              className={`p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-gray-50 ${
                editingSession?.id === s.id || searchParams.saved === s.id ? "bg-brand-50" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(s.session_date)} {s.session_time?.slice(0, 5) ?? ""} ·{" "}
                  {s.location === "hala" ? "hala" : "venku"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {s.training_units?.name} · {s.session_participants?.length ?? 0} účastníků
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {formatCurrency(s.amount_total)}
              </div>
            </Link>
          ))}
          {(recentSessions ?? []).length === 0 && (
            <p className="p-4 text-sm text-gray-500">Zatím nejsou zapsány žádné tréninky.</p>
          )}
        </div>
      </div>
    </div>
  );
}
