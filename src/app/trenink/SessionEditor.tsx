"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSession, deleteSession, quickCreateTrainee } from "./actions";
import { splitAmount, formatCurrency, todayISO } from "@/lib/utils";

type Unit = {
  id: string;
  name: string;
  price_hall: number;
  price_outdoor: number;
  payment_via_club: boolean;
  active: boolean;
};
type Trainee = { id: string; full_name: string };
type ExistingSession = {
  id: string;
  training_unit_id: string;
  session_date: string;
  session_time: string | null;
  location: "hala" | "venku";
  amount_total: number;
  payment_via_club: boolean;
} | null;

export default function SessionEditor({
  units,
  defaultUnitId,
  allTrainees,
  rosterByUnit,
  editingSession,
  editingParticipantIds,
  justSaved,
}: {
  units: Unit[];
  defaultUnitId: string;
  allTrainees: Trainee[];
  rosterByUnit: Record<string, string[]>;
  editingSession: ExistingSession;
  editingParticipantIds: string[];
  justSaved?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(Boolean(justSaved));

  const [traineesList, setTraineesList] = useState(allTrainees);
  const [sessionDate, setSessionDate] = useState(editingSession?.session_date ?? todayISO());
  const [sessionTime, setSessionTime] = useState(editingSession?.session_time?.slice(0, 5) ?? "");
  const [location, setLocation] = useState<"hala" | "venku">(editingSession?.location ?? "hala");
  const [unitId, setUnitId] = useState(editingSession?.training_unit_id ?? defaultUnitId);
  const initialUnit = units.find((u) => u.id === unitId);
  const [amountTotal, setAmountTotal] = useState<number>(
    editingSession?.amount_total ?? (initialUnit ? priceFor(initialUnit, "hala") : 0)
  );
  const [paymentViaClub, setPaymentViaClub] = useState(
    editingSession?.payment_via_club ?? initialUnit?.payment_via_club ?? false
  );
  const [participantIds, setParticipantIds] = useState<string[]>(
    editingSession ? editingParticipantIds : rosterByUnit[unitId] ?? []
  );
  const [addValue, setAddValue] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState("");

  // Po uložení a přesměrování na čistý formulář zpráva o uložení po chvíli zmizí.
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setSuccess(false), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function priceFor(unit: Unit | undefined, loc: "hala" | "venku") {
    if (!unit) return 0;
    return loc === "hala" ? unit.price_hall : unit.price_outdoor;
  }

  const currentUnit = units.find((u) => u.id === unitId);
  const perPerson = splitAmount(amountTotal, participantIds.length);

  // Rozdělení nabídky "přidat osobu" na dvě skupiny:
  // 1) svěřenci, kteří do této jednotky patří, ale byli z tréninku omylem odebráni,
  // 2) svěřenci z jiných jednotek (nebo bez jednotky), kteří přišli na trénink navíc.
  const { removableBack, fromElsewhere } = useMemo(() => {
    const unitRosterIds = new Set(rosterByUnit[unitId] ?? []);
    const notInSession = traineesList.filter((t) => !participantIds.includes(t.id));
    return {
      removableBack: notInSession.filter((t) => unitRosterIds.has(t.id)),
      fromElsewhere: notInSession.filter((t) => !unitRosterIds.has(t.id)),
    };
  }, [traineesList, participantIds, rosterByUnit, unitId]);

  const participantTrainees = participantIds
    .map((id) => traineesList.find((t) => t.id === id))
    .filter(Boolean) as Trainee[];

  function handleUnitChange(newUnitId: string) {
    const unit = units.find((u) => u.id === newUnitId);
    setUnitId(newUnitId);
    setAmountTotal(priceFor(unit, location));
    setPaymentViaClub(unit?.payment_via_club ?? false);
    setParticipantIds(rosterByUnit[newUnitId] ?? []);
  }

  function handleLocationChange(newLocation: "hala" | "venku") {
    setLocation(newLocation);
    setAmountTotal(priceFor(currentUnit, newLocation));
  }

  function addParticipant(id: string) {
    if (!id || participantIds.includes(id)) return;
    setParticipantIds((prev) => [...prev, id]);
    setAddValue("");
  }

  function removeParticipant(id: string) {
    setParticipantIds((prev) => prev.filter((p) => p !== id));
  }

  function handleQuickAdd() {
    const name = quickAddName.trim();
    if (!name) return;
    startTransition(async () => {
      const created = await quickCreateTrainee(name);
      if (created) {
        setTraineesList((prev) => [...prev, created].sort((a, b) => a.full_name.localeCompare(b.full_name, "cs")));
        setParticipantIds((prev) => [...prev, created.id]);
      }
      setQuickAddName("");
      setShowQuickAdd(false);
    });
  }

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await saveSession({
        sessionId: editingSession?.id ?? null,
        trainingUnitId: unitId,
        sessionDate,
        sessionTime: sessionTime || null,
        location,
        amountTotal: Number(amountTotal) || 0,
        paymentViaClub,
        participantIds,
      });
      if (res.error) {
        setError(res.error);
      } else {
        // Po uložení se formulář vyprázdní a je připravený na zápis další
        // tréninkové jednotky (parametr "saved" jen zobrazí potvrzení a
        // vynutí čerstvý formulář, i když se hned uloží další nový zápis).
        router.push(`/trenink?saved=${res.sessionId}`);
      }
    });
  }

  function handleDelete() {
    if (!editingSession) return;
    if (!confirm("Opravdu smazat tento zapsaný trénink?")) return;
    startTransition(async () => {
      await deleteSession(editingSession.id);
      router.push("/trenink");
    });
  }

  function handleNew() {
    router.push("/trenink");
  }

  return (
    <div className="card space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Datum</label>
          <input
            type="date"
            className="input"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Čas (nepovinné)</label>
          <input
            type="time"
            className="input"
            value={sessionTime}
            onChange={(e) => setSessionTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Místo tréninku</label>
        <div className="flex gap-2">
          <button
            type="button"
            className={location === "hala" ? "btn-primary flex-1" : "btn-secondary flex-1"}
            onClick={() => handleLocationChange("hala")}
          >
            Hala
          </button>
          <button
            type="button"
            className={location === "venku" ? "btn-primary flex-1" : "btn-secondary flex-1"}
            onClick={() => handleLocationChange("venku")}
          >
            Venku
          </button>
        </div>
      </div>

      <div>
        <label className="label">Tréninková jednotka</label>
        <select className="input" value={unitId} onChange={(e) => handleUnitChange(e.target.value)}>
          <option value="" disabled>
            — Vyberte jednotku —
          </option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className="label">Celková částka (Kč)</label>
          <input
            type="number"
            min={0}
            step="1"
            className="input"
            value={amountTotal}
            onChange={(e) => setAmountTotal(Number(e.target.value))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 pb-2.5">
          <input
            type="checkbox"
            checked={paymentViaClub}
            onChange={(e) => setPaymentViaClub(e.target.checked)}
          />
          Platba přes oddíl
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">
            Účastníci ({participantIds.length}) — {formatCurrency(perPerson)} / osobu
          </label>
        </div>

        <div className="space-y-1.5 mb-3">
          {participantTrainees.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
            >
              <span className="text-sm text-gray-800">{t.full_name}</span>
              <button
                type="button"
                onClick={() => removeParticipant(t.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Odebrat
              </button>
            </div>
          ))}
          {participantTrainees.length === 0 && (
            <p className="text-sm text-gray-500">Zatím nejsou přidáni žádní účastníci.</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="input"
            value={addValue}
            onChange={(e) => addParticipant(e.target.value)}
          >
            <option value="">+ Přidat osobu…</option>
            {removableBack.length > 0 && (
              <optgroup label="Odebraní z tohoto tréninku">
                {removableBack.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </optgroup>
            )}
            {fromElsewhere.length > 0 && (
              <optgroup label="Svěřenci z jiných jednotek">
                {fromElsewhere.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            type="button"
            className="btn-secondary whitespace-nowrap"
            onClick={() => setShowQuickAdd((v) => !v)}
          >
            + Nový svěřenec
          </button>
        </div>

        {showQuickAdd && (
          <div className="flex gap-2 mt-2">
            <input
              autoFocus
              className="input"
              placeholder="Jméno a příjmení"
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
            />
            <button type="button" className="btn-primary whitespace-nowrap" onClick={handleQuickAdd}>
              Založit a přidat
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && <p className="text-sm text-brand-600">Trénink byl uložen ✓</p>}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button className="btn-primary" onClick={handleSave} disabled={isPending}>
          {isPending ? "Ukládám…" : editingSession ? "Uložit změny" : "Uložit trénink"}
        </button>
        {editingSession && (
          <>
            <button className="btn-secondary" onClick={handleNew} disabled={isPending}>
              Nový zápis
            </button>
            <button className="btn-danger ml-auto" onClick={handleDelete} disabled={isPending}>
              Smazat trénink
            </button>
          </>
        )}
      </div>
    </div>
  );
}
