import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UnitEditor from "./UnitEditor";

export default async function UnitDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: unit }, { data: trainees }, { data: memberships }] = await Promise.all([
    supabase
      .from("training_units")
      .select("id, name, price_hall, price_outdoor, payment_via_club, active")
      .eq("id", params.id)
      .single(),
    supabase.from("trainees").select("id, full_name, active").order("full_name"),
    supabase.from("training_unit_trainees").select("trainee_id").eq("training_unit_id", params.id),
  ]);

  if (!unit) notFound();

  const memberIds = new Set((memberships ?? []).map((m) => m.trainee_id));

  return (
    <div className="space-y-4">
      <Link href="/admin/jednotky" className="text-sm text-gray-500 hover:text-gray-700">
        ← Zpět na seznam jednotek
      </Link>
      <UnitEditor
        unit={unit}
        trainees={trainees ?? []}
        memberIds={Array.from(memberIds)}
      />
    </div>
  );
}
