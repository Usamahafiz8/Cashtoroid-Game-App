import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME!,
  api_key: API_KEY!,
  api_secret: API_SECRET!,
});

export { cloudinary };

/** Thrown when Cloudinary env vars are missing or still hold placeholder values. */
export class CloudinaryConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudinaryConfigError";
  }
}

/**
 * Fail fast on unset/placeholder credentials — otherwise Cloudinary answers
 * with an opaque 401 ("cloud_name is disabled") that surfaces as a bare 500.
 */
function assertConfigured(): void {
  const missing = (
    [
      ["CLOUDINARY_CLOUD_NAME", CLOUD_NAME],
      ["CLOUDINARY_API_KEY", API_KEY],
      ["CLOUDINARY_API_SECRET", API_SECRET],
    ] as const
  )
    .filter(([, value]) => !value?.trim() || /^["']?your[-_]/i.test(value.trim()))
    .map(([name]) => name);

  if (missing.length) {
    throw new CloudinaryConfigError(
      `Cloudinary is not configured. Set real values for: ${missing.join(", ")}.`
    );
  }
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<{ url: string; publicId: string }> {
  assertConfigured();

  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder,
      resource_type: "image" as const,
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    };
    if (publicId) options.public_id = publicId;

    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        // Cloudinary rejects with a plain object, which logs as "{}" — wrap it
        // so the HTTP status and message actually reach the server logs.
        if (error || !result) {
          const detail = error
            ? `Cloudinary upload failed (${error.http_code ?? "no status"}): ${error.message}`
            : "Cloudinary upload failed: empty response";
          return reject(new Error(detail));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(buffer);
  });
}
