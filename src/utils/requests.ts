import { BACKEND_API_URL, COINGECKO_PUBLIC_API_URL, getNetworkNameFromChainId, PARASWAP_API_URL } from "./constants"
import { getPositionFundsInfo } from "./position-manage"
import { getERC20TokenInfo } from "./erc20"
import { roundDown } from "./functions"

export const getPositions = async (address: string) => {
  let temp: any = []
  try {
    const response = await fetch(`${BACKEND_API_URL}/positions/${address}`)
    const { data } = await response.json()
    return data
  } catch(err) {
    console.log('Get positions error: ', err)
  }
  return temp
}

export const getClosedPositions = async (address: string) => {
  let temp: any = []
  try {
    const response = await fetch(`${BACKEND_API_URL}/positions/${address}/closed`)
    const { data } = await response.json()
    return data
  } catch(err) {
    console.log('Get positions error: ', err)
  }
  return temp
}

export const getPositionStaticInfo = async (address: string, positionId: number) => {
  if (!address || !positionId)
    return null

  const positions = await getPositions(address)
  const filtered = positions.filter((elem: any) => Number(elem.tokenId) === positionId)

  if (!filtered || filtered.length < 1)
    return null
  
  const { id: dbId, lowerTick: tickLower, upperTick: tickUpper, createdAt, updatedAt, poolAddress, ownerAddress, chainId } = filtered[0]

  const fundsInfo = await getPositionFundsInfo(positionId, chainId)
  if (!fundsInfo)
    return null

  const { token0Address, token1Address, ownerAccountingUnit } = fundsInfo

  const [token0, token1, accountingUnit] = await Promise.all([
    getERC20TokenInfo(token0Address, chainId),
    getERC20TokenInfo(token1Address, chainId),
    getERC20TokenInfo(ownerAccountingUnit, chainId)
  ])

  return {
    dbId, positionId, chainId, tickLower, tickUpper, createdAt, updatedAt, poolAddress, token0, token1, accountingUnit
  }
}

export const fetchParaswapRoute = async (
  srcToken: string,
  srcDecimals: number,
  destToken: string,
  destDecimals: number,
  amount: bigint,
  chainId: number,
  slippage: number,
  userAddress: string
) => {
  try {
    const response = await fetch(`${PARASWAP_API_URL}&srcToken=${srcToken}&srcDecimals=${srcDecimals}&destToken=${destToken}&destDecimals=${destDecimals}&amount=${roundDown(Number(amount) * 0.999, 0)}&side=SELL&network=${chainId}&slippage=${slippage}&userAddress=${userAddress}`);
    const response_json = await response.json();
    if (response_json && response_json.txParams && response_json.priceRoute) {
      const { data } = response_json.txParams;
      const { destAmount } = response_json.priceRoute
      return { success: true, data, destAmount }
    }
    else if (response_json && response_json.error === "No routes found with enough liquidity") {
      return { success: false, data: "not enough liquidity" }
    }
    else if (response_json && response_json.error.indexOf("too small to proceed") > -1) {
      return { success: false, data: "too small to proceed" }
    }
    return { success: false, data: "invalid response" }
  } catch (error) {
    // console.log(`Error while Paraswap API call...`)
    // console.error(error)
    return { success: false, data: error }
  }
}

export const fetchTokenPrice = async (tokenAddress: string, chainId: number) => {
  try {
    const chainName = chainId === 1 ? "ethereum" : chainId === 8453 ? "base" : chainId === 42161 ? "arbitrum" : "not-supported"
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );
    const data = await response.json();
  
    if (data.pairs && data.pairs.length > 0) {
      const priceInfo = data.pairs.filter((pair: any) => pair.chainId === chainName || pair.dexId === "uniswap")
      return priceInfo[0].priceUsd;
    }    
  } catch (error) {
    console.error("Error fetching token1 price:", error);
    return null
  }
}

export const sendClosePositionReport = async (userAddress: string, chainId: number, positionId: number) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/positions/${positionId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userAddress }),
    });
    const data = await response.json();
    return data
  } catch (error) {
    console.error('Error sending close position report:', error);
    return null
  }
}

export const getMaxSlippageForPosition = async (positionId: number, chainId: number): Promise<number> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/positions/${positionId}/maxSlippage`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (data && data.success)
      return data.data.maxSlippage
  } catch (error) {
    console.error('Error getMaxSlippageForPosition:', error);
  }
  return -1
}

export const updateMaxSlippageForPosition = async (positionId: number, chainId: number, maxSlippage: number): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/positions/${positionId}/updateMaxSlippage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maxSlippage }),
    });
    const data = await response.json();
    if (data && (data.success || data.success === "true"))
      return true
  } catch (error) {
    console.error('Error sending close position report:', error);
  }
  return false
}

export const getCoinGeckoImageURLFromTokenAddress = async (tokenAddress: string, chainId: number) => {
  try {
    const coinMeta = await fetch(`${COINGECKO_PUBLIC_API_URL}/coins/${getNetworkNameFromChainId(chainId)}/contract/${tokenAddress}`)
    const { image } = await coinMeta.json()
    return (image && image.large) ? image.large : null
  } catch (error) {
  }
  return null
}