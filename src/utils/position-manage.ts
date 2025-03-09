import { config as wagmiConfig } from "@/components/global/providers";

import { writeContract, waitForTransactionReceipt, readContract } from "@wagmi/core";
import { parseUnits } from "viem";

import { PositionManagerABI } from "@/abi/PositionManager";

import { getUniswapV3FactoryContractAddressFromChainId, getManagerContractAddressFromChainId } from "./constants";
import { ERROR_CODES } from "./types";
import { getERC20TokenBalance } from './erc20'
import { fetchParaswapRoute, getPositions, fetchTokenPrice } from "./requests";
import { multiplyBigIntWithFloat } from "./functions";


export const collectFees = async (
  tokenId: number,
  chainId: number,
  recipient: string
) => {
  try {
    const hash = await writeContract(wagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "collectFees",
      args: [tokenId, recipient],
    });
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return {
      success: true,
      result: hash
    }
  } catch (error: any) {
    if (error?.message?.includes("User rejected") || error?.code === 4001) {
      return {
        success: false,
        result: ERROR_CODES.USER_REJECTED
      };
    }
  }
  return {
    success: false,
    result: ERROR_CODES.UNKNOWN_ERROR
  };
}

export const compoundFees = async (
  tokenId: number,
  chainId: number,
) => {
  const swapInfo = await getPositionInfo(tokenId, chainId)
  if (!swapInfo)
    return {
      success: false,
      result: ERROR_CODES.UNKNOWN_ERROR
    }

  const { principal0, principal1, token0Address, token0Decimals, token1Address, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1 } = swapInfo

  const availableAmount0 = feesEarned0 - protocolFee0
  const availableAmount1 = feesEarned1 - protocolFee1

  const expectedAmount0 = principal0 * availableAmount1 / principal1

  let _pSwapData0 = "0x", _pSwapData1 = "0x", _token0MaxSlippage = 500, _token1MaxSlippage = 500
  const price0 = await fetchTokenPrice(token0Address, chainId)
  const price1 = await fetchTokenPrice(token1Address, chainId)

  if (expectedAmount0 < availableAmount0) {
    const swapAmount0 = BigInt((
      (availableAmount0 * principal1) - (availableAmount1 * principal0)
    ) / (
      (multiplyBigIntWithFloat(principal0, price0 / price1)) + principal1
    ))

    const { success: paraswapAPISuccess, data: paraswapData } = await fetchParaswapRoute(token0Address, token0Decimals, token1Address, token1Decimals, swapAmount0, chainId, 500, getManagerContractAddressFromChainId(chainId))

    if (paraswapAPISuccess)
      _pSwapData0 = paraswapData
  }
  else if (expectedAmount0 > availableAmount0) {
    const swapAmount1 = BigInt((
      (availableAmount1 * principal0) - (availableAmount0 * principal1)
    ) / (
      (multiplyBigIntWithFloat(principal1, price0 / price1)) + principal0
    ))

    const { success: paraswapAPISuccess, data: paraswapData } = await fetchParaswapRoute(token1Address, token1Decimals, token0Address, token0Decimals, swapAmount1, chainId, 500, getManagerContractAddressFromChainId(chainId))

    if (paraswapAPISuccess)
      _pSwapData1 = paraswapData
  }
  
  try {
    const hash = await writeContract(wagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "compoundPosition",
      args: [tokenId, _pSwapData0, _pSwapData1, _token0MaxSlippage, _token1MaxSlippage],
    });
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return {
      success: true,
      result: hash
    }
  } catch (error: any) {
    if (error?.message?.includes("User rejected") || error?.code === 4001) {
      return {
        success: false,
        result: ERROR_CODES.USER_REJECTED
      };
    }
  }
  return {
    success: false,
    result: ERROR_CODES.UNKNOWN_ERROR
  };
}

export const increaseLiquidity = async (
  chainId: number,
  data: any
) => {
  try {
    const { tokenId, amount0, amount1, decimals0, decimals1 } = data
    const hash = await writeContract(wagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "increaseLiquidity",
      args: [parseInt(tokenId), parseUnits(amount0, decimals0), parseUnits(amount1, decimals1), 9500, 9500],
    });
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return {
      success: true,
      result: hash
    }
  } catch (error: any) {
    console.log(error)
    if (error?.message?.includes("User rejected") || error?.code === 4001) {
      return {
        success: false,
        result: ERROR_CODES.USER_REJECTED
      };
    }
  }
  return {
    success: false,
    result: ERROR_CODES.UNKNOWN_ERROR
  };
}

