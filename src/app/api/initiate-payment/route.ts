import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest) {
  const uuid = crypto.randomUUID().replace(/-/g, "");
  // TODO: persist { reference: uuid, status: 'created', userId? }
  return NextResponse.json({ id: uuid });
}