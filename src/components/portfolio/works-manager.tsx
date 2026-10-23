"use client";

import { useActionState, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { ROLE_TYPES, WORK_TYPES } from "@/modules/works/schema";
import { deleteWorkAction, saveWorkAction } from "@/modules/works/actions";

export type WorkView = {
  id: string;
  title: string;
  year: number;
  type: string;
  roleName: string;
  roleType: string;
  director: string;
  company: string;
  description: string;
  link: string;
  isFeatured: boolean;
};

const textareaClass =
  "min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground " +
  "placeholder:text-white/35 outline-none transition focus:border-brand focus:bg-white/8 focus:ring-4 focus:ring-brand/20";

function WorkForm({ work, onDone }: { work: WorkView | null; onDone: () => void }) {
  const { t } = useI18n();
  const w = t.works;
  const [state, action, pending] = useActionState(saveWorkAction, undefined);

  useEffect(() => {
    if (state?.saved) onDone();
  }, [state, onDone]);

  return (
    <Card>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={work?.id ?? ""} />
        <Field label={w.fields.title}>
          <Input name="title" required defaultValue={work?.title} placeholder={w.fields.titlePlaceholder} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={w.fields.year}>
            <Input
              name="year"
              required
              inputMode="numeric"
              defaultValue={work?.year ?? new Date().getFullYear()}
            />
          </Field>
          <Field label={w.fields.type}>
            <Select name="type" defaultValue={work?.type ?? "FILM"}>
              {WORK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t.workTypes[type]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={w.fields.roleName}>
            <Input name="roleName" defaultValue={work?.roleName} placeholder={w.fields.roleNamePlaceholder} />
          </Field>
          <Field label={w.fields.roleType}>
            <Select name="roleType" defaultValue={work?.roleType ?? ""}>
              <option value="">{w.fields.roleTypeNone}</option>
              {ROLE_TYPES.map((role) => (
                <option key={role} value={role}>
                  {t.roleTypes[role]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={w.fields.director}>
            <Input name="director" defaultValue={work?.director} />
          </Field>
          <Field label={w.fields.company}>
            <Input name="company" defaultValue={work?.company} />
          </Field>
        </div>
        <Field label={w.fields.description}>
          <textarea name="description" defaultValue={work?.description} className={textareaClass} />
        </Field>
        <Field label={w.fields.link} hint={w.fields.linkHint}>
          <Input name="link" inputMode="url" defaultValue={work?.link} placeholder="https://" />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={work?.isFeatured}
            className="size-5 accent-[var(--brand)]"
          />
          {w.fields.featured}
        </label>

        {state?.error && (
          <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={pending} className="flex-1">
            {w.save}
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            {w.cancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function WorksManager({ works, canEdit }: { works: WorkView[]; canEdit: boolean }) {
  const { t } = useI18n();
  const w = t.works;
  // null = closed, "new" = adding, otherwise the id of the work being edited
  const [editing, setEditing] = useState<string | null>(null);
  const close = () => setEditing(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted-foreground">{w.intro}</p>
        {canEdit && editing === null && (
          <Button size="sm" onClick={() => setEditing("new")}>
            {w.add}
          </Button>
        )}
      </div>

      {editing === "new" && <WorkForm work={null} onDone={close} />}

      {works.length === 0 && editing !== "new" && (
        <Card>
          <p className="text-muted-foreground">{w.empty}</p>
        </Card>
      )}

      <ul className="flex flex-col gap-3">
        {works.map((work) =>
          editing === work.id ? (
            <li key={work.id}>
              <WorkForm work={work} onDone={close} />
            </li>
          ) : (
            <li key={work.id} className="glass-card flex flex-col gap-3 rounded-[1.75rem] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{work.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[
                      work.roleName ? format(w.roleAs, { role: work.roleName }) : null,
                      work.director ? format(w.directedBy, { name: work.director }) : null,
                      work.company || null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="font-display text-xl font-semibold text-brand">{work.year}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="brand">{t.workTypes[work.type as keyof typeof t.workTypes] ?? work.type}</Badge>
                {work.roleType && (
                  <Badge>{t.roleTypes[work.roleType as keyof typeof t.roleTypes] ?? work.roleType}</Badge>
                )}
                {work.isFeatured && <Badge tone="warning">{w.featured}</Badge>}
              </div>
              {work.description && <p className="text-sm text-white/70">{work.description}</p>}
              {work.link && (
                <a
                  href={work.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit text-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                  {work.link.replace(/^https?:\/\//, "")}
                </a>
              )}
              {canEdit && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(work.id)}>
                    {w.edit}
                  </Button>
                  <form action={deleteWorkAction}>
                    <input type="hidden" name="id" value={work.id} />
                    <Button
                      size="sm"
                      variant="danger"
                      type="submit"
                      onClick={(event) => {
                        if (!window.confirm(w.confirmDelete)) event.preventDefault();
                      }}
                    >
                      {w.delete}
                    </Button>
                  </form>
                </div>
              )}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
