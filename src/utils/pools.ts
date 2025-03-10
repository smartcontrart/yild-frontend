import { config as wagmiConfig } from "@/components/global/providers";

import { readContract } from "@wagmi/core";
import { getUniswapV3FactoryContractAddressFromChainId } from "./constants";
import { UniswapV3PoolABI } from "@/abi/UniswapV3Pool";
import { getERC20TokenBalance, getERC20TokenInfo } from "./erc20";
import { formatUnits } from "viem";
import { fetchTokenPrice } from "./requests";

export const getPoolInfoDetail = async (poolAddress: string, chainId: number) => {
  const [feeTier, token0Address, token1Address] = await Promise.all([
    readContract(wagmiConfig, {
      abi: UniswapV3PoolABI, 
      address: poolAddress as `0x${string}`, 
      functionName: "fee",
      args: []
    }),
    readContract(wagmiConfig, {
      abi: UniswapV3PoolABI, 
      address: poolAddress as `0x${string}`, 
      functionName: "token0",
      args: []
    }),
    readContract(wagmiConfig, {
      abi: UniswapV3PoolABI, 
      address: poolAddress as `0x${string}`, 
      functionName: "token1",
      args: []
    })
  ])
  const [token0, token1, token0Balance, token1Balance, token0Price, token1Price] = await Promise.all([
    getERC20TokenInfo(token0Address as `0x${string}`, chainId),
    getERC20TokenInfo(token1Address as `0x${string}`, chainId),
    getERC20TokenBalance(token0Address as `0x${string}`, poolAddress),
    getERC20TokenBalance(token1Address as `0x${string}`, poolAddress),
    fetchTokenPrice(token0Address as `0x${string}`, chainId),
    fetchTokenPrice(token1Address as `0x${string}`, chainId)
  ])
  return {
    feeTier,
    token0,
    token1,
    token0Balance: formatUnits(token0Balance, token0.decimals),
    token1Balance: formatUnits(token1Balance, token1.decimals),
    token0Price,
    token1Price
  }
}

export const getFeeTierFromPoolAddress = async (poolAddress: string, chainId: number) => {
  try {
    const res: any = await readContract(wagmiConfig, {
      abi: UniswapV3PoolABI, 
      address: poolAddress as `0x${string}`, 
      functionName: "fee",
      args: []
    })
    return res
  } catch (error) {
    console.log(error)
    return null
  }
}

export const findPoolsFromTokens = async (token0Address: string, token1Address: string, feeTier: number, chainId: number) => {
  try {
    if (!token0Address || !token1Address || !feeTier || !chainId)
      return null
    const poolAddress = await readContract(wagmiConfig, {
      address: getUniswapV3FactoryContractAddressFromChainId(chainId),
      abi: [
        {
          "inputs": [
            { "internalType": "address", "name": "tokenA", "type": "address" },
            { "internalType": "address", "name": "tokenB", "type": "address" },
            { "internalType": "uint24", "name": "fee", "type": "uint24" }
          ],
          "name": "getPool",
          "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: "getPool",
      args: [token0Address as `0x${string}`, token1Address as `0x${string}`, feeTier],
    });
    if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
      const tokens = [token0Address, token1Address]
      const balances = await Promise.all(tokens.map((tokenAddress) => getERC20TokenBalance(tokenAddress, poolAddress)))
      return poolAddress === "0x0000000000000000000000000000000000000000" ? null : {
        poolAddress,
        feeTier,
        balance0: balances[0],
        balance1: balances[1]
      };
    }
  } catch (error) {
    console.log(error)
  }
  return null
}

export const getAvailablePools = async (token0Address: string, token1Address: string, chainId: number) => {
  const availableFeeTiers = [100, 500, 3000, 10000]
  const results = await Promise.all(availableFeeTiers.map((feeTier) => findPoolsFromTokens(token0Address, token1Address, feeTier, chainId)));
  return results
}

export const getTVLFromPoolAddress = async (poolAddress: string, chainId: number) => {

}