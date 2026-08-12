import { requireHousehold } from "@/lib/household";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { QuickAdd } from "@/components/quick-add/QuickAdd";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, householdId } = await requireHousehold();

  const [{ data: categories }, { data: household }, { data: paymentMethods }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, emoji, type")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("name"),
    supabase.from("households").select("name").eq("id", householdId).single(),
    supabase
      .from("payment_methods")
      .select("id, name, kind")
      .eq("household_id", householdId)
      .order("created_at"),
  ]);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar userEmail={user.email ?? ""} householdName={household?.name ?? "Hogar"} />
      <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-7 pb-24 md:pb-10 max-w-[1240px]">
        {children}
      </main>
      <QuickAdd categories={categories ?? []} paymentMethods={paymentMethods ?? []} />
      <BottomNav />
    </div>
  );
}
