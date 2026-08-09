"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireHousehold } from "@/lib/household";

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["expense", "income"]),
  emoji: z.string().optional(),
});

export async function createCategory(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = categorySchema.parse({
    name: formData.get("name"),
    type: formData.get("type"),
    emoji: formData.get("emoji") || undefined,
  });

  const { error } = await supabase.from("categories").insert({
    household_id: householdId,
    name: parsed.name,
    type: parsed.type,
    emoji: parsed.emoji ?? "📦",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/categories");
}

export async function setCategoryActive(id: string, active: boolean) {
  const { supabase } = await requireHousehold();
  const { error } = await supabase.from("categories").update({ is_active: active }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/categories");
}