export const decreaseLiquidity = async (
  tokenId: number,
  chainId: number,
  amountInBPS: number
) => {
  const swapInfo = await getPositionInfo(tokenId, chainId)
  if (!swapInfo)
    return {
      success: false,
      result: ERROR_CODES.UNKNOWN_ERROR
    }

  const { principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals, token0Address, token0Decimals, token1Address, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1 } = swapInfo

  let _pSwapData0 = "0x", _pSwapData1 = "0x"
  if (token0Address !== ownerAccountingUnit) {
    const totalAmount0ToSwap = (parseInt((principal0 + feesEarned0 - protocolFee0).toString()) / 10000 * amountInBPS * 0.95).toFixed(0)
    const { success: paraswapAPISuccess, data: paraswapData } = await fetchParaswapRoute(token0Address, token0Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, BigInt(totalAmount0ToSwap), chainId, 500, getManagerContractAddressFromChainId(chainId))
    if (paraswapAPISuccess) {
      _pSwapData0 = paraswapData
    }
  }
  if (token1Address !== ownerAccountingUnit) {
    const totalAmount1ToSwap = (parseInt(principal1) / 10000 * amountInBPS).toFixed(0)
    const { success: paraswapAPISuccess, data: paraswapData } = await fetchParaswapRoute(token1Address, token1Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, BigInt(totalAmount1ToSwap), chainId, 500, getManagerContractAddressFromChainId(chainId))
    if (paraswapAPISuccess) {
      _pSwapData1 = paraswapData
    }
  }

  try {
    const hash = await writeContract(wagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "decreaseLiquidity",
      args: [tokenId, amountInBPS, _pSwapData0, _pSwapData1, 9500, 9500],
    });
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return {
      success: true,
      result: hash
    }
  } catch (error: any) {
    if (error?.message?.includes("User rejected") || error?.code === 4001) {
      return {
        success: false,
        result: ERROR_CODES.USER_REJECTED
      };
    }
  }
  return {
    success: false,
    result: ERROR_CODES.UNKNOWN_ERROR
  };

}

export const openPosition = async (
  publicClient: any, 
  chainId: number,
  data: any,
  ownerAddress: any
) => {
  if (!publicClient) {
    return {
      success: false,
      result: "publicClient not available"
    }
  }

  const block = await publicClient.getBlock();
  const currentTimestamp = Number(block.timestamp);
  const deadlineTimestamp = currentTimestamp + 10 * 60; // Add 10 minutes in seconds

  const {
    token0Address,
    token1Address,
    feeTier,
    tickUpper,
    tickLower,
    token0Value,
    token1Value,
    token0Decimals,
    token1Decimals
  } = data

  const params = {
    _params: {
      token0: token0Address,
      token1: token1Address,
      fee: parseInt(feeTier),
      tickUpper: parseInt(tickUpper),
      tickLower: parseInt(tickLower),
      amount0Desired: parseUnits(token0Value.toString(), token0Decimals),
      amount1Desired: parseUnits(token1Value.toString(), token1Decimals),
      amount0Min: 0,
      amount1Min: 0,
      recipient: getManagerContractAddressFromChainId(chainId),
      deadline: deadlineTimestamp,
    },
  };

  try {
    const hash = await writeContract(wagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "openPosition",
      args: [params._params, ownerAddress],
    });
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return {
      success: true,
      result: hash
    }
  } catch (error: any) {
    if (error?.message?.includes("User rejected") || error?.code === 4001) {
      return {
        success: false,
        result: ERROR_CODES.USER_REJECTED
      };
    }
  }
  return {
    success: false,
    result: ERROR_CODES.UNKNOWN_ERROR
  };
}

export const getPositionInfo = async (tokenId: number, chainId: number) => {
  const res: any = await readContract(wagmiConfig, {
    abi: PositionManagerABI, 
    address: getManagerContractAddressFromChainId(chainId), 
    functionName: "getPositionInfo",
    args: [tokenId]
  })
  if (res.length !== 12) {
    console.log("Invalid data format from getPositionInfo");
    return null;
  }
  const [token0Address, token1Address, token0Decimals, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1, principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals] = res
  return {
    token0Address, token1Address, token0Decimals, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1, principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals
  }
}

