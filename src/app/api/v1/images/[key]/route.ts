import { fail } from "@/lib/api/respond";
import { AppError } from "@/server/errors";
import { getStorage } from "@/server/storage";
import { readImage } from "@/server/services/images";

/** Public: images used in blog posts. Keys never change content, so browsers and the CDN may cache forever. */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  try {
    const { bytes, mime } = await readImage(getStorage(), (await ctx.params).key);
    return new Response(new Blob([bytes as BlobPart]), {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    if (e instanceof AppError) return fail(e.status, e.code, e.message);
    console.error(e);
    return fail(500, "internal", "Something went wrong.");
  }
}
