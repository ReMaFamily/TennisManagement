"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTrainee(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  if (!fullName) return;

  const supabase = createClient();
  await supabase.from("trainees").insert({ full_name: fullName });
  revalidatePath("/admin/sverenci");
  revalidatePath("/trenink");
}

export async function updateTraineeName(id: string, fullName: string) {
  const supabase = createClient();
  await supabase.from("trainees").update({ full_name: fullName }).eq("id", id);
  revalidatePath("/admin/sverenci");
  revalidatePath("/trenink");
}

export async function toggleTraineeActive(id: string, active: boolean) {
  const supabase = createClient();
  await supabase.from("trainees").update({ active }).eq("id", id);
  revalidatePath("/admin/sverenci");
  revalidatePath("/trenink");
}

export async function deleteTrainee(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("trainees").delete().eq("id", id);
  revalidatePath("/admin/sverenci");
  revalidatePath("/trenink");
  if (error) {
    return {
      error:
        "Svěřence nelze smazat, protože je použit v zapsaných trénincích. Místo smazání ho můžete deaktivovat.",
    };
  }
  return { error: null };
}
