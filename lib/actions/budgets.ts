"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireHousehold } from "@/lib/household";

const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  monthlyLimit: z.coerce.number().positive(),
});

export async function setBudget(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = budgetSchema.parse({
    categoryId: formData.get("categoryId"),
    monthlyLimit: formData.get("monthlyLimit"),
  });

  const { error } = await supabase
    .from("budgets")
    .upsert(
      { household_id: householdId, category_id: parsed.categoryId, monthly_limit: parsed.monthlyLimit },
      { onConflict: "household_id,category_id" },
    );
  if (error) throw new Error(error.message);

  revalidatePath("/budget");
}

export async function removeBudget(categoryId: string) {
  const { supabase, householdId } = await requireHousehold();
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("household_id", householdId)
    .eq("category_id", categoryId);
  if (error) throw new Error(error.message);

  revalidatePath("/budget");
}
