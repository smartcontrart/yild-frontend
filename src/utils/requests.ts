import { BACKEND_API_URL } from "./constants"
import { getERC20TokenInfo, getSwapInfo } from "./functions"

export const getPositions = async (address: string, chainId: number) => {
    let temp: any = []
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/chain/${chainId}/positions/${address}`)
        const { data } = await response.json()
        for (let i = 0; i < data.length; i++) {
            try {
                const { chainId, id, tokenId, lowerTick, upperTick, status, ownerAddress, poolAddress, createdAt, updatedAt } = data[i]
                const swapInfo = await getSwapInfo(tokenId, chainId)
                if (!swapInfo)
                    return []
                const { token0Address, token0Decimals, token1Address, token1Decimals} = swapInfo
                const { name: token0Name, symbol: token0Symbol } = await getERC20TokenInfo(token0Address, chainId)
                const { name: token1Name, symbol: token1Symbol } = await getERC20TokenInfo(token1Address, chainId)
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
    console.log(temp)
    return temp
}

// export const getTokenMetadataFromCoinGecko = async (address: string, chainId: number) => {
//     const networkName = chainId === 1 ? "ethereum" : chainId === 8453 ? "base" : "arbitrum"
//     const COINGECKO_URL = `https://api.coingecko.com/api/v3/coins/${networkName}/contract/${address}`
//     try {
//         const response = await fetch(COINGECKO_URL)
//         const { symbol, detail_platforms, name, image } = await response.json()
//         const decimals = detail_platforms[networkName]
//         const { small: imageURI } = image
//         const token: Token = {
//             chainId,
//             Address: address,
//             Decimals: decimals,
//             Symbol: symbol.toString().toUpperCase(),
//             Name: name,
//             IconURI: imageURI
//         }
//         return token
//     } catch (error) {
//         return {
//             chainId,
//             Address: address,
//             Decimals: 0,
//             Symbol: "",
//             Name: "",
//             IconURI: "imageURI"
//         }
//     }
// }