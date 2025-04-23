import { config as wagmiConfig, baseWagmiConfig, arbitrumWagmiConfig } from "@/components/global/providers";

import { writeContract, waitForTransactionReceipt, readContract, simulateContract } from "@wagmi/core";
import { parseUnits } from "viem";

import { PositionManagerABI } from "@/abi/PositionManager";
import { LiquidityMathABI } from "@/abi/LiquidityMath";

import { getLiquidityMathContractAddressFromChainId, getManagerContractAddressFromChainId } from "./constants";
import { ERROR_CODES } from "./types";
import { getERC20TokenInfo } from './erc20'
import { fetchParaswapRoute, fetchTokenPrice, getMaxSlippageForPosition, getPositionStaticInfo } from "./requests";
import { multiplyBigIntWithFloat, roundDown } from "./functions";


export const collectFees = async (
  tokenId: number,
  chainId: number,
  recipient: string
) => {
  try {
    const hash = await writeContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "collectFees",
      args: [tokenId],
    });
    const receipt = await waitForTransactionReceipt(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, { hash });
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

export const compoundFees = async (
  userAddress: string,
  tokenId: number,
  chainId: number,
) => {
  const fundsInfo = await getPositionFundsInfo(tokenId, chainId)
  if (!fundsInfo)
    return {
      success: false,
      result: ERROR_CODES.UNKNOWN_ERROR
    }

  const poolInfo = await getPositionStaticInfo(userAddress, tokenId)
  if (!poolInfo)
    return {
      success: false,
      result: ERROR_CODES.UNKNOWN_ERROR
    }
  const { poolAddress, tickLower, tickUpper } = poolInfo

  const userMaxSlippage = await getMaxSlippageForPosition(tokenId, chainId)

  const { principal0, principal1, token0Address, token0Decimals, token1Address, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1 } = fundsInfo

  const availableAmount0 = feesEarned0 - protocolFee0
  const availableAmount1 = feesEarned1 - protocolFee1

  const rebalanceData: any = await readContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
    abi: LiquidityMathABI, 
    address: getLiquidityMathContractAddressFromChainId(chainId), 
    functionName: "calculateRebalanceData",
    args: [poolAddress, tickLower, tickUpper, availableAmount0, availableAmount1]
  })

  const { swapAmount0, swapAmount1, sell0For1 } = rebalanceData

  let _pSwapData0 = "0x", _pSwapData1 = "0x", _token0MaxSlippage = userMaxSlippage, _token1MaxSlippage = userMaxSlippage, _minAmountOut0 = BigInt(0), _minAmountOut1 = BigInt(0)
  if (sell0For1) {
    const { success: paraswapAPISuccess, data: paraswapData, destAmount: amountOut0 } = await fetchParaswapRoute(token0Address, token0Decimals, token1Address, token1Decimals, swapAmount0, chainId, _token0MaxSlippage, getManagerContractAddressFromChainId(chainId))
    if (paraswapAPISuccess) {
      _pSwapData0 = paraswapData
      _minAmountOut0 = BigInt(roundDown((Number(amountOut0) * (10000 - userMaxSlippage) / 10000), 0))
    }
  }
  else {
    const { success: paraswapAPISuccess, data: paraswapData, destAmount: amountOut1 } = await fetchParaswapRoute(token1Address, token1Decimals, token0Address, token0Decimals, swapAmount1, chainId, _token1MaxSlippage, getManagerContractAddressFromChainId(chainId))
    if (paraswapAPISuccess) {
      _pSwapData1 = paraswapData
      _minAmountOut1 = BigInt(roundDown((Number(amountOut1) * (10000 - userMaxSlippage) / 10000), 0))
    }
  }

  let params = [tokenId, _pSwapData0, _pSwapData1, _minAmountOut0, _minAmountOut1, _token0MaxSlippage, _token1MaxSlippage]

  let simulationSuccess = false
  try {
    const simulation = await simulateContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "compoundPosition",
      args: params,
    })
    if (simulation && simulation.result)
      simulationSuccess = true
  } catch (error) { }

  if (!simulationSuccess)
    params = [tokenId, "0x", "0x", 0, 0, _token0MaxSlippage, _token1MaxSlippage]

  try {
    const hash = await writeContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "compoundPosition",
      args: params,
    });
    const receipt = await waitForTransactionReceipt(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, { hash });
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

