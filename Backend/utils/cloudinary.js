import crypto from "node:crypto";

export function cloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = process.env;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function signCloudinaryParams(params, apiSecret) {
  const query = Object.entries(params).filter(([, value]) => value !== undefined && value !== "").sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&");
  return crypto.createHash("sha1").update(`${query}${apiSecret}`).digest("hex");
}

export function validCloudinaryAsset(url, publicId, folder) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com" && typeof publicId === "string" && publicId.startsWith(`${folder}/`);
  } catch { return false; }
}

export function authenticatedDownloadUrl({ cloudName, apiKey, apiSecret, publicId, format, resourceType = "raw" }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const expiresAt = timestamp + 300;
  const params = { timestamp, public_id: publicId, format, expires_at: expiresAt, attachment: true, type: "authenticated" };
  const query = new URLSearchParams({ timestamp: String(timestamp), public_id: publicId, format, expires_at: String(expiresAt), attachment: "true", type: "authenticated", api_key: apiKey, signature: signCloudinaryParams(params, apiSecret) });
  return `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/download?${query}`;
}
