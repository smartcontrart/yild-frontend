import { BACKEND_API_URL, PARASWAP_API_URL } from "./constants"
import { getPositionInfo } from "./position-manage"
import { getERC20TokenInfo } from "./erc20"

export const getPositions = async (address: string, chainId: number) => {
  let temp: any = []
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/chain/${chainId}/positions/${address}`)
    const { data } = await response.json()
    for (let i = 0; i < data.length; i++) {
      try {
        const { chainId, id, tokenId, lowerTick, upperTick, status, ownerAddress, poolAddress, createdAt, updatedAt } = data[i]
        const swapInfo = await getPositionInfo(tokenId, chainId)
        if (!swapInfo)
          return []
        const { token0Address, token0Decimals, token1Address, token1Decimals} = swapInfo
        const token0Info = await getERC20TokenInfo(token0Address, chainId)
        const token1Info = await getERC20TokenInfo(token1Address, chainId)
        if (!token0Info || !token1Info)
          continue;
        const { name: token0Name, symbol: token0Symbol } = token0Info
        const { name: token1Name, symbol: token1Symbol } = token1Info
       
        if (token0Symbol && token1Symbol) {
          temp = [
            ...temp, 
            { 
              tokenId,
              symbol: token0Symbol + "/" + token1Symbol, 
              symbol0: token0Symbol, 
              symbol1: token1Symbol,
              token0Address,
              token1Address,
              poolAddress,
              decimals0: token0Decimals, 
              decimals1: token1Decimals,
              tickLower: lowerTick, 
              tickUpper: upperTick,
              dbId: id,
              chainId: chainId,
              createdAt,
              updatedAt
            }
          ]
        }
      } catch (error) {

      }
    }
  } catch(err) {
    console.log('Get positions error: ', err)
  }
  return temp
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
    const response = await fetch(`${PARASWAP_API_URL}&srcToken=${srcToken}&srcDecimals=${srcDecimals}&destToken=${destToken}&destDecimals=${destDecimals}&amount=${Number(amount).toFixed(0)}&side=SELL&network=${chainId}&slippage=${slippage}&userAddress=${userAddress}`);
    const response_json = await response.json();
    if (response_json && response_json.txParams && response_json.priceRoute) {
      const { data } = response_json.txParams;
      const { destAmount } = response_json.priceRoute
      return { success: true, data, destAmount }
    }
    return { success: false, data: "invalid response" }
  } catch (error) {
    console.log(`Error while Paraswap API call...`)
    console.error(error)
    return { success: false }
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

export const fetchTokenPriceWithLoading = async (tokenAddress: string, setPrice: Function, setIsLoading: Function, chainId: number) => {
  if (!tokenAddress)
    return
  setIsLoading(true);
  try {
    const price = await fetchTokenPrice(tokenAddress, chainId);
    setPrice(price);
  } catch (error) {
    console.error("Error fetching token1 price:", error);
  } finally {
    setIsLoading(false);
  }
}

export const sendClosePositionReport = async (userAddress: string, chainId: number, positionId: number) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/chain/${chainId}/positions/${positionId}/close`, {
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