export const increaseLiquidity = async (
  chainId: number,
  data: any
) => {
  try {
    const { tokenId, amount0, amount1, decimals0, decimals1 } = data
    const userMaxSlippage = await getMaxSlippageForPosition(tokenId, chainId)
    const hash = await writeContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "increaseLiquidity",
      args: [parseInt(tokenId), parseUnits(amount0, decimals0), parseUnits(amount1, decimals1), 5000, 5000],
    });
    const receipt = await waitForTransactionReceipt(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, { hash });
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
  const fundsInfo = await getPositionFundsInfo(tokenId, chainId)
  if (!fundsInfo)
    return {
      success: false,
      result: ERROR_CODES.UNKNOWN_ERROR
    }

  const userMaxSlippage = await getMaxSlippageForPosition(tokenId, chainId)

  const { principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals, token0Address, token0Decimals, token1Address, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1 } = fundsInfo

  let _pSwapData0 = "0x", _pSwapData1 = "0x", minAmount0 = 0, minAmount1 = 0
  if (token0Address !== ownerAccountingUnit) {
    const totalAmount0ToSwap = roundDown((parseInt((principal0).toString()) / 10000 * amountInBPS), 0)
    const { success: paraswapAPISuccess, data: paraswapData, destAmount } = await fetchParaswapRoute(token0Address, token0Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, BigInt(totalAmount0ToSwap), chainId, userMaxSlippage, getManagerContractAddressFromChainId(chainId))
    minAmount0 = parseInt(roundDown((Number(destAmount) * ((10000 - userMaxSlippage) / 10000)), 0))
    if (paraswapAPISuccess) {
      _pSwapData0 = paraswapData
    }
  }
  if (token1Address !== ownerAccountingUnit) {
    const totalAmount1ToSwap = roundDown((parseInt((principal1).toString()) / 10000 * amountInBPS), 0)
    const { success: paraswapAPISuccess, data: paraswapData, destAmount } = await fetchParaswapRoute(token1Address, token1Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, BigInt(totalAmount1ToSwap), chainId, userMaxSlippage, getManagerContractAddressFromChainId(chainId))
    minAmount1 = parseInt(roundDown((Number(destAmount) * ((10000 - userMaxSlippage) / 10000)), 0))

    if (paraswapAPISuccess) {
      _pSwapData1 = paraswapData
    }
  }

  let params = [tokenId, amountInBPS, _pSwapData0, _pSwapData1, minAmount0, minAmount1, userMaxSlippage, userMaxSlippage]
  let simulationSuccess = false
  try {
    const simulation = await simulateContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "decreaseLiquidity",
      args: params,
    });
    if (simulation && simulation.result)
      simulationSuccess = true
  } catch (error) {
    console.log(error)
  }

  if (!simulationSuccess) {
    params = [tokenId, amountInBPS, "0x", "0x", minAmount0, minAmount1, userMaxSlippage, userMaxSlippage]
  }

  try {
    const hash = await writeContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "decreaseLiquidity",
      args: params,
    });
    const receipt = await waitForTransactionReceipt(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, { hash });
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
    const hash = await writeContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "openPosition",
      args: [params._params, ownerAddress],
    });
    const receipt = await waitForTransactionReceipt(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, { hash });
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

