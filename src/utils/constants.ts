export type SupportedChainId = 8453 | 1 | 42161;
export type ChainIdKey = `ChainId_${SupportedChainId}`;

export const SUPPORTED_CHAINS = {
  "ChainId_1": {
    name: "Ethereum"
  },
  "ChainId_8453": {
    name: "Base"
  },
  "ChainId_42161": {
    name: "Arbitrum"
  }
}

export const getNetworkNameFromChainId = (chainId: number) => chainId === 1 ? "ethereum" : chainId === 8453 ? "base" : "arbitrum"

export const POSITION_MANAGER_CONTRACT_ADDRESS: Record<ChainIdKey, `0x${string}`> = {
  "ChainId_8453": "0x5E346b40AB351b20E61E2525315c77ca049eA4dc" as `0x${string}`,
  "ChainId_1": "0x0000000000000000000000000000000000000000" as `0x${string}`,
  "ChainId_42161": "0x0000000000000000000000000000000000000000" as `0x${string}`,
};

export const LIQUIDITY_MATH_CONTRACT_ADDRESS: Record<ChainIdKey, `0x${string}`> = {
  "ChainId_8453": "0xd19c09c46803dcb6c926c5102bda7d9833e9c56d" as `0x${string}`,
  "ChainId_1": "0x0000000000000000000000000000000000000000" as `0x${string}`,
  "ChainId_42161": "0x0000000000000000000000000000000000000000" as `0x${string}`,
};

export const TRENDING_TOKEN_LIST = {
  "ethereum": [
    {
      NAME: "WETH",
      ADDRESS: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      DECIMALS: 18
    },
    {
      NAME: "USDC",
      ADDRESS: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      DECIMALS: 6
    },
    {
      NAME: "USDT",
      ADDRESS: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      DECIMALS: 6
    }
  ],
  "base": [
    {
      NAME: "WETH",
      ADDRESS: "0x4200000000000000000000000000000000000006",
      DECIMALS: 18
    },
    {
      NAME: "USDC",
      ADDRESS: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      DECIMALS: 6
    }
  ],
  "arbitrum": [
    {
      NAME: "WETH",
      ADDRESS: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      DECIMALS: 18
    },
    {
      NAME: "ARB",
      ADDRESS: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      DECIMALS: 18
    },
    {
      NAME: "USDC",
      ADDRESS: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      DECIMALS: 6
    },    
    {
      NAME: "USDT",
      ADDRESS: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      DECIMALS: 6
    }
  ]
};

export const UNISWAP_V3_FACTORY_CONTRACT_ADDRESS: Record<ChainIdKey, `0x${string}`> = {
  "ChainId_1": "0x1F98431c8aD98523631AE4a59f267346ea31F984" as `0x${string}`,
  "ChainId_8453": "0x33128a8fC17869897dcE68Ed026d694621f6FDfD" as `0x${string}`,
  "ChainId_42161": "0x1F98431c8aD98523631AE4a59f267346ea31F984" as `0x${string}`
}

export const VALID_FEE_TIERS = [100, 500, 3000, 10000]
export const INVALID_FEE_TIER = null

export const SUBGRAPH_API_KEY = process.env.NEXT_PUBLIC_SUBGRAPH_API_KEY

// export const SLIPPAGE = 5; // 5%
// export const BPS = 5; // 5%
export const BACKEND_API_URL = "https://api.yild.finance";
export const PARASWAP_API_URL = "https://api.paraswap.io/swap?version=6.2"
export const TRUST_WALLET_GITHUB_CLOUD_URL = "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains"