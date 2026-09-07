"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createUnit(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("training_units")
    .insert({ name })
    .select("id")
    .single();

  revalidatePath("/admin/jednotky");
  if (!error && data) {
    redirect(`/admin/jednotky/${data.id}`);
  }
}

export async function updateUnit(
  id: string,
  fields: {
    name: string;
    price_hall: number;
    price_outdoor: number;
    payment_via_club: boolean;
    active: boolean;
  }
) {
  const supabase = createClient();
  await supabase.from("training_units").update(fields).eq("id", id);
  revalidatePath("/admin/jednotky");
  revalidatePath(`/admin/jednotky/${id}`);
  revalidatePath("/trenink");
}

export async function deleteUnit(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("training_units").delete().eq("id", id);
  revalidatePath("/admin/jednotky");
  if (error) {
    return {
      error:
        "Jednotku nelze smazat, protože už k ní existují zapsané tréninky. Místo smazání ji můžete deaktivovat.",
    };
  }
  return { error: null };
}

export async function setMembership(unitId: string, traineeId: string, isMember: boolean) {
  const supabase = createClient();
  if (isMember) {
    await supabase
      .from("training_unit_trainees")
      .upsert(
        { training_unit_id: unitId, trainee_id: traineeId },
        { onConflict: "training_unit_id,trainee_id" }
      );
  } else {
    await supabase
      .from("training_unit_trainees")
      .delete()
      .eq("training_unit_id", unitId)
      .eq("trainee_id", traineeId);
  }
  revalidatePath(`/admin/jednotky/${unitId}`);
  revalidatePath("/trenink");
}
