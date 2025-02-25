export type SupportedChainId = 8453 | 1 | 42161;
export type ChainIdKey = `ChainId_${SupportedChainId}`;

export const POSITION_MANAGER_CONTRACT_ADDRESS: Record<ChainIdKey, `0x${string}`> = {
  "ChainId_8453": "0xa4c2f5AF3074240b36307e2099d4e862dDE1B6cb" as `0x${string}`,
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

export const UNISWAP_V3_FACTORY_CONTRACT_ADDRESS: Record<ChainIdKey, `0x${string}`> = {
  "ChainId_1": "0x1F98431c8aD98523631AE4a59f267346ea31F984" as `0x${string}`,
  "ChainId_8453": "0x33128a8fC17869897dcE68Ed026d694621f6FDfD" as `0x${string}`,
  "ChainId_42161": "0x1F98431c8aD98523631AE4a59f267346ea31F984" as `0x${string}`
}

export const VALID_FEE_TIERS = [100, 500, 3000, 10000]
export const INVALID_FEE_TIER = 140

export const SUBGRAPH_API_KEY = "2818c13f6a7e9707378c0b8a3517bcb7"

// export const SLIPPAGE = 5; // 5%
// export const BPS = 5; // 5%
export const BACKEND_API_URL =
  "https://api.yild.finance";
export const PARASWAP_API_URL = "https://api.paraswap.io/swap?version=6.2"