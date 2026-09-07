"use client";

import { useState, useTransition } from "react";
import { updateTraineeName, toggleTraineeActive, deleteTrainee } from "./actions";

type Trainee = { id: string; full_name: string; active: boolean };

export default function TraineeRow({ trainee }: { trainee: Trainee }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(trainee.full_name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === trainee.full_name) {
      setEditing(false);
      setName(trainee.full_name);
      return;
    }
    startTransition(async () => {
      await updateTraineeName(trainee.id, trimmed);
      setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm(`Opravdu smazat svěřence "${trainee.full_name}"?`)) return;
    startTransition(async () => {
      const res = await deleteTrainee(trainee.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="p-3 sm:p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            className="input py-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
          />
        ) : (
          <button
            className={`text-left w-full truncate ${trainee.active ? "text-gray-900" : "text-gray-400 line-through"}`}
            onClick={() => setEditing(true)}
            title="Klikněte pro úpravu jména"
          >
            {trainee.full_name}
          </button>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
        <input
          type="checkbox"
          checked={trainee.active}
          disabled={isPending}
          onChange={(e) => startTransition(() => toggleTraineeActive(trainee.id, e.target.checked))}
        />
        aktivní
      </label>
      <button
        className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap"
        disabled={isPending}
        onClick={handleDelete}
      >
        Smazat
      </button>
    </div>
  );
}
