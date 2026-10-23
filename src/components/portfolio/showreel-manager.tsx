"use client";

import { useActionState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import {
  addShowreelAction,
  removeShowreelAction,
  setPrimaryShowreelAction,
} from "@/modules/showreel/actions";

export type ShowreelView = {
  id: string;
  title: string;
  provider: "YOUTUBE" | "VIMEO";
  isPrimary: boolean;
  watchUrl: string;
  thumbnail: string | null;
};

export function ShowreelManager({ videos, canEdit }: { videos: ShowreelView[]; canEdit: boolean }) {
  const { t } = useI18n();
  const s = t.showreel;
  const [state, action, pending] = useActionState(addShowreelAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a video was added.
  useEffect(() => {
    if (state?.saved) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <p className="px-1 text-sm text-muted-foreground">{s.intro}</p>

      {canEdit && (
        <Card>
          <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{s.add}</h2>
          <form ref={formRef} action={action} className="mt-4 flex flex-col gap-4">
            <Field label={s.titleLabel}>
              <Input name="title" required placeholder={s.titlePlaceholder} />
            </Field>
            <Field label={s.urlLabel} hint={s.urlHint}>
              <Input name="url" required inputMode="url" placeholder="https://youtu.be/..." />
            </Field>
            {state?.error && (
              <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
                {state.error}
              </p>
            )}
            {state?.saved && <p className="text-sm font-medium text-success">{s.added}</p>}
            <Button type="submit" loading={pending}>
              {pending ? s.submitting : s.submit}
            </Button>
          </form>
        </Card>
      )}

      {videos.length === 0 && (
        <Card>
          <p className="text-muted-foreground">{s.empty}</p>
        </Card>
      )}

      <ul className="flex flex-col gap-3">
        {videos.map((video) => (
          <li key={video.id} className="glass-card overflow-hidden rounded-[1.75rem]">
            <a href={video.watchUrl} target="_blank" rel="noopener noreferrer" aria-label={s.open}>
              {video.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnail} alt="" className="aspect-video w-full object-cover" loading="lazy" />
              ) : (
                <span className="bg-stage grid aspect-video w-full place-items-center text-4xl text-white/70">▶</span>
              )}
            </a>
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{video.title}</h3>
                <div className="flex shrink-0 gap-2">
                  <Badge>{video.provider === "YOUTUBE" ? "YouTube" : "Vimeo"}</Badge>
                  {video.isPrimary && <Badge tone="warning">{s.primary}</Badge>}
                </div>
              </div>
              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  {!video.isPrimary && (
                    <form action={setPrimaryShowreelAction}>
                      <input type="hidden" name="id" value={video.id} />
                      <Button size="sm" variant="secondary" type="submit">
                        {s.setPrimary}
                      </Button>
                    </form>
                  )}
                  <form action={removeShowreelAction}>
                    <input type="hidden" name="id" value={video.id} />
                    <Button
                      size="sm"
                      variant="danger"
                      type="submit"
                      onClick={(event) => {
                        if (!window.confirm(s.confirmRemove)) event.preventDefault();
                      }}
                    >
                      {s.remove}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
