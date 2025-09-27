import { NextResponse } from "next/server";
import { keccak_256 } from "js-sha3";
import { ESCROW_ADDRESS, WLD_ADDRESS, STAKE_AMOUNT, STAKE_TTL_SECONDS } from "@/lib/escrow";

// Minimal initiate endpoint
// POST /api/stakes/initiate
// Body: { from: string, to: string, ref?: string }
// Returns: { escrowAddress, tokenAddress, amount, ref, refHash, ttlSeconds, expiresAt }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { from, to } = body || {};
    let { ref } = body || {};

    if (!from || !to || typeof from !== "string" || typeof to !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'from' or 'to'" },
        { status: 400 }
      );
    }

    // Generate a unique ref if not provided
    if (!ref || typeof ref !== "string") {
      ref = `worlddate:${from}:${to}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    }

    // Compute keccak256 hash of the reference (hex string with 0x prefix)
    const refHash = "0x" + keccak_256(ref);

    const ttlSeconds = Number(STAKE_TTL_SECONDS || 0);
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 0);

    // Respond with the pay instructions that the client can show to the user
    return NextResponse.json({
      ok: true,
      escrowAddress: ESCROW_ADDRESS,
      tokenAddress: WLD_ADDRESS,
      amount: STAKE_AMOUNT,
      ref,
      refHash,
      ttlSeconds,
      expiresAt,
      message:
        "Send exactly `amount` WLD to `escrowAddress`. Keep the reference string safe; it will be used to finalize your stake.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}