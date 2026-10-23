export const MAX_PHOTOS = 30; // plan limits (Free 15, Pro 200) arrive with the billing phase
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB, the Cloudinary free plan limit
export const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "avif", "heic"] as const;

/** Every tenant uploads into its own folder. */
export function photoFolder(tenantId: string) {
  return `foliora/${tenantId}/photos`;
}

/** True only for an image that sits inside THIS tenant's folder. */
export function isOwnPublicId(tenantId: string, publicId: string) {
  return (
    publicId.length < 200 &&
    publicId.startsWith(`${photoFolder(tenantId)}/`) &&
    !publicId.includes("..") &&
    !/\s/.test(publicId)
  );
}
