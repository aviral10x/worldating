import { NextRequest } from "next/server";
import { createPublicClient, http, keccak256, toHex } from "viem";
import { WORL_DATE_ESCROW_ABI } from "@/lib/contracts";
import { getEscrowAddress, RUNTIME_CHAIN_ID } from "@/lib/contracts";

// Check stake status by reference on-chain using escrow ABI
// - Computes refHash = keccak256(ref) assuming contract stores refs as bytes32
// - Reads usedRef(refHash) => true means confirmed

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { ref } = body || {};
    if (!ref || typeof ref !== "string") {
      return Response.json({ error: "ref is required" }, { status: 400 });
    }

    const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    if (!RPC_URL) {
      // If no RPC configured, keep UI flow but report pending
      return Response.json({ ref, status: "pending", reason: "no_rpc" }, { status: 200 });
    }

    const client = createPublicClient({ chain: undefined as unknown as any, transport: http(RPC_URL) });
    const escrow = getEscrowAddress();

    // Hash UUID ref into bytes32 as commonly used on-chain key
    const refHash = keccak256(toHex(ref));

    // Try reading usedRef(bytes32) from escrow
    let confirmed = false;
    try {
      const used = (await client.readContract({
        address: escrow,
        abi: WORL_DATE_ESCROW_ABI,
        functionName: "usedRef",
        args: [refHash],
      })) as boolean;
      confirmed = Boolean(used);
    } catch {
      // Fallback: try stakes(refHash) returning struct with amount > 0 or similar
      try {
        const stake = (await client.readContract({
          address: escrow,
          abi: WORL_DATE_ESCROW_ABI,
          functionName: "stakes",
          args: [refHash],
        })) as any;
        // Heuristic: if struct exists and amount > 0, consider confirmed
        const amountWei = BigInt((stake?.amount as bigint) ?? 0n);
        confirmed = amountWei > 0n;
      } catch {
        // leave as pending if we cannot read
      }
    }

    if (confirmed) {
      return Response.json({ ref, status: "confirmed", chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || RUNTIME_CHAIN_ID), checkedAt: Date.now() }, { status: 200 });
    }

    return Response.json({ ref, status: "pending", chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || RUNTIME_CHAIN_ID), checkedAt: Date.now() }, { status: 200 });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to get status" }, { status: 500 });
  }
}