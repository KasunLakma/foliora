import { createHash } from "node:crypto";

export type SignableValue = string | number | boolean | undefined;

/**
 * Cloudinary signature: sort the parameters by name, join them as name=value with &,
 * add the API secret at the end and take the SHA-1.
 */
export function signParams(params: Record<string, SignableValue>, secret: string) {
  const text = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(text + secret)
    .digest("hex");
}

export type ImageOptions = { width?: number; height?: number; fit?: "limit" | "fill" };

/** f_auto and q_auto let Cloudinary send the lightest format (WebP/AVIF) that the visitor's browser supports. */
export function buildImageUrl(cloudName: string, publicId: string, options: ImageOptions = {}) {
  const steps = ["f_auto", "q_auto"];
  steps.push(options.fit === "fill" ? "c_fill" : "c_limit");
  if (options.fit === "fill") steps.push("g_auto");
  if (options.width) steps.push(`w_${options.width}`);
  if (options.height) steps.push(`h_${options.height}`);
  return `https://res.cloudinary.com/${cloudName}/image/upload/${steps.join(",")}/${publicId}`;
}

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function imageUrl(publicId: string, options: ImageOptions = {}) {
  const config = cloudinaryConfig();
  return config ? buildImageUrl(config.cloudName, publicId, options) : "";
}

/** Everything the browser needs to upload ONE image straight to Cloudinary. */
export function createUploadSignature(folder: string, allowedFormats: string) {
  const config = cloudinaryConfig();
  if (!config) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams(
    { allowed_formats: allowedFormats, folder, timestamp },
    config.apiSecret,
  );
  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    timestamp,
    signature,
    folder,
    allowedFormats,
  };
}

/** Removes an image from Cloudinary. Returns false if it could not be removed (the caller decides what to do). */
export async function destroyImage(publicId: string): Promise<boolean> {
  const config = cloudinaryConfig();
  if (!config) return false;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ invalidate: "true", public_id: publicId, timestamp }, config.apiSecret);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
      method: "POST",
      body: new URLSearchParams({
        public_id: publicId,
        timestamp: String(timestamp),
        invalidate: "true",
        api_key: config.apiKey,
        signature,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