export const getPositionDetail = async (address: string, chainId: number, tokenId: number) => {
  const positions = await getPositions(address, chainId)
  const filtered = positions.filter((elem: any) => elem.tokenId === tokenId)

  if (!filtered || filtered.length < 1)
    return null
  
  const { dbId, decimals0, decimals1, symbol0, symbol1, tickLower, tickUpper, token0Address, token1Address, createdAt, updatedAt, poolAddress } = filtered[0]

  const swapInfo = await getPositionInfo(tokenId, chainId)

  if (!swapInfo)
    return null

  const { feesEarned0, feesEarned1, ownerAccountingUnit, ownerAccountingUnitDecimals, principal0, principal1, protocolFee0, protocolFee1 } = swapInfo
  return {
    dbId, tokenId, chainId, poolAddress, token0Address, token1Address, ownerAccountingUnit, decimals0, decimals1, ownerAccountingUnitDecimals, symbol0, symbol1, tickLower, tickUpper, createdAt, updatedAt, feesEarned0, feesEarned1, principal0, principal1, protocolFee0, protocolFee1
  }
}

export const getPoolInfo = async (poolAddress: string, chainId: number) => {
  try {
    const res: any = await readContract(wagmiConfig, {
      abi: [{"inputs":[],"name":"fee","outputs":[{"internalType":"uint24","name":"","type":"uint24"}],"stateMutability":"view","type":"function"}], 
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

export const closePosition = async (tokenId: number, chainId: number) => {
  const swapInfo = await getPositionInfo(tokenId, chainId)
  if (!swapInfo)
    return {
      success: false,
      result: ERROR_CODES.UNKNOWN_ERROR
  }
  const { token0Address, token1Address, token0Decimals, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1, principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals } = swapInfo

  const totalAmount0ToSwap = principal0 + feesEarned0 - protocolFee0
  const totalAmount1ToSwap = principal1 + feesEarned1 - protocolFee1

  let _pSwapData0 = "0x", _pSwapData1 = "0x", _minBuyAmount0 = BigInt(0), _minBuyAmount1 = BigInt(0)
  if (token0Address !== ownerAccountingUnit) {
    const minBuyAmount0 = BigInt((totalAmount0ToSwap))  
    const { success: paraswapAPISuccess, data: paraswapData, destAmount } = await fetchParaswapRoute(token0Address, token0Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, minBuyAmount0, chainId, 500, getManagerContractAddressFromChainId(chainId))
    if (paraswapAPISuccess) _pSwapData0 = paraswapData
    _minBuyAmount0 = BigInt((Number(destAmount) * 0.95).toFixed(0))
  }
  if (token1Address !== ownerAccountingUnit) {
    const minBuyAmount1 = BigInt((totalAmount1ToSwap))
    const { success: paraswapAPISuccess, data: paraswapData, destAmount } = await fetchParaswapRoute(token1Address, token1Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, minBuyAmount1, chainId, 500, getManagerContractAddressFromChainId(chainId))
    if (paraswapAPISuccess) _pSwapData1 = paraswapData
    _minBuyAmount1 = BigInt((Number(destAmount) * 0.95).toFixed(0))
  }

  const params = [
    tokenId, 
    _pSwapData0,
    _pSwapData1,
    500,
    500
  ]

  try {
    const hash = await writeContract(wagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "closePosition",
      args: params,
    });
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return {
      success: true,
      result: hash
    }
  } catch (error: any) {
    if (error?.message?.includes("User rejected") || error?.code === 4001) {
      return {
        success: false,
        result: ERROR_CODES.USER_REJECTED
      };
    }
  }
  return {
    success: false,
    result: ERROR_CODES.UNKNOWN_ERROR
  };
}

export const getPoolAddressAndTVL = async (token0Address: string, token1Address: string, feeTier: number, chainId: number) => {
  try {
    if (!token0Address || !token1Address || !feeTier || !chainId)
      return null
    const poolAddress = await readContract(wagmiConfig, {
      // address: UNISWAP_V3_FACTORY_CONTRACT_ADDRESS[chainIdKey] as `0x${string}`,
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
  const results = await Promise.all(availableFeeTiers.map((feeTier) => getPoolAddressAndTVL(token0Address, token1Address, feeTier, chainId)));
  return results
}
