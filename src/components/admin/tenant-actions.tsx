import { Button } from "@/components/ui/button";
import { setTenantStatusAction } from "@/modules/admin/actions";
import { availableActions, type TenantAction, type TenantStatusName } from "@/modules/admin/transitions";

const LABEL: Record<TenantAction, string> = {
  approve: "Approve",
  reject: "Reject",
  suspend: "Suspend",
  reactivate: "Reactivate",
};

const VARIANT: Record<TenantAction, "primary" | "secondary" | "danger"> = {
  approve: "primary",
  reject: "danger",
  suspend: "danger",
  reactivate: "secondary",
};

/** The buttons that make sense for an account in this state. Rejecting and suspending ask for an optional reason. */
export function TenantActions({ tenantId, status }: { tenantId: string; status: TenantStatusName }) {
  const actions = availableActions(status);
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <form key={action} action={setTenantStatusAction} className="flex items-center gap-2">
          <input type="hidden" name="tenantId" value={tenantId} />
          <input type="hidden" name="action" value={action} />
          {(action === "reject" || action === "suspend") && (
            <input
              name="reason"
              maxLength={500}
              placeholder="Reason (optional)"
              aria-label="Reason"
              className="h-10 w-44 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none placeholder:text-white/35 focus:border-brand"
            />
          )}
          <Button type="submit" size="sm" variant={VARIANT[action]}>
            {LABEL[action]}
          </Button>
        </form>
      ))}
    </div>
  );
}
