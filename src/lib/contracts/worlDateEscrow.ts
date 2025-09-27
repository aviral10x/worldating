import worlDateEscrowAbi from "@/lib/abi/worlDateEscrow.json" assert { type: "json" };

// Re-export the ABI as a const for consumers (viem/ethers) without adding deps here.
export const WORL_DATE_ESCROW_ABI = worlDateEscrowAbi as const;

export type WorlDateEscrowAbi = typeof WORL_DATE_ESCROW_ABI;

// Minimal function name helpers (optional)
export const WorlDateEscrowFns = {
  claim: "claim",
  recordPayStake: "recordPayStake",
  setRelayer: "setRelayer",
  setStakeAmount: "setStakeAmount",
  setStakeTtl: "setStakeTtl",
  transferOwnership: "transferOwnership",
  withdrawExpired: "withdrawExpired",
  owner: "owner",
  pairs: "pairs",
  relayer: "relayer",
  stakeAmount: "stakeAmount",
  stakes: "stakes",
  stakeTtl: "stakeTtl",
  totalActiveStaked: "totalActiveStaked",
  usedRef: "usedRef",
  withdrawable: "withdrawable",
  WLD: "WLD",
} as const;