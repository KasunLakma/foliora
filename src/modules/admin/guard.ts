import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ForbiddenError } from "@/lib/errors";
import { MANAGE_ROLES, VIEW_ROLES, requirePlatformUser } from "./service";

/**
 * Call this at the top of EVERY admin page. Layouts do not stop a page from loading its data,
 * so each page proves for itself that the visitor is active platform staff.
 * Anyone else gets a plain "not found": the admin area does not reveal that it exists.
 */
export async function adminContext() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    const staff = await requirePlatformUser(session.user.id, VIEW_ROLES);
    return {
      userId: session.user.id,
      role: staff.role,
      email: staff.email,
      canManage: MANAGE_ROLES.includes(staff.role),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }
}
