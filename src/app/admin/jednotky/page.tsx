import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { createUnit } from "./actions";

export default async function JednotkyPage() {
  const supabase = createClient();
  const { data: units } = await supabase
    .from("training_units")
    .select("id, name, price_hall, price_outdoor, payment_via_club, active")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-medium text-gray-900 mb-3">Přidat novou tréninkovou jednotku</h2>
        <form action={createUnit} className="flex flex-col sm:flex-row gap-2">
          <input
            name="name"
            required
            placeholder="Název (např. Pondělí - mladší žáci)"
            className="input sm:max-w-sm"
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Vytvořit jednotku
          </button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {(units ?? []).map((u) => (
            <Link
              key={u.id}
              href={`/admin/jednotky/${u.id}`}
              className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className={`font-medium truncate ${u.active ? "text-gray-900" : "text-gray-400 line-through"}`}>
                  {u.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  hala {formatCurrency(u.price_hall)} · venku {formatCurrency(u.price_outdoor)} ·{" "}
                  {u.payment_via_club ? "přes oddíl" : "mimo oddíl"}
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </Link>
          ))}
          {(units ?? []).length === 0 && (
            <p className="p-4 text-sm text-gray-500">Zatím nejsou vytvořeny žádné tréninkové jednotky.</p>
          )}
        </div>
      </div>
    </div>
  );
}
