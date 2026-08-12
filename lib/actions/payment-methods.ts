"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireHousehold } from "@/lib/household";

const methodSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["cash", "debit", "credit"]),
  statementDay: z.coerce.number().int().min(1).max(31).optional(),
  paymentDay: z.coerce.number().int().min(1).max(31).optional(),
});

function parseMethod(formData: FormData) {
  const kind = formData.get("kind");
  return methodSchema.parse({
    name: formData.get("name"),
    kind,
    statementDay: kind === "credit" ? formData.get("statementDay") || undefined : undefined,
    paymentDay: kind === "credit" ? formData.get("paymentDay") || undefined : undefined,
  });
}

export async function createPaymentMethod(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = parseMethod(formData);

  const { error } = await supabase.from("payment_methods").insert({
    household_id: householdId,
    name: parsed.name,
    kind: parsed.kind,
    statement_day: parsed.statementDay ?? null,
    payment_day: parsed.paymentDay ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function updatePaymentMethod(id: string, formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = parseMethod(formData);

  const { error } = await supabase
    .from("payment_methods")
    .update({
      name: parsed.name,
      kind: parsed.kind,
      statement_day: parsed.statementDay ?? null,
      payment_day: parsed.paymentDay ?? null,
    })
    .eq("id", id)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function deletePaymentMethod(id: string) {
  const { supabase, householdId } = await requireHousehold();
  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
