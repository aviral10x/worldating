import { NextRequest, NextResponse } from "next/server";
import { MiniAppPaymentSuccessPayload } from "@worldcoin/minikit-js";

// TODO: replace with actual persistence
async function getReferenceFromDB(reference: string) {
  return { reference };
}

export async function POST(req: NextRequest) {
  try {
    const { payload } = (await req.json()) as {
      payload: MiniAppPaymentSuccessPayload;
    };

    if (!payload?.reference || !payload?.transaction_id) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    // 1) Match the reference you created earlier
    const rec = await getReferenceFromDB(payload.reference);
    if (!rec || rec.reference !== payload.reference) {
      return NextResponse.json({ success: false, error: "Unknown reference" }, { status: 400 });
    }

    // 2) Query Developer Portal API for transaction status
    const appId = process.env.APP_ID;
    const apiKey = process.env.DEV_PORTAL_API_KEY;

    if (!appId || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing APP_ID or DEV_PORTAL_API_KEY" },
        { status: 500 }
      );
    }

    const r = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${appId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!r.ok) {
      return NextResponse.json({ success: false, error: `Upstream ${r.status}` }, { status: r.status });
    }

    const tx = await r.json();

    // 3) Optimistic confirm (or poll until tx.status === 'mined')
    const ok = tx?.reference === payload.reference && tx?.status !== "failed";
    // TODO: persist tx.status/tx.hash; mark reference as processed
    return NextResponse.json({ success: !!ok });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 });
  }
}