"use client";

import { useState } from "react";
import { createPaymentMethod } from "@/lib/actions/payment-methods";

export function CreatePaymentMethodForm() {
  const [kind, setKind] = useState<"cash" | "debit" | "credit">("credit");

  return (
    <form
      action={(formData) => {
        createPaymentMethod(formData);
      }}
      className="flex flex-col gap-2.5"
    >
      <input
        name="name"
        required
        placeholder="Nombre (ej. Visa Popular, Efectivo)"
        className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
      />
      <select
        name="kind"
        value={kind}
        onChange={(e) => setKind(e.target.value as typeof kind)}
        className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
      >
        <option value="credit">Tarjeta de crédito</option>
        <option value="debit">Tarjeta de débito</option>
        <option value="cash">Efectivo</option>
      </select>
      {kind === "credit" ? (
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Día de corte</label>
            <input
              type="number"
              name="statementDay"
              min={1}
              max={31}
              required
              className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Día de pago</label>
            <input
              type="number"
              name="paymentDay"
              min={1}
              max={31}
              required
              className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
            />
          </div>
        </div>
      ) : null}
      <button type="submit" className="rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5">
        Agregar
      </button>
    </form>
  );
}
