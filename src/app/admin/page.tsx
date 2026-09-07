import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  const supabase = createClient();

  const [{ count: traineeCount }, { count: unitCount }, { count: sessionCount }] = await Promise.all([
    supabase.from("trainees").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("training_units").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <Link href="/admin/sverenci" className="card hover:border-brand-300 transition-colors">
        <div className="text-3xl font-semibold text-brand-700">{traineeCount ?? 0}</div>
        <div className="text-sm text-gray-500 mt-1">aktivních svěřenců</div>
      </Link>
      <Link href="/admin/jednotky" className="card hover:border-brand-300 transition-colors">
        <div className="text-3xl font-semibold text-brand-700">{unitCount ?? 0}</div>
        <div className="text-sm text-gray-500 mt-1">tréninkových jednotek</div>
      </Link>
      <div className="card">
        <div className="text-3xl font-semibold text-brand-700">{sessionCount ?? 0}</div>
        <div className="text-sm text-gray-500 mt-1">zapsaných tréninků celkem</div>
      </div>
    </div>
  );
}
