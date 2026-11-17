import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { STATUS_TONE } from "@/components/inbox/status-tone";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { addInquiryNoteAction, setInquiryStatusAction } from "@/modules/inquiries/actions";
import { getInquiry, markRead } from "@/modules/inquiries/service";
import { hasPermission } from "@/modules/roles/permissions";

export const metadata = { title: "Inbox" };

const textareaClass =
  "min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground " +
  "placeholder:text-white/35 outline-none transition focus:border-brand focus:bg-white/8 focus:ring-4 focus:ring-brand/20";

function StatusButton({ id, status, label, variant }: { id: string; status: string; label: string; variant?: "secondary" | "danger" }) {
  return (
    <form action={setInquiryStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="sm" variant={variant ?? "secondary"}>
        {label}
      </Button>
    </form>
  );
}

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getDictionary();
  const session = await auth();
  const user = session!.user;
  const tenantId = user.activeTenantId;
  if (!tenantId) notFound();

  const [canView, canReply] = await Promise.all([
    hasPermission(user.id, tenantId, "inquiries.view"),
    hasPermission(user.id, tenantId, "inquiries.reply"),
  ]);
  if (!canView) {
    return (
      <Card>
        <p className="text-muted-foreground">{t.inbox.noAccess}</p>
      </Card>
    );
  }

  const inquiry = await getInquiry(tenantId, id);
  if (!inquiry) notFound();

  // Opening a new message marks it as read.
  if (inquiry.status === "NEW") await markRead(tenantId, id);
  const status = inquiry.status === "NEW" ? "READ" : inquiry.status;

  const dateFormat = new Intl.DateTimeFormat(locale === "si" ? "si-LK" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const i = t.inbox;
  const mailto = `mailto:${inquiry.senderEmail}?subject=${encodeURIComponent(i.replySubject)}`;

  const details = [
    { label: i.email, value: inquiry.senderEmail },
    inquiry.senderPhone && { label: i.phone, value: inquiry.senderPhone },
    inquiry.company && { label: i.company, value: inquiry.company },
    inquiry.projectName && { label: i.project, value: inquiry.projectName },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/portal/inbox" className="w-fit px-1 text-sm font-semibold text-brand underline-offset-4 hover:underline">
        ← {i.back}
      </Link>

      <Card className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-semibold tracking-[0.08em] uppercase">
              {inquiry.senderName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.inquiryTypes[inquiry.type]} · {format(i.received, { date: dateFormat.format(inquiry.createdAt) })}
            </p>
          </div>
          <Badge tone={STATUS_TONE[status] ?? "neutral"}>{i.status[status as keyof typeof i.status]}</Badge>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          {details.map((d) => (
            <div key={d.label}>
              <dt className="text-xs font-medium tracking-wider text-white/45 uppercase">{d.label}</dt>
              <dd className="mt-1 font-semibold break-words">{d.value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <h2 className="text-xs font-medium tracking-wider text-white/45 uppercase">{i.message}</h2>
          <p className="mt-2 text-lg leading-relaxed whitespace-pre-line text-white/85">{inquiry.message}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a href={mailto} className={buttonStyles({ size: "md" })}>
            {i.replyByEmail}
          </a>
          {inquiry.senderPhone && (
            <a href={`tel:${inquiry.senderPhone}`} className={buttonStyles({ size: "md", variant: "secondary" })}>
              {i.call}
            </a>
          )}
        </div>

        {canReply && (
          <div className="flex flex-wrap gap-2 border-t border-white/8 pt-5">
            {status === "ARCHIVED" || status === "SPAM" ? (
              <StatusButton id={inquiry.id} status="READ" label={i.restore} />
            ) : (
              <>
                {status !== "REPLIED" && <StatusButton id={inquiry.id} status="REPLIED" label={i.markReplied} />}
                <StatusButton id={inquiry.id} status="ARCHIVED" label={i.archive} />
                <StatusButton id={inquiry.id} status="SPAM" label={i.markSpam} variant="danger" />
              </>
            )}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{i.notes}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{i.notesHint}</p>
        </div>

        {inquiry.notes.length === 0 ? (
          <p className="text-sm text-white/55">{i.noNotes}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {inquiry.notes.map((note) => (
              <li key={note.id} className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm whitespace-pre-line text-white/85">{note.body}</p>
                <p className="mt-2 text-xs text-white/40">{dateFormat.format(note.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}

        {canReply && (
          <form action={addInquiryNoteAction} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={inquiry.id} />
            <textarea name="body" required maxLength={2000} placeholder={i.notePlaceholder} className={textareaClass} />
            <Button type="submit" variant="secondary">
              {i.addNote}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
