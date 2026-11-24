import Link from "next/link";
import { CallForm } from "@/components/admin/call-form";
import { Card } from "@/components/ui/card";
import { adminContext } from "@/modules/admin/guard";

export const metadata = { title: "New casting call" };

export default async function NewCastingCallPage() {
  const { canManage } = await adminContext();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/casting" className="w-fit px-1 text-sm font-semibold text-brand underline-offset-4 hover:underline">
        ← Casting calls
      </Link>
      <Card className="flex flex-col gap-4">
        <h1 className="font-display text-xl font-semibold tracking-[0.1em] uppercase">New casting call</h1>
        {canManage ? (
          <>
            <p className="text-sm text-white/55">It is saved as a draft. Talents see it only after you open it.</p>
            <CallForm />
          </>
        ) : (
          <p className="text-muted-foreground">Only admins can create casting calls.</p>
        )}
      </Card>
    </div>
  );
}
