// Server-side escrow configuration constants
// NOTE: These read from environment variables. Do not import this file in client components.

export const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || "0xESCROW_PLACEHOLDER";
export const WLD_ADDRESS = process.env.WLD_ADDRESS || "0x163f8C2467924be0ae7B5347228CABF260318753"; // OP Mainnet WLD
export const STAKE_AMOUNT = process.env.STAKE_AMOUNT || "5000000000000000000"; // 5e18 default
export const STAKE_TTL_SECONDS = Number(process.env.STAKE_TTL_SECONDS || 604800); // 7 days

// Optional relayer security token for the relayer endpoint (Bearer <token>)
export const RELAYER_AUTH_TOKEN = process.env.RELAYER_AUTH_TOKEN || "";