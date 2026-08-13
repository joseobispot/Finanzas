"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireHousehold } from "@/lib/household";

const payableSchema = z.object({
  name: z.string().min(1),
  emoji: z.string().optional(),
});

export async function createPayable(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = payableSchema.parse({
    name: formData.get("name"),
    emoji: formData.get("emoji") || undefined,
  });

  const { error } = await supabase.from("payables").insert({
    household_id: householdId,
    name: parsed.name,
    emoji: parsed.emoji ?? "🛒",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/payables");
}

export async function updatePayable(id: string, formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = payableSchema.parse({
    name: formData.get("name"),
    emoji: formData.get("emoji") || undefined,
  });

  const { error } = await supabase
    .from("payables")
    .update({ name: parsed.name, emoji: parsed.emoji ?? "🛒" })
    .eq("id", id)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);

  revalidatePath(`/payables/${id}`);
  revalidatePath("/payables");
}

export async function deletePayable(id: string) {
  const { supabase, householdId } = await requireHousehold();
  const { error } = await supabase.from("payables").delete().eq("id", id).eq("household_id", householdId);
  if (error) throw new Error(error.message);

  revalidatePath("/payables");
  redirect("/payables");
}

const movementSchema = z.object({
  payableId: z.string().uuid(),
  type: z.enum(["charge", "payment"]),
  amount: z.coerce.number().positive(),
  occurredOn: z.string().min(1),
  note: z.string().optional(),
});

export async function addPayableMovement(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = movementSchema.parse({
    payableId: formData.get("payableId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    occurredOn: formData.get("occurredOn"),
    note: formData.get("note") || undefined,
  });

  const { error } = await supabase.from("payable_movements").insert({
    payable_id: parsed.payableId,
    household_id: householdId,
    type: parsed.type,
    amount: parsed.amount,
    occurred_on: parsed.occurredOn,
    note: parsed.note,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/payables/${parsed.payableId}`);
  revalidatePath("/payables");
}

export async function deletePayableMovement(payableId: string, id: string) {
  const { supabase, householdId } = await requireHousehold();
  const { error } = await supabase
    .from("payable_movements")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);

  revalidatePath(`/payables/${payableId}`);
  revalidatePath("/payables");
}
