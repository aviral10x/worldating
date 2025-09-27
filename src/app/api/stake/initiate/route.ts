import { NextRequest } from "next/server";
import { getEscrowAddress, getWldAddress, RUNTIME_CHAIN_ID } from "@/lib/contracts/addresses";

// Minimal initiate endpoint to return staking parameters from env
// NOTE: This does not persist state yet. It returns a unique reference and
// reads escrow/token/amount from env for the client to call MiniKit.pay.

function getEnv(name: string, optional = false) {
  const v = process.env[name];
  if (!v && !optional) {
    throw new Error(`${name} is not set`);
  }
  return v as string | undefined;
}

function uuidRef() {
  // simple RFC4122 v4-like reference (not cryptographically strong)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function POST(req: NextRequest) {
  try {
    // Optional: read body for future use (from, to, profileId, etc.)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _body = await req.json().catch(() => ({}));

    // Resolve chainId first
    const resolvedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || String(RUNTIME_CHAIN_ID));

    // Prefer explicit envs, but fall back to chain-mapped addresses to avoid hard failures
    // Support multiple env names and per-chain suffixes for flexibility
    const chainSuffix = `_${resolvedChainId}`;
    const ESCROW_ADDRESS =
      process.env.ESCROW_ADDRESS ||
      process.env.NEXT_PUBLIC_ESCROW_ADDRESS ||
      process.env[`ESCROW_ADDRESS${chainSuffix}`] ||
      process.env[`NEXT_PUBLIC_ESCROW_ADDRESS${chainSuffix}`] ||
      getEscrowAddress();

    const APP_ID = getEnv("APP_ID");
    const NEXT_PUBLIC_CHAIN_ID = String(resolvedChainId);

    // ENFORCE EXACT 0.01 WLD, do not allow override via env
    const EXACT_STAKE_AMOUNT_WEI = "10000000000000000"; // 0.01 WLD

    // Token address must be provided (WLD is an ERC-20, not native)
    const WLD_TOKEN_ADDRESS =
      process.env.WLD_TOKEN_ADDRESS ||
      process.env[`WLD_TOKEN_ADDRESS${chainSuffix}`] ||
      process.env.NEXT_PUBLIC_WLD_TOKEN_ADDRESS ||
      process.env[`NEXT_PUBLIC_WLD_TOKEN_ADDRESS${chainSuffix}`] ||
      getWldAddress();

    // Validate addresses
    const isHexAddress = /^0x[0-9a-fA-F]{40}$/.test(ESCROW_ADDRESS);
    const isZero = /^0x0{40}$/i.test(ESCROW_ADDRESS);
    if (!isHexAddress || isZero) {
      throw new Error(
        `ESCROW_ADDRESS is not set or invalid for chain ${NEXT_PUBLIC_CHAIN_ID}. Set ENV ESCROW_ADDRESS (or NEXT_PUBLIC_ESCROW_ADDRESS) or update ESCROW_ADDRESSES mapping for chain ${NEXT_PUBLIC_CHAIN_ID}.`
      );
    }

    const wldIsHex = typeof WLD_TOKEN_ADDRESS === "string" && /^0x[0-9a-fA-F]{40}$/.test(WLD_TOKEN_ADDRESS);
    const wldIsZero = typeof WLD_TOKEN_ADDRESS === "string" && /^0x0{40}$/i.test(WLD_TOKEN_ADDRESS);
    if (!wldIsHex || wldIsZero) {
      throw new Error(
        `WLD token address is not configured for chain ${NEXT_PUBLIC_CHAIN_ID}. Set WLD_TOKEN_ADDRESS (or NEXT_PUBLIC_WLD_TOKEN_ADDRESS) or update WLD_ADDRESSES mapping.`
      );
    }

    const ref = uuidRef();

    return Response.json(
      {
        escrowAddress: ESCROW_ADDRESS,
        appId: APP_ID,
        chainId: Number(NEXT_PUBLIC_CHAIN_ID),
        stakeAmountWei: EXACT_STAKE_AMOUNT_WEI,
        wldTokenAddress: WLD_TOKEN_ADDRESS,
        ref,
        // Keep shape flexible for future use
        reference: ref,
        createdAt: Date.now(),
      },
      { status: 200 }
    );
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to initiate stake" }, { status: 500 });
  }
}