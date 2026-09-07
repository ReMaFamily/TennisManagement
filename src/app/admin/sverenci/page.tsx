import { createClient } from "@/lib/supabase/server";
import { createTrainee } from "./actions";
import TraineeRow from "./TraineeRow";

export default async function SverenciPage() {
  const supabase = createClient();
  const { data: trainees } = await supabase
    .from("trainees")
    .select("id, full_name, active")
    .order("full_name");

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-medium text-gray-900 mb-3">Přidat nového svěřence</h2>
        <form action={createTrainee} className="flex flex-col sm:flex-row gap-2">
          <input
            name="full_name"
            required
            placeholder="Jméno a příjmení"
            className="input sm:max-w-xs"
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Přidat svěřence
          </button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {(trainees ?? []).map((t) => (
            <TraineeRow key={t.id} trainee={t} />
          ))}
          {(trainees ?? []).length === 0 && (
            <p className="p-4 text-sm text-gray-500">Zatím nejsou zadáni žádní svěřenci.</p>
          )}
        </div>
      </div>
    </div>
  );
}
