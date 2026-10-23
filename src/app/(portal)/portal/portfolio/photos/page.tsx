import { auth } from "@/auth";
import { PhotoGrid, type PhotoView } from "@/components/portfolio/photo-grid";
import { PhotoUploader } from "@/components/portfolio/photo-uploader";
import { PortfolioTabs } from "@/components/portfolio/portfolio-tabs";
import { Card } from "@/components/ui/card";
import { cloudinaryConfig, imageUrl } from "@/lib/cloudinary";
import { getDictionary } from "@/lib/i18n/server";
import { MAX_PHOTOS } from "@/modules/photos/paths";
import { listPhotos } from "@/modules/photos/service";
import { ensureProfile } from "@/modules/profiles/service";
import { hasPermission } from "@/modules/roles/permissions";

export const metadata = { title: "Photos" };

export default async function PhotosPage() {
  const { t } = await getDictionary();
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

  const profile = await ensureProfile(tenantId);
  if (!profile) {
    return (
      <Card>
        <h1 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{t.profile.agencyTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.profile.agencyText}</p>
      </Card>
    );
  }

  const [photos, canEdit] = await Promise.all([
    listPhotos(tenantId),
    hasPermission(user.id, tenantId, "media.upload"),
  ]);
  const configured = cloudinaryConfig() !== null;

  const views: PhotoView[] = photos.map((photo) => ({
    id: photo.id,
    url: imageUrl(photo.publicId, { width: 600, height: 750, fit: "fill" }),
    caption: photo.caption ?? "",
    isCover: photo.isCover,
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 font-display text-2xl font-semibold tracking-[0.1em] uppercase">{t.portfolio.title}</h1>
      <PortfolioTabs />
      <p className="px-1 text-sm text-muted-foreground">{t.photos.intro}</p>

      {!configured ? (
        <Card>
          <p className="text-warning">{t.photos.notConfigured}</p>
        </Card>
      ) : (
        canEdit && <PhotoUploader remaining={MAX_PHOTOS - photos.length} />
      )}

      <PhotoGrid photos={views} canEdit={canEdit && configured} />
    </div>
  );
}
