"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  REVIEW_STATUSES,
  createCall,
  setApplicationStatus,
  setCallStatus,
  updateCall,
  type CallStatusName,
  type ReviewStatus,
} from "./admin";
import { callSchema } from "./schema";

export type CallFormState = { error?: string } | undefined;

const text = (fd: FormData, key: string) => (fd.get(key) ?? "").toString();

/** Creates a call, or saves changes to one when the form carries its id. */
export async function saveCallAction(_prev: CallFormState, fd: FormData): Promise<CallFormState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Please sign in again." };

  const parsed = callSchema.safeParse({
    title: text(fd, "title"),
    company: text(fd, "company"),
    role: text(fd, "role"),
    description: text(fd, "description"),
    gender: text(fd, "gender"),
    ageMin: text(fd, "ageMin"),
    ageMax: text(fd, "ageMax"),
    location: text(fd, "location"),
    compensation: text(fd, "compensation"),
    deadline: text(fd, "deadline"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const existingId = text(fd, "id");
  let id: string;
  try {
    if (existingId) {
      await updateCall(userId, existingId, parsed.data);
      id = existingId;
    } else {
      id = await createCall(userId, parsed.data);
    }
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: "You do not have permission to do this." };
    if (error instanceof NotFoundError) return { error: "This casting call no longer exists." };
    if (error instanceof ValidationError) return { error: "Check the form and try again." };
    throw error;
  }

  revalidatePath("/admin/casting", "layout");
  redirect(`/admin/casting/${id}`); // redirect() works by throwing, so it must stay outside the try block
}

export async function setCallStatusAction(fd: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  const id = text(fd, "id");
  const status = text(fd, "status");
  if (!userId || !id || !["OPEN", "CLOSED", "DRAFT"].includes(status)) return;

  try {
    await setCallStatus(userId, id, status as CallStatusName);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError || error instanceof ValidationError) return;
    throw error;
  }
  revalidatePath("/admin/casting", "layout");
}

export async function setApplicationStatusAction(fd: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  const id = text(fd, "id");
  const status = text(fd, "status");
  if (!userId || !id || !(REVIEW_STATUSES as string[]).includes(status)) return;

  try {
    await setApplicationStatus(userId, id, status as ReviewStatus);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError || error instanceof ValidationError) return;
    throw error;
  }
  revalidatePath("/admin/casting", "layout");
}
