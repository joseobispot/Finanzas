"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireHousehold } from "@/lib/household";

const transactionSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.coerce.number().positive(),
  categoryId: z.string().uuid(),
  occurredOn: z.string().min(1),
  description: z.string().optional(),
});

export async function createTransaction(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();

  const parsed = transactionSchema.parse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    occurredOn: formData.get("occurredOn"),
    description: formData.get("description") || undefined,
  });

  const { error } = await supabase.from("transactions").insert({
    household_id: householdId,
    category_id: parsed.categoryId,
    user_id: user.id,
    type: parsed.type,
    amount: parsed.amount,
    description: parsed.description,
    occurred_on: parsed.occurredOn,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/reports");
}

export async function deleteTransaction(id: string) {
  const { supabase } = await requireHousehold();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/reports");
}
