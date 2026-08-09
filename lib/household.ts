import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Household del usuario autenticado. Cada usuario pertenece a un solo hogar (ver plan). */
export async function requireHousehold() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    throw new Error(
      "Este usuario no tiene un hogar asignado todavía. Créalo manualmente desde el SQL editor de Supabase.",
    );
  }

  return { supabase, user, householdId: membership.household_id as string };
}
