"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { splitAmount } from "@/lib/utils";

export type SaveSessionPayload = {
  sessionId: string | null;
  trainingUnitId: string;
  sessionDate: string;
  sessionTime: string | null;
  location: "hala" | "venku";
  amountTotal: number;
  paymentViaClub: boolean;
  participantIds: string[];
};

export async function saveSession(
  payload: SaveSessionPayload
): Promise<{ error: string | null; sessionId: string | null }> {
  if (!payload.trainingUnitId) {
    return { error: "Vyberte tréninkovou jednotku.", sessionId: null };
  }
  if (!payload.sessionDate) {
    return { error: "Vyberte datum tréninku.", sessionId: null };
  }
  if (payload.participantIds.length === 0) {
    return { error: "Přidejte alespoň jednoho účastníka tréninku.", sessionId: null };
  }

  const supabase = createClient();

  const sessionRow = {
    training_unit_id: payload.trainingUnitId,
    session_date: payload.sessionDate,
    session_time: payload.sessionTime || null,
    location: payload.location,
    amount_total: payload.amountTotal,
    payment_via_club: payload.paymentViaClub,
  };

  let sessionId = payload.sessionId;

  if (sessionId) {
    const { error } = await supabase.from("sessions").update(sessionRow).eq("id", sessionId);
    if (error) return { error: "Uložení se nezdařilo: " + error.message, sessionId: null };
  } else {
    const { data, error } = await supabase
      .from("sessions")
      .insert(sessionRow)
      .select("id")
      .single();
    if (error || !data) return { error: "Uložení se nezdařilo: " + error?.message, sessionId: null };
    sessionId = data.id;
  }

  const perPerson = splitAmount(payload.amountTotal, payload.participantIds.length);

  const { error: delError } = await supabase
    .from("session_participants")
    .delete()
    .eq("session_id", sessionId)
    .not("trainee_id", "in", `(${payload.participantIds.join(",")})`);

  if (delError) {
    return { error: "Uložení se nezdařilo: " + delError.message, sessionId: null };
  }

  const upsertRows = payload.participantIds.map((traineeId) => ({
    session_id: sessionId,
    trainee_id: traineeId,
    amount: perPerson,
  }));

  const { error: upsertError } = await supabase
    .from("session_participants")
    .upsert(upsertRows, { onConflict: "session_id,trainee_id" });

  if (upsertError) {
    return { error: "Uložení se nezdařilo: " + upsertError.message, sessionId: null };
  }

  revalidatePath("/trenink");
  revalidatePath("/dochazka");

  return { error: null, sessionId };
}

export async function deleteSession(id: string) {
  const supabase = createClient();
  await supabase.from("sessions").delete().eq("id", id);
  revalidatePath("/trenink");
  revalidatePath("/dochazka");
}

export async function quickCreateTrainee(
  fullName: string
): Promise<{ id: string; full_name: string } | null> {
  const trimmed = fullName.trim();
  if (!trimmed) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("trainees")
    .insert({ full_name: trimmed })
    .select("id, full_name")
    .single();

  revalidatePath("/trenink");
  revalidatePath("/admin/sverenci");

  if (error || !data) return null;
  return data;
}
