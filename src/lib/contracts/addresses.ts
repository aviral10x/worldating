// Centralized contract addresses and staking params
// Update these with your deployed values. Avoid hardcoding private info.

export type SupportedChainId =
  | 480 // Optimism Mainnet
  | 11155420; // OP Sepolia

// WLD token addresses (known)
export const WLD_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
  480: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003", // OP Mainnet
  11155420: "0x0000000000000000000000000000000000000000", // TODO: set OP Sepolia WLD (or mock)
};

// Deployed escrow addresses (set after deployment)
export const ESCROW_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
  480: "0x1D3fbEbE99D0c41dd3D88879242ADFe407Ac4c79", // TODO: replace with mainnet deployment
  11155420: "0x0000000000000000000000000000000000000000", // TODO: replace with testnet deployment
};

// App runtime chain selector (defaults to OP Mainnet if not provided)
export const RUNTIME_CHAIN_ID: SupportedChainId = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID || 480
) as SupportedChainId;

export const getEscrowAddress = (): `0x${string}` =>
  ESCROW_ADDRESSES[RUNTIME_CHAIN_ID];
export const getWldAddress = (): `0x${string}` =>
  WLD_ADDRESSES[RUNTIME_CHAIN_ID];

// Optional: frontend display params (keep in sync with onchain values)
export const STAKE_PARAMS = {
  // Stake amount in wei as a string to avoid BigInt in env parsing; convert to BigInt where needed
  amountWei: process.env.NEXT_PUBLIC_STAKE_AMOUNT_WEI || "50000000000000000", // 0.05 WLD by default
  ttlSeconds: Number(process.env.NEXT_PUBLIC_STAKE_TTL || 604800), // 7 days
} as const;
