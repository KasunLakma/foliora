"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import {
  deletePhotoAction,
  movePhotoAction,
  saveCaptionAction,
  setCoverPhotoAction,
} from "@/modules/photos/actions";

export type PhotoView = {
  id: string;
  url: string;
  caption: string;
  isCover: boolean;
};

const roundButton =
  "grid size-10 place-items-center rounded-full bg-black/55 text-lg text-white backdrop-blur transition hover:bg-black/75 active:scale-95 disabled:pointer-events-none disabled:opacity-30";

export function PhotoGrid({ photos, canEdit }: { photos: PhotoView[]; canEdit: boolean }) {
  const { t } = useI18n();
  const p = t.photos;

  if (photos.length === 0) {
    return (
      <Card>
        <p className="text-muted-foreground">{p.empty}</p>
      </Card>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <li key={photo.id} className="glass-card flex flex-col overflow-hidden rounded-[1.5rem]">
          <div className="relative aspect-[4/5] bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={photo.caption} loading="lazy" className="size-full object-cover" />
            {photo.isCover && (
              <span className="absolute top-3 left-3">
                <Badge tone="warning">{p.mainPhoto}</Badge>
              </span>
            )}
            {canEdit && (
              <div className="absolute inset-x-2 bottom-2 flex justify-between">
                <div className="flex gap-1.5">
                  <form action={movePhotoAction}>
                    <input type="hidden" name="id" value={photo.id} />
                    <input type="hidden" name="direction" value="earlier" />
                    <button className={roundButton} disabled={index === 0} aria-label={p.moveEarlier} title={p.moveEarlier}>
                      ←
                    </button>
                  </form>
                  <form action={movePhotoAction}>
                    <input type="hidden" name="id" value={photo.id} />
                    <input type="hidden" name="direction" value="later" />
                    <button
                      className={roundButton}
                      disabled={index === photos.length - 1}
                      aria-label={p.moveLater}
                      title={p.moveLater}
                    >
                      →
                    </button>
                  </form>
                </div>
                <div className="flex gap-1.5">
                  {!photo.isCover && (
                    <form action={setCoverPhotoAction}>
                      <input type="hidden" name="id" value={photo.id} />
                      <button className={roundButton} aria-label={p.makeMain} title={p.makeMain}>
                        ★
                      </button>
                    </form>
                  )}
                  <form action={deletePhotoAction}>
                    <input type="hidden" name="id" value={photo.id} />
                    <button
                      className={roundButton}
                      aria-label={p.remove}
                      title={p.remove}
                      onClick={(event) => {
                        if (!window.confirm(p.confirmRemove)) event.preventDefault();
                      }}
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
          {canEdit ? (
            <form action={saveCaptionAction} className="p-2">
              <input type="hidden" name="id" value={photo.id} />
              <input
                name="caption"
                defaultValue={photo.caption}
                maxLength={140}
                placeholder={p.captionPlaceholder}
                aria-label={p.caption}
                onBlur={(event) => {
                  // save when the field loses focus, but only if the text changed
                  if (event.currentTarget.value !== photo.caption) event.currentTarget.form?.requestSubmit();
                }}
                className="h-10 w-full rounded-xl bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-white/35 focus:bg-white/5"
              />
            </form>
          ) : (
            photo.caption && <p className="p-3 text-sm text-white/70">{photo.caption}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
