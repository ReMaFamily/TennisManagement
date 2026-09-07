"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateUnit, deleteUnit, setMembership } from "../actions";

type Unit = {
  id: string;
  name: string;
  price_hall: number;
  price_outdoor: number;
  payment_via_club: boolean;
  active: boolean;
};
type Trainee = { id: string; full_name: string; active: boolean };

export default function UnitEditor({
  unit,
  trainees,
  memberIds,
}: {
  unit: Unit;
  trainees: Trainee[];
  memberIds: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(unit);
  const [members, setMembers] = useState(new Set(memberIds));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateUnit(unit.id, {
        name: form.name.trim() || unit.name,
        price_hall: Number(form.price_hall) || 0,
        price_outdoor: Number(form.price_outdoor) || 0,
        payment_via_club: form.payment_via_club,
        active: form.active,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete() {
    if (!confirm(`Opravdu smazat jednotku "${unit.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteUnit(unit.id);
      if (res.error) {
        setError(res.error);
      } else {
        router.push("/admin/jednotky");
      }
    });
  }

  function toggleMember(traineeId: string, checked: boolean) {
    setMembers((prev) => {
      const next = new Set(prev);
      if (checked) next.add(traineeId);
      else next.delete(traineeId);
      return next;
    });
    startTransition(() => setMembership(unit.id, traineeId, checked));
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div>
          <label className="label">Název jednotky</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cena za trénink v hale (Kč)</label>
            <input
              type="number"
              min={0}
              step="1"
              className="input"
              value={form.price_hall}
              onChange={(e) => setForm({ ...form, price_hall: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Cena za trénink venku (Kč)</label>
            <input
              type="number"
              min={0}
              step="1"
              className="input"
              value={form.price_outdoor}
              onChange={(e) => setForm({ ...form, price_outdoor: Number(e.target.value) })}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Jde o celkovou částku za odtrénovanou jednotku, která se při zápisu tréninku rozpočítá mezi
          přítomné svěřence.
        </p>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.payment_via_club}
              onChange={(e) => setForm({ ...form, payment_via_club: e.target.checked })}
            />
            Platba jde přes oddíl
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Jednotka je aktivní
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button className="btn-primary" onClick={save} disabled={isPending}>
            {isPending ? "Ukládám…" : "Uložit"}
          </button>
          {saved && <span className="text-sm text-brand-600">Uloženo ✓</span>}
          <button className="btn-danger ml-auto" onClick={handleDelete} disabled={isPending}>
            Smazat jednotku
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-medium text-gray-900 mb-1">Svěřenci v jednotce</h2>
        <p className="text-xs text-gray-500 mb-3">
          Zaškrtnutí svěřenci se automaticky předvyplní při zápisu tréninku této jednotky.
        </p>
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
          {trainees.map((t) => (
            <label
              key={t.id}
              className={`flex items-center gap-2 py-1.5 text-sm ${
                t.active ? "text-gray-800" : "text-gray-400"
              }`}
            >
              <input
                type="checkbox"
                checked={members.has(t.id)}
                onChange={(e) => toggleMember(t.id, e.target.checked)}
              />
              {t.full_name}
              {!t.active && " (neaktivní)"}
            </label>
          ))}
          {trainees.length === 0 && (
            <p className="text-sm text-gray-500">Nejprve založte svěřence v sekci „Svěřenci“.</p>
          )}
        </div>
      </div>
    </div>
  );
}
