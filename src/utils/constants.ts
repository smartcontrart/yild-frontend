export const VALID_FEE_TIERS = [100, 500, 3000, 10000]
export const INVALID_FEE_TIER = null

// export const SLIPPAGE = 5; // 5%
// export const BPS = 5; // 5%
export const TOKEN_LIVE_PRICE_FETCH_INTERVAL = 15000
export const USER_ERC_TOKEN_BALANCE_FETCH_INTERVAL = 15000

export const BACKEND_API_URL = "https://api.yild.finance";
export const PARASWAP_API_URL = "https://api.paraswap.io/swap?version=6.2"
export const UNISWAP_GITHUB_CLOUD_URL = "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains"
export const FALLBACK_ERC20_IMAGE_URL = "/favicon.png"

export const SUPPORTED_CHAINS = [
  {
    chainId: 42161,
    name: "arbitrum",
    secondaryRPC: "https://rpc.ankr.com/arbitrum",
    positionManager: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    liquidityMath: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984" as `0x${string}`,
    defaultTokens: [
      {
        name: "Wrapped ETH",
        symbol: "WETH",
        address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" as `0x${string}`,
        decimals: 18
      },
      {
        name: "Arbitrum Token",
        symbol: "ARB",
        address: "0x912CE59144191C1204E64559FE8253a0e49E6548" as `0x${string}`,
        decimals: 18
      },
      {
        name: "USD Coin",
        symbol: "USDC",
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as `0x${string}`,
        decimals: 6
      },    
      {
        name: "USD Tether",
        symbol: "USDT",
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as `0x${string}`,
        decimals: 6
      }
    ]
  },
  {
    chainId: 8453,
    name: "base",
    secondaryRPC: "https://rpc.ankr.com/base",
    positionManager: "0x5E346b40AB351b20E61E2525315c77ca049eA4dc" as `0x${string}`,
    liquidityMath: "0xd19c09c46803dcb6c926c5102bda7d9833e9c56d" as `0x${string}`,
    uniswapFactory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD" as `0x${string}`,
    defaultTokens: [
      {
        name: "Wrapped ETH",
        symbol: "WETH",
        address: "0x4200000000000000000000000000000000000006" as `0x${string}`,
        decimals: 18
      },
      {
        name: "USD Coin",
        symbol: "USDC",
        address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as `0x${string}`,
        decimals: 6
      },
      {
        name: "Virtual Protocol",
        symbol: "VIRTUAL",
        address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b" as `0x${string}`,
        decimals: 18
      }
    ]
  }
]

export const getNetworkNameFromChainId = (chainId: number) => {
  const filtered = SUPPORTED_CHAINS.filter((elem: any) => elem.chainId === chainId)
  return filtered && filtered.length > 0 ? filtered[0]["name"] : "base"
}

export const getSecondaryRPCFromChainId = (chainId: number) => {
  const filtered = SUPPORTED_CHAINS.filter((elem: any) => elem.chainId === chainId)
  return filtered && filtered.length > 0 ? filtered[0]["name"] : "base"
}

export const getUniswapV3FactoryContractAddressFromChainId = (chainId: number) => {
  const filtered = SUPPORTED_CHAINS.filter((elem: any) => elem.chainId === chainId)
  return filtered && filtered.length > 0 ? filtered[0]["uniswapFactory"] : "0x"
}

export const getManagerContractAddressFromChainId = (chainId: number) => {
  const filtered = SUPPORTED_CHAINS.filter((elem: any) => elem.chainId === chainId)
  return filtered && filtered.length > 0 ? filtered[0]["positionManager"] : "0x"
}

export const getLiquidityMathContractAddressFromChainId = (chainId: number) => {
  const filtered = SUPPORTED_CHAINS.filter((elem: any) => elem.chainId === chainId)
  return filtered && filtered.length > 0 ? filtered[0]["liquidityMath"] : "0x"
}

export const getDefaultTokensFromChainId = (chainId: number) => {
  const filtered = SUPPORTED_CHAINS.filter((elem: any) => elem.chainId === chainId)
  return filtered && filtered.length > 0 ? filtered[0]["defaultTokens"] : []
}

export interface ERC20TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  address: `0x${string}`;
  image?: string;
}
