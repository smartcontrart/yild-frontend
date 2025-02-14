export type SupportedChainId = 8453 | 1 | 42161;
export type ChainIdKey = `ChainId_${SupportedChainId}`;
// export type Token = {
//   chainId: number,
//   Address: string,
//   Decimals: number,
//   Symbol: string,
//   Name: string,
//   IconURI: string
// }

export const POSITION_MANAGER_CONTRACT_ADDRESS: Record<ChainIdKey, `0x${string}`> = {
  "ChainId_8453": "0xCa6099Cd42475a7915796c7C6c0D004994F40f6C" as `0x${string}`,
  "ChainId_1": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as `0x${string}`,
  "ChainId_42161": "0xaf88d065e77c8cc2239327c5edb3a432268e5831" as `0x${string}`,
};

export const TOKEN_LIST = [
  {
    NAME: "WETH",
    ADDRESS: {
      "ChainId_8453": "0x4200000000000000000000000000000000000006" as `0x${string}`,
      "ChainId_1": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" as `0x${string}`,
      "ChainId_42161": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1" as `0x${string}`,
    },
    DECIMALS: 18,
  },
  {
    NAME: "USDC",
    ADDRESS: {
      "ChainId_8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
      "ChainId_1": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as `0x${string}`,
      "ChainId_42161": "0xaf88d065e77c8cc2239327c5edb3a432268e5831" as `0x${string}`,
    },
    DECIMALS: 6,
  },
];

// export const SLIPPAGE = 5; // 5%
// export const BPS = 5; // 5%
export const BACKEND_API_URL =
  "http://ec2-3-132-245-13.us-east-2.compute.amazonaws.com:3000";
export const PARASWAP_API_URL = "https://api.paraswap.io/swap?version=6.2"