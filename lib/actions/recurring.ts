"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireHousehold } from "@/lib/household";

const ruleSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.coerce.number().positive(),
  categoryId: z.string().uuid(),
  description: z.string().optional(),
  dayOfMonth: z.coerce.number().int().min(1).max(31),
  startDate: z.string().min(1),
});

export async function createRecurringRule(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();

  const parsed = ruleSchema.parse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") || undefined,
    dayOfMonth: formData.get("dayOfMonth"),
    startDate: formData.get("startDate"),
  });

  const { error } = await supabase.from("recurring_rules").insert({
    household_id: householdId,
    category_id: parsed.categoryId,
    type: parsed.type,
    amount: parsed.amount,
    description: parsed.description,
    day_of_month: parsed.dayOfMonth,
    start_date: parsed.startDate,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/transactions");
}

export async function setRecurringActive(id: string, active: boolean) {
  const { supabase } = await requireHousehold();
  const { error } = await supabase.from("recurring_rules").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/transactions");
}
