"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireHousehold } from "@/lib/household";

const loanSchema = z.object({
  name: z.string().min(1),
  principal: z.coerce.number().positive(),
  annualInterestRate: z.coerce.number().min(0),
  termMonths: z.coerce.number().int().positive(),
  startDate: z.string().min(1),
});

export async function createLoan(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = loanSchema.parse({
    name: formData.get("name"),
    principal: formData.get("principal"),
    annualInterestRate: formData.get("annualInterestRate"),
    termMonths: formData.get("termMonths"),
    startDate: formData.get("startDate"),
  });

  const { error } = await supabase.from("loans").insert({
    household_id: householdId,
    name: parsed.name,
    principal: parsed.principal,
    annual_interest_rate: parsed.annualInterestRate,
    term_months: parsed.termMonths,
    start_date: parsed.startDate,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/loans");
  revalidatePath("/dashboard");
}

export async function updateLoan(id: string, formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = loanSchema.parse({
    name: formData.get("name"),
    principal: formData.get("principal"),
    annualInterestRate: formData.get("annualInterestRate"),
    termMonths: formData.get("termMonths"),
    startDate: formData.get("startDate"),
  });

  const { error } = await supabase
    .from("loans")
    .update({
      name: parsed.name,
      principal: parsed.principal,
      annual_interest_rate: parsed.annualInterestRate,
      term_months: parsed.termMonths,
      start_date: parsed.startDate,
    })
    .eq("id", id)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);

  revalidatePath(`/loans/${id}`);
  revalidatePath("/loans");
  revalidatePath("/dashboard");
}

export async function deleteLoan(id: string) {
  const { supabase, householdId } = await requireHousehold();
  const { error } = await supabase.from("loans").delete().eq("id", id).eq("household_id", householdId);
  if (error) throw new Error(error.message);

  revalidatePath("/loans");
  revalidatePath("/dashboard");
  redirect("/loans");
}

const paymentSchema = z.object({
  loanId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  paidOn: z.string().min(1),
  note: z.string().optional(),
});

export async function addLoanPayment(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  const parsed = paymentSchema.parse({
    loanId: formData.get("loanId"),
    amount: formData.get("amount"),
    paidOn: formData.get("paidOn"),
    note: formData.get("note") || undefined,
  });

  const { error } = await supabase.from("loan_payments").insert({
    loan_id: parsed.loanId,
    household_id: householdId,
    amount: parsed.amount,
    paid_on: parsed.paidOn,
    note: parsed.note,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/loans/${parsed.loanId}`);
  revalidatePath("/loans");
  revalidatePath("/dashboard");
}
