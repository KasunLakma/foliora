export const TENANT_ACTIONS = ["approve", "reject", "suspend", "reactivate"] as const;
export type TenantAction = (typeof TENANT_ACTIONS)[number];
export type TenantStatusName = "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED";

/**
 * What an admin may do to an account, depending on its state.
 * Returns the new status, or null when the action does not make sense (for example approving an active account).
 */
export function applyAction(current: TenantStatusName, action: TenantAction): TenantStatusName | null {
  switch (action) {
    case "approve":
      return current === "PENDING" ? "ACTIVE" : null;
    case "reject":
      return current === "PENDING" ? "CLOSED" : null;
    case "suspend":
      return current === "ACTIVE" ? "SUSPENDED" : null;
    case "reactivate":
      return current === "SUSPENDED" || current === "CLOSED" ? "ACTIVE" : null;
  }
}

/** The buttons to show for an account in this state. */
export function availableActions(current: TenantStatusName): TenantAction[] {
  return TENANT_ACTIONS.filter((action) => applyAction(current, action) !== null);
}
