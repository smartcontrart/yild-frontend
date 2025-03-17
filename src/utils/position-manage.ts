import { config as wagmiConfig } from "@/components/global/providers";

import { writeContract, waitForTransactionReceipt, readContract } from "@wagmi/core";
import { parseUnits } from "viem";

import { PositionManagerABI } from "@/abi/PositionManager";

import { getUniswapV3FactoryContractAddressFromChainId, getManagerContractAddressFromChainId } from "./constants";
import { ERROR_CODES } from "./types";
import { getERC20TokenBalance, getERC20TokenInfo } from './erc20'
import { fetchParaswapRoute, fetchTokenPrice, getMaxSlippageForPosition } from "./requests";
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
  const fundsInfo = await getPositionFundsInfo(tokenId, chainId)
  if (!fundsInfo)
    return {
      success: false,
      result: ERROR_CODES.UNKNOWN_ERROR
    }

  const userMaxSlippage = await getMaxSlippageForPosition(tokenId, chainId)

  const { principal0, principal1, token0Address, token0Decimals, token1Address, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1 } = fundsInfo

  const availableAmount0 = feesEarned0 - protocolFee0
  const availableAmount1 = feesEarned1 - protocolFee1

  const expectedAmount0 = principal0 * availableAmount1 / principal1

  let _pSwapData0 = "0x", _pSwapData1 = "0x", _token0MaxSlippage = userMaxSlippage, _token1MaxSlippage = userMaxSlippage, _minAmountOut0 = 0, _minAmountOut1 = 0
  const price0 = await fetchTokenPrice(token0Address, chainId)
  const price1 = await fetchTokenPrice(token1Address, chainId)

  if (expectedAmount0 < availableAmount0) {
    const swapAmount0 = BigInt((
      (availableAmount0 * principal1) - (availableAmount1 * principal0)
    ) / (
      (multiplyBigIntWithFloat(principal0, price0 / price1)) + principal1
    ))

    const { success: paraswapAPISuccess, data: paraswapData, destAmount: amountOut0 } = await fetchParaswapRoute(token0Address, token0Decimals, token1Address, token1Decimals, swapAmount0, chainId, _token0MaxSlippage, getManagerContractAddressFromChainId(chainId))

    if (paraswapAPISuccess) {
      _pSwapData0 = paraswapData
      _minAmountOut0 = Number(amountOut0)
    }
    else if (paraswapData === "not enough liquidity") {

    }
    else
      return {
        success: false,
        result: ERROR_CODES.UNKNOWN_ERROR
      }
  }
  else if (expectedAmount0 > availableAmount0) {
    const swapAmount1 = BigInt((
      (availableAmount1 * principal0) - (availableAmount0 * principal1)
    ) / (
      (multiplyBigIntWithFloat(principal1, price0 / price1)) + principal0
    ))

    const { success: paraswapAPISuccess, data: paraswapData, destAmount: amountOut1 } = await fetchParaswapRoute(token1Address, token1Decimals, token0Address, token0Decimals, swapAmount1, chainId, _token1MaxSlippage, getManagerContractAddressFromChainId(chainId))

    if (paraswapAPISuccess) {
      _pSwapData1 = paraswapData
      _minAmountOut0 = Number(amountOut1)
    }
    else if (paraswapData === "not enough liquidity") {

    }
    else
      return {
        success: false,
        result: ERROR_CODES.UNKNOWN_ERROR
      }
  }
  
  try {
    const hash = await writeContract(wagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "compoundPosition",
      args: [tokenId, _pSwapData0, _pSwapData1, _minAmountOut0, _minAmountOut1, _token0MaxSlippage, _token1MaxSlippage],
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
    const totalAmount0ToSwap = (parseInt((principal0 + feesEarned0 - protocolFee0).toString()) / 10000 * amountInBPS).toFixed(0)
    const { success: paraswapAPISuccess, data: paraswapData, destAmount } = await fetchParaswapRoute(token0Address, token0Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, BigInt(totalAmount0ToSwap), chainId, userMaxSlippage, getManagerContractAddressFromChainId(chainId))
    minAmount0 = parseInt((Number(destAmount)).toFixed(0))
    if (paraswapAPISuccess) {
      _pSwapData0 = paraswapData
    }
  }
  if (token1Address !== ownerAccountingUnit) {
    const totalAmount1ToSwap = (parseInt(principal1) / 10000 * amountInBPS).toFixed(0)
    const { success: paraswapAPISuccess, data: paraswapData, destAmount } = await fetchParaswapRoute(token1Address, token1Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, BigInt(totalAmount1ToSwap), chainId, userMaxSlippage, getManagerContractAddressFromChainId(chainId))
    minAmount1 = parseInt((Number(destAmount)).toFixed(0))

    if (paraswapAPISuccess) {
      _pSwapData1 = paraswapData
    }
  }

  try {
    const hash = await writeContract(wagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "decreaseLiquidity",
      args: [tokenId, amountInBPS, _pSwapData0, _pSwapData1, minAmount0, minAmount1, userMaxSlippage, userMaxSlippage],
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

export const getPositionFundsInfo = async (tokenId: number, chainId: number) => {
  const res: any = await readContract(wagmiConfig, {
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

  const totalAmount0ToSwap = principal0 + feesEarned0 - protocolFee0
  const totalAmount1ToSwap = principal1 + feesEarned1 - protocolFee1

  let _pSwapData0 = "0x", _pSwapData1 = "0x", _minBuyAmount0 = BigInt(0), _minBuyAmount1 = BigInt(0)
  if (token0Address !== ownerAccountingUnit) {
    const minBuyAmount0 = BigInt((totalAmount0ToSwap))  
    const { success: paraswapAPISuccess, data: paraswapData, destAmount } = await fetchParaswapRoute(token0Address, token0Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, minBuyAmount0, chainId, userMaxSlippage, getManagerContractAddressFromChainId(chainId))
    if (paraswapAPISuccess) _pSwapData0 = paraswapData
    _minBuyAmount0 = BigInt((Number(destAmount)).toFixed(0))
  }
  if (token1Address !== ownerAccountingUnit) {
    const minBuyAmount1 = BigInt((totalAmount1ToSwap))
    const { success: paraswapAPISuccess, data: paraswapData, destAmount } = await fetchParaswapRoute(token1Address, token1Decimals, ownerAccountingUnit, ownerAccountingUnitDecimals, minBuyAmount1, chainId, userMaxSlippage, getManagerContractAddressFromChainId(chainId))
    if (paraswapAPISuccess) _pSwapData1 = paraswapData
    _minBuyAmount1 = BigInt((Number(destAmount)).toFixed(0))
  }

  const params = [
    tokenId, 
    _pSwapData0,
    _pSwapData1,
    _minBuyAmount0,
    _minBuyAmount1,
    userMaxSlippage,
    userMaxSlippage
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

export const getAccountingUnitFromAddress = async (address: string, chainId: number) => {
  const res: any = await readContract(wagmiConfig, {
    abi: PositionManagerABI, 
    address: getManagerContractAddressFromChainId(chainId), 
    functionName: "accountingUnit",
    args: [address]
  })
  const tokenInfo = await getERC20TokenInfo(res, chainId)
  return tokenInfo
}

export const setAccountingUnit = async (unitAddress: string, chainId: number) => {
  try {
    const hash = await writeContract(wagmiConfig, {
      abi: PositionManagerABI,
      address: getManagerContractAddressFromChainId(chainId),
      functionName: "setAccountingUnit",
      args: [unitAddress],
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