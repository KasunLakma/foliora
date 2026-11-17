import Link from "next/link";
import { auth } from "@/auth";
import { STATUS_TONE } from "@/components/inbox/status-tone";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { getDictionary } from "@/lib/i18n/server";
import { INBOX_FILTERS, listInquiries, type InboxFilter } from "@/modules/inquiries/service";
import { hasPermission } from "@/modules/roles/permissions";

export const metadata = { title: "Inbox" };

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { t, locale } = await getDictionary();
  const session = await auth();
  const user = session!.user;
  const tenantId = user.activeTenantId;

  if (!tenantId) {
    return (
      <Card>
        <p className="text-muted-foreground">{t.profile.noAccount}</p>
      </Card>
    );
  }
  if (!(await hasPermission(user.id, tenantId, "inquiries.view"))) {
    return (
      <Card>
        <p className="text-muted-foreground">{t.inbox.noAccess}</p>
      </Card>
    );
  }

  const { filter: requested } = await searchParams;
  const filter: InboxFilter = (INBOX_FILTERS as readonly string[]).includes(requested ?? "")
    ? (requested as InboxFilter)
    : "inbox";
  const items = await listInquiries(tenantId, filter);

  const dateFormat = new Intl.DateTimeFormat(locale === "si" ? "si-LK" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="px-1">
        <h1 className="font-display text-2xl font-semibold tracking-[0.1em] uppercase">{t.inbox.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.inbox.intro}</p>
      </div>

      <nav aria-label={t.inbox.title} className="flex gap-2 overflow-x-auto pb-1">
        {INBOX_FILTERS.map((key) => (
          <Link
            key={key}
            href={key === "inbox" ? "/portal/inbox" : `/portal/inbox?filter=${key}`}
            aria-current={key === filter ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              key === filter ? "bg-brand-gradient text-on-brand" : "glass-card text-white/70 hover:text-white",
            )}
          >
            {t.inbox.filters[key]}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <Card>
          <p className="font-semibold">{t.inbox.empty}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.inbox.emptyHint}</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/portal/inbox/${item.id}`}
                className="glass-card flex flex-col gap-2 rounded-[1.75rem] p-5 transition hover:bg-white/8"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {item.status === "NEW" && <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-brand" />}
                    <span className={cn("truncate", item.status === "NEW" ? "font-bold" : "font-semibold")}>
                      {item.senderName}
                    </span>
                  </div>
                  <Badge tone={STATUS_TONE[item.status] ?? "neutral"}>
                    {t.inbox.status[item.status as keyof typeof t.inbox.status]}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-white/70">{item.message}</p>
                <p className="text-xs text-white/40">
                  {t.inquiryTypes[item.type]} · {dateFormat.format(item.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
