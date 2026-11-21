"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/auth";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { approvePayment, rejectPayment } from "./admin";
import { notifyPaymentDecision } from "./notify";

const IGNORED = (error: unknown) =>
  error instanceof ForbiddenError || error instanceof NotFoundError || error instanceof ValidationError;

/** The admin saw the money in the bank account. */
export async function approvePaymentAction(fd: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  const id = (fd.get("id") ?? "").toString();
  if (!userId || !id) return;

  let result: Awaited<ReturnType<typeof approvePayment>>;
  try {
    result = await approvePayment(userId, id);
  } catch (error) {
    // The list shows the real state again, so a refused or out-of-date press simply changes nothing.
    if (IGNORED(error)) return;
    throw error;
  }

  after(() => notifyPaymentDecision(result.tenantId, { kind: "approved", planName: result.planName, endsAt: result.endsAt }));
  revalidatePath("/admin", "layout");
}

export async function rejectPaymentAction(fd: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  const id = (fd.get("id") ?? "").toString();
  if (!userId || !id) return;

  let result: Awaited<ReturnType<typeof rejectPayment>>;
  try {
    result = await rejectPayment(userId, id, (fd.get("reason") ?? "").toString());
  } catch (error) {
    if (IGNORED(error)) return;
    throw error;
  }

  after(() =>
    notifyPaymentDecision(result.tenantId, {
      kind: "rejected",
      planName: result.planName,
      amount: result.amount,
      reason: result.reason,
    }),
  );
  revalidatePath("/admin", "layout");
}
