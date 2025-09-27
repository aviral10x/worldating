import { NextRequest } from "next/server";

// Minimal status endpoint placeholder
// In a real implementation, this would check DB/chain for stake status by reference.
// For now, it echoes back a dummy status so the client flow can be wired.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { ref } = body || {};
    if (!ref) return Response.json({ error: "ref is required" }, { status: 400 });

    // Placeholder: always return pending
    return Response.json({ ref, status: "pending", checkedAt: Date.now() }, { status: 200 });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to get status" }, { status: 500 });
  }
}