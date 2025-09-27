import { NextResponse } from "next/server";
import { keccak_256 } from "js-sha3";
import { RELAYER_AUTH_TOKEN, STAKE_AMOUNT } from "@/lib/escrow";

// Minimal relayer endpoint
// POST /api/relayer/record
// Headers: Authorization: Bearer <RELAYER_AUTH_TOKEN>
// Body: { from: string, to: string, amount?: string, ref?: string, refHash?: string }
// Returns: { ok: true, from, to, amount, ref, refHash }
export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || req.headers.get("Authorization");
    const expected = RELAYER_AUTH_TOKEN ? `Bearer ${RELAYER_AUTH_TOKEN}` : null;

    if (expected && auth !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { from, to } = body || {};
    let { amount, ref, refHash } = body || {};

    if (!from || !to || typeof from !== "string" || typeof to !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'from' or 'to'" },
        { status: 400 }
      );
    }

    // normalize amount to configured stake amount by default
    if (!amount || typeof amount !== "string") {
      amount = STAKE_AMOUNT;
    }

    // compute refHash if only ref is provided
    if (!refHash && ref && typeof ref === "string") {
      refHash = "0x" + keccak_256(ref);
    }

    if (!refHash || typeof refHash !== "string") {
      return NextResponse.json(
        { error: "Missing 'refHash' (or provide 'ref' to derive it)" },
        { status: 400 }
      );
    }

    // Minimal success payload. In a full implementation, this is where you
    // would call the escrow contract's recordPayStake(from, to, amount, refHash)
    // using a relayer signer.
    return NextResponse.json({ ok: true, from, to, amount, ref, refHash });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}