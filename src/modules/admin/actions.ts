"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/auth";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { notifyTenantOwners } from "./notify";
import { setTenantStatus } from "./service";
import { TENANT_ACTIONS, type TenantAction } from "./transitions";

/** One button press on an account: approve, reject, suspend or reactivate. */
export async function setTenantStatusAction(fd: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  const tenantId = (fd.get("tenantId") ?? "").toString();
  const action = (fd.get("action") ?? "").toString();
  const reason = (fd.get("reason") ?? "").toString();
  if (!tenantId || !(TENANT_ACTIONS as readonly string[]).includes(action)) return;

  try {
    await setTenantStatus(userId, tenantId, action as TenantAction, reason);
  } catch (error) {
    // The page shows the real state again, so a refused or out-of-date press simply changes nothing.
    if (error instanceof ForbiddenError || error instanceof NotFoundError || error instanceof ValidationError) return;
    throw error;
  }

  after(() => notifyTenantOwners(tenantId, action as TenantAction, reason));
  revalidatePath("/admin", "layout");
}
