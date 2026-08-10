"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireHousehold } from "@/lib/household";

const accountSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["savings", "investment"]),
  emoji: z.string().optional(),
  goalAmount: z.coerce.number().positive().optional(),
  goalDate: z.string().optional(),
});

export async function createSavingsAccount(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = accountSchema.parse({
    name: formData.get("name"),
    kind: formData.get("kind") ?? "savings",
    emoji: formData.get("emoji") || undefined,
    goalAmount: formData.get("goalAmount") || undefined,
    goalDate: formData.get("goalDate") || undefined,
  });

  const { error } = await supabase.from("savings_accounts").insert({
    household_id: householdId,
    name: parsed.name,
    kind: parsed.kind,
    emoji: parsed.emoji ?? "🐷",
    goal_amount: parsed.goalAmount ?? null,
    goal_date: parsed.goalDate ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/savings");
  revalidatePath("/goals");
}

const movementSchema = z.object({
  savingsAccountId: z.string().uuid(),
  type: z.enum(["deposit", "withdrawal"]),
  amount: z.coerce.number().positive(),
  occurredOn: z.string().min(1),
  note: z.string().optional(),
});

export async function addSavingsMovement(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = movementSchema.parse({
    savingsAccountId: formData.get("savingsAccountId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    occurredOn: formData.get("occurredOn"),
    note: formData.get("note") || undefined,
  });

  const { error } = await supabase.from("savings_movements").insert({
    savings_account_id: parsed.savingsAccountId,
    household_id: householdId,
    type: parsed.type,
    amount: parsed.amount,
    occurred_on: parsed.occurredOn,
    note: parsed.note,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/savings/${parsed.savingsAccountId}`);
  revalidatePath("/savings");
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function deleteSavingsAccount(id: string, isGoal: boolean) {
  const { supabase, householdId } = await requireHousehold();
  const { error } = await supabase
    .from("savings_accounts")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);

  revalidatePath("/savings");
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  redirect(isGoal ? "/goals" : "/savings");
}
