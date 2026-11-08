import { describe, expect, it } from "vitest";
import { applyAction, availableActions, TENANT_ACTIONS, type TenantStatusName } from "../../src/modules/admin/transitions";

describe("what an admin may do to an account", () => {
  it("approves and rejects only accounts that are waiting", () => {
    expect(applyAction("PENDING", "approve")).toBe("ACTIVE");
    expect(applyAction("PENDING", "reject")).toBe("CLOSED");
    for (const status of ["ACTIVE", "SUSPENDED", "CLOSED"] as TenantStatusName[]) {
      expect(applyAction(status, "approve")).toBeNull();
      expect(applyAction(status, "reject")).toBeNull();
    }
  });

  it("suspends only active accounts", () => {
    expect(applyAction("ACTIVE", "suspend")).toBe("SUSPENDED");
    for (const status of ["PENDING", "SUSPENDED", "CLOSED"] as TenantStatusName[]) {
      expect(applyAction(status, "suspend")).toBeNull();
    }
  });

  it("reactivates suspended or closed accounts", () => {
    expect(applyAction("SUSPENDED", "reactivate")).toBe("ACTIVE");
    expect(applyAction("CLOSED", "reactivate")).toBe("ACTIVE");
    expect(applyAction("ACTIVE", "reactivate")).toBeNull();
    expect(applyAction("PENDING", "reactivate")).toBeNull();
  });

  it("offers the right buttons for each state", () => {
    expect(availableActions("PENDING")).toEqual(["approve", "reject"]);
    expect(availableActions("ACTIVE")).toEqual(["suspend"]);
    expect(availableActions("SUSPENDED")).toEqual(["reactivate"]);
    expect(availableActions("CLOSED")).toEqual(["reactivate"]);
  });

  it("every action leads somewhere from at least one state", () => {
    const states: TenantStatusName[] = ["PENDING", "ACTIVE", "SUSPENDED", "CLOSED"];
    for (const action of TENANT_ACTIONS) {
      expect(states.some((state) => applyAction(state, action) !== null)).toBe(true);
    }
  });
});
