import Link from "next/link";
import { notFound } from "next/navigation";
import { CallForm, type CallFormValues } from "@/components/admin/call-form";
import { formatDate, formatDateTime } from "@/components/admin/format";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminContext } from "@/modules/admin/guard";
import { getCallAdmin } from "@/modules/casting/admin";
import { setApplicationStatusAction, setCallStatusAction } from "@/modules/casting/admin-actions";
import { dateFromDeadline } from "@/modules/casting/rules";

export const metadata = { title: "Casting call" };

const CALL_TONE: Record<string, BadgeTone> = { DRAFT: "neutral", OPEN: "success", CLOSED: "warning" };
const APPLICATION_TONE: Record<string, BadgeTone> = {
  SUBMITTED: "brand",
  SHORTLISTED: "success",
  NOT_SELECTED: "neutral",
  WITHDRAWN: "neutral",
};
const APPLICATION_LABEL: Record<string, string> = {
  SUBMITTED: "Sent",
  SHORTLISTED: "Shortlisted",
  NOT_SELECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

/** One button that sends one value to one server action. */
function ActionButton({
  action,
  id,
  value,
  label,
  variant,
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  value: string;
  label: string;
  variant?: "secondary" | "danger";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={value} />
      <Button type="submit" size="sm" variant={variant ?? "secondary"}>
        {label}
      </Button>
    </form>
  );
}

export default async function AdminCastingCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, canManage } = await adminContext();
  const { id } = await params;
  const detail = await getCallAdmin(userId, id);
  if (!detail) notFound();
  const { call, applicants } = detail;

  const values: CallFormValues = {
    id: call.id,
    title: call.title,
    company: call.company ?? "",
    role: call.role ?? "",
    description: call.description,
    gender: call.gender,
    ageMin: call.ageMin === null ? "" : String(call.ageMin),
    ageMax: call.ageMax === null ? "" : String(call.ageMax),
    location: call.location ?? "",
    compensation: call.compensation ?? "",
    deadline: dateFromDeadline(call.deadline),
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/casting" className="w-fit px-1 text-sm font-semibold text-brand underline-offset-4 hover:underline">
        ← Casting calls
      </Link>

      <Card className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold tracking-[0.08em] uppercase">{call.title}</h1>
            <p className="mt-1 text-sm text-white/55">
              {call.company ?? "No production named"} · closes {formatDate(call.deadline)}
            </p>
          </div>
          <Badge tone={CALL_TONE[call.status] ?? "neutral"}>{call.status.toLowerCase()}</Badge>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {call.status === "DRAFT" && <ActionButton action={setCallStatusAction} id={call.id} value="OPEN" label="Open for applications" />}
            {call.status === "OPEN" && <ActionButton action={setCallStatusAction} id={call.id} value="CLOSED" label="Close" variant="danger" />}
            {call.status === "CLOSED" && <ActionButton action={setCallStatusAction} id={call.id} value="OPEN" label="Reopen" />}
          </div>
        )}
        {call.status === "DRAFT" && (
          <p className="text-sm text-white/50">A draft is invisible to talents. Opening needs a deadline that is still in the future.</p>
        )}

        {canManage && (
          <details className="rounded-2xl bg-white/5 p-4">
            <summary className="cursor-pointer font-semibold">Edit this call</summary>
            <div className="mt-4">
              <CallForm call={values} />
            </div>
          </details>
        )}
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 font-display text-lg font-semibold tracking-[0.1em] uppercase">
          Applicants ({applicants.length})
        </h2>
        {applicants.length === 0 ? (
          <Card>
            <p className="text-muted-foreground">Nobody has applied yet.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {applicants.map((applicant) => (
              <li key={applicant.id} className="glass-card flex flex-col gap-3 rounded-[1.75rem] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{applicant.stageName}</p>
                    <p className="truncate text-sm text-white/55">{applicant.email ?? "No email"}</p>
                  </div>
                  <Badge tone={APPLICATION_TONE[applicant.status] ?? "neutral"}>
                    {APPLICATION_LABEL[applicant.status] ?? applicant.status}
                  </Badge>
                </div>

                <p className="text-sm">
                  {applicant.slug ? (
                    <Link href={`/${applicant.slug}`} target="_blank" className="font-semibold text-brand underline-offset-4 hover:underline">
                      Open portfolio /{applicant.slug}
                    </Link>
                  ) : (
                    <span className="text-white/50">Portfolio is not published</span>
                  )}
                  <span className="text-white/40"> · applied {formatDateTime(applicant.createdAt)}</span>
                </p>

                {applicant.message && <p className="text-sm whitespace-pre-line text-white/75">{applicant.message}</p>}

                {canManage && applicant.status !== "WITHDRAWN" && (
                  <div className="flex flex-wrap gap-2 border-t border-white/8 pt-3">
                    {applicant.status !== "SHORTLISTED" && (
                      <ActionButton action={setApplicationStatusAction} id={applicant.id} value="SHORTLISTED" label="Shortlist" />
                    )}
                    {applicant.status !== "NOT_SELECTED" && (
                      <ActionButton action={setApplicationStatusAction} id={applicant.id} value="NOT_SELECTED" label="Not selected" variant="danger" />
                    )}
                    {applicant.status !== "SUBMITTED" && (
                      <ActionButton action={setApplicationStatusAction} id={applicant.id} value="SUBMITTED" label="Back to sent" />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
