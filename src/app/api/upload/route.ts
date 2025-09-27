import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    // Accept common field names
    let file = form.get("file");
    if (!file) file = form.get("image");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided", code: "NO_FILE" }, { status: 400 });
    }

    // Basic validations
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/svg+xml",
    ];
    // @ts-expect-error - File type from web File
    const type: string | undefined = file.type;
    if (!type) {
      return NextResponse.json({ error: "Unknown file type", code: "UNKNOWN_TYPE" }, { status: 400 });
    }

    // @ts-expect-error - File size from web File
    const size: number | undefined = file.size;
    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    if (typeof size === "number" && size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 5MB)", code: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    }

    if (!allowed.includes(type)) {
      // Helpful message for common unsupported types like HEIC/HEIF
      const heicLike = type.includes("heic") || type.includes("heif");
      return NextResponse.json(
        {
          error: heicLike
            ? "HEIC/HEIF images aren't supported by browsers. Please upload a JPG/PNG/WebP."
            : `Unsupported file type: ${type}`,
          code: "UNSUPPORTED_TYPE",
        },
        { status: 400 }
      );
    }

    // @ts-expect-error - File arrayBuffer from web File
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return a data URL to avoid filesystem issues on serverless platforms
    const dataUrl = `data:${type};base64,${buffer.toString("base64")}`;
    return NextResponse.json({ url: dataUrl });

    // If you still want to persist to disk in non-serverless environments, uncomment below:
    // const uploadsDir = path.join(process.cwd(), "public", "uploads");
    // await fs.mkdir(uploadsDir, { recursive: true });
    // const ext = (type.split("/")[1] || "jpg").replace("svg+xml", "svg");
    // const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    // const filepath = path.join(uploadsDir, filename);
    // await fs.writeFile(filepath, buffer);
    // const url = `/uploads/${filename}`;
    // return NextResponse.json({ url });
  } catch (err) {
    console.error("UPLOAD ERROR", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}