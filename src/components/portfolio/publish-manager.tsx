"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { saveSiteSettingsAction, setPublishedAction } from "@/modules/portfolio/actions";
import { SLUG_MAX, SLUG_MIN } from "@/modules/portfolio/slug";

const textareaClass =
  "min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground " +
  "placeholder:text-white/35 outline-none transition focus:border-brand focus:bg-white/8 focus:ring-4 focus:ring-brand/20";

export type PublishView = {
  slug: string; // the saved address, or a suggestion when none is saved yet
  hasSavedSlug: boolean;
  templateKey: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  host: string;
  hasPhoto: boolean;
  hasBio: boolean;
  approved: boolean;
};

function Check({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        className={cn(
          "grid size-6 place-items-center rounded-full",
          done ? "bg-success/20 text-success" : "bg-white/8 text-white/30",
        )}
      >
        {done && <Icon name="check" size={14} />}
      </span>
      <span className={done ? "text-white/80" : "text-white/55"}>{label}</span>
    </li>
  );
}

export function PublishManager({
  view,
  canDesign,
  canPublish,
}: {
  view: PublishView;
  canDesign: boolean;
  canPublish: boolean;
}) {
  const { t } = useI18n();
  const p = t.publish;
  const [saveState, saveAction, saving] = useActionState(saveSiteSettingsAction, undefined);
  const [publishState, publishAction, publishing] = useActionState(setPublishedAction, undefined);

  const pageUrl = view.hasSavedSlug ? `/${view.slug}` : null;
  const done = publishState?.done;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">
            {view.published ? p.statusPublished : p.statusDraft}
          </h2>
          <Badge tone={view.published ? "success" : "neutral"}>
            {view.published ? p.statusPublished : p.statusDraft}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{view.published ? p.publishedHint : p.draftHint}</p>

        {pageUrl && (
          <a
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block truncate text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            {view.host}
            {pageUrl} · {view.published ? p.open : p.preview}
          </a>
        )}

        {!view.published && (
          <div className="mt-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white/70">{p.checklist}</h3>
            <ul className="flex flex-col gap-2.5">
              <Check done={view.hasSavedSlug} label={p.checkAddress} />
              <Check done={view.hasPhoto} label={p.checkPhoto} />
              <Check done={view.hasBio} label={p.checkBio} />
            </ul>
          </div>
        )}

        {!view.approved && (
          <p className="mt-4 rounded-2xl bg-warning/12 px-4 py-3 text-sm font-medium text-warning">
            {p.needsApproval}
          </p>
        )}

        {canPublish && (
          <form action={publishAction} className="mt-5 flex flex-col gap-3">
            <input type="hidden" name="publish" value={view.published ? "false" : "true"} />
            {publishState?.error && (
              <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
                {publishState.error}
              </p>
            )}
            {done && (
              <p className="text-sm font-medium text-success">
                {done === "published" ? p.published : p.unpublished}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              loading={publishing}
              variant={view.published ? "secondary" : "primary"}
            >
              {view.published ? p.unpublish : p.publish}
            </Button>
          </form>
        )}
      </Card>

      <Card>
        <form action={saveAction} className="flex flex-col gap-4">
          <fieldset disabled={!canDesign} className="flex flex-col gap-4">
            <Field label={p.address} hint={format(p.addressHint, { min: SLUG_MIN, max: SLUG_MAX })}>
              <div className="flex items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/20">
                <span className="pl-4 text-sm text-white/45">{view.host}/</span>
                <input
                  name="slug"
                  required
                  defaultValue={view.slug}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={SLUG_MAX}
                  className="h-13 min-w-0 flex-1 bg-transparent px-1 text-base text-foreground outline-none"
                />
              </div>
            </Field>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold text-white/85">{p.template}</legend>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="templateKey"
                  value="cinematic"
                  defaultChecked
                  className="peer sr-only"
                />
                <span className="flex flex-col gap-0.5 rounded-2xl border border-white/10 bg-white/5 p-4 transition peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:ring-4 peer-checked:ring-brand/15">
                  <span className="font-semibold">{p.templateCinematic}</span>
                  <span className="text-xs text-muted-foreground">{p.templateCinematicText}</span>
                </span>
              </label>
              <p className="text-xs text-muted-foreground">{p.moreTemplates}</p>
            </fieldset>

            <Field label={p.seoTitle} hint={p.seoTitleHint}>
              <Input name="seoTitle" maxLength={70} defaultValue={view.seoTitle} />
            </Field>
            <Field label={p.seoDescription} hint={p.seoDescriptionHint}>
              <textarea
                name="seoDescription"
                maxLength={160}
                defaultValue={view.seoDescription}
                className={textareaClass}
              />
            </Field>
          </fieldset>

          {saveState?.error && (
            <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
              {saveState.error}
            </p>
          )}
          {saveState?.saved && <p className="text-sm font-medium text-success">{p.saved}</p>}

          {canDesign && (
            <Button type="submit" loading={saving}>
              {p.save}
            </Button>
          )}
        </form>
      </Card>
    </div>
  );
}