export const getPositionFundsInfo = async (tokenId: number, chainId: number) => {
  const res: any = await readContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
    abi: PositionManagerABI, 
    address: getManagerContractAddressFromChainId(chainId), 
    functionName: "getPositionInfo",
    args: [tokenId]
  })
  if (res.length !== 12) {
    console.log("Invalid data format from getPositionFundsInfo");
    return null;
  }
  const [token0Address, token1Address, token0Decimals, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1, principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals] = res
  return {
    token0Address, token1Address, token0Decimals, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1, principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals
  }
}

export const closePosition = async (tokenId: number, chainId: number) => {
  const fundsInfo = await getPositionFundsInfo(tokenId, chainId)
  if (!fundsInfo)
    return {
      success: false,
      result: ERROR_CODES.UNKNOWN_ERROR
  }
  const userMaxSlippage = await getMaxSlippageForPosition(tokenId, chainId)
  const { token0Address, token1Address, token0Decimals, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1, principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals } = fundsInfo

  let totalAmount0ToSwap = principal0 + feesEarned0 - protocolFee0
  let totalAmount1ToSwap = principal1 + feesEarned1 - protocolFee1

  let _pSwapData0 = "0x", _pSwapData1 = "0x", _minBuyAmount0 = BigInt(0), _minBuyAmount1 = BigInt(0)
  if (token0Address !== ownerAccountingUnit) {
    const { success: paraswapAPISuccess, data: paraswapData, destAmount } = await fetchParaswapRoute(token0Address, token0Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, BigInt(totalAmount0ToSwap), chainId, userMaxSlippage, getManagerContractAddressFromChainId(chainId))
    if (paraswapAPISuccess) {
      _pSwapData0 = paraswapData
      _minBuyAmount0 = BigInt(roundDown((Number(destAmount) * (10000 - userMaxSlippage) / 10000), 0))
    }
  }
  if (token1Address !== ownerAccountingUnit) {
    const { success: paraswapAPISuccess, data: paraswapData, destAmount } = await fetchParaswapRoute(token1Address, token1Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, BigInt(totalAmount1ToSwap), chainId, userMaxSlippage, getManagerContractAddressFromChainId(chainId))
    if (paraswapAPISuccess) {
      _pSwapData1 = paraswapData
      _minBuyAmount1 = BigInt(roundDown((Number(destAmount) * (10000 - userMaxSlippage) / 10000), 0))
    }
  }

  let params = [
    tokenId, 
    _pSwapData0,
    _pSwapData1,
    _minBuyAmount0,
    _minBuyAmount1,
    userMaxSlippage,
    userMaxSlippage
  ]

  let simulationSuccess = false;
  try {
    const simulation = await simulateContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "closePosition",
      args: params,
    })    
    if (simulation && simulation.result) {
      simulationSuccess = true;
    }
  } catch (error) {
    console.log(error)
  }

  // if simulation fails, we swap on Uniswap
  if (!simulationSuccess) {
    console.log(`Paraswap simulation failed, swapping on Uniswap...`)    
    params = [
      tokenId, 
      "0x",
      "0x",
      _minBuyAmount0,
      _minBuyAmount1,
      userMaxSlippage,
      userMaxSlippage
    ]
  }

  try {
    const hash = await writeContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "closePosition",
      args: params,
    });
    const receipt = await waitForTransactionReceipt(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, { hash });
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

export const getAccountingUnitFromAddress = async (address: string, chainId: number) => {
  try {
    const res: any = await readContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI, 
      address: getManagerContractAddressFromChainId(chainId), 
      functionName: "accountingUnit",
      args: [address]
    })
    if (res.toString() === "")
      return null
    const tokenInfo = await getERC20TokenInfo(res, chainId)
    return tokenInfo    
  } catch (error) {
    return null
  }
}

export const setAccountingUnit = async (unitAddress: string, chainId: number) => {
  try {
    const hash = await writeContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "setAccountingUnit",
      args: [unitAddress],
    });
    const receipt = await waitForTransactionReceipt(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, { hash });
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