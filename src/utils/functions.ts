import { ethers } from "ethers";
import {
  mainnet,
  arbitrum,
  base,
} from "wagmi/chains";
import { writeContract, waitForTransactionReceipt, readContract } from "@wagmi/core";
import { config as wagmiConfig } from "@/components/providers";
import { POSITION_MANAGER_CONTRACT_ADDRESS, PARASWAP_API_URL, ChainIdKey, SupportedChainId } from "./constants";
import { PositionManagerABI } from "@/abi/PositionManager";
import { erc20Abi, parseUnits } from "viem";

export const getNetworkFromChainId = (chainId: number) => {
  if (chainId === 8453) {
    return base
  }
  if (chainId === 42161) {
    return arbitrum
  }
  if (chainId === 1) {
    return mainnet
  }
  return mainnet
}

export const getManagerContractAddressFromChainId = (chainId: number) => {
  const chainIdKey: ChainIdKey = `ChainId_${chainId as SupportedChainId}`;
  return POSITION_MANAGER_CONTRACT_ADDRESS[chainIdKey] as `0x${string}`
}

export const getERC20TokenInfo = async (address: string, chainId: number) => {
  const name = await readContract(wagmiConfig, {
    abi: erc20Abi, 
    address: address as `0x${string}`, 
    functionName: "name",
  })
  const symbol = await readContract(wagmiConfig, {
    abi: erc20Abi, 
    address: address as `0x${string}`, 
    functionName: "symbol",
  })
  const decimals = await readContract(wagmiConfig, {
    abi: erc20Abi, 
    address: address as `0x${string}`, 
    functionName: "decimals",
  })
  return { name, symbol, decimals }
};

export const approveToken = async (address: string, spender: string, decimals: number, value: any) => {
  if (!address || !address.startsWith("0x")) {
    return {
      success: false,
      result: "Invalid token contract address"
    }
  }

  if (!spender || !spender.startsWith("0x")) {
    return {
      success: false,
      result: "Invalid spender address"
    }
  }

  const tokenApprovalConfig = {
    abi: erc20Abi,
    address: address as `0x${string}`,
    functionName: "approve",
    args: [
      spender as `0x${string}`,
      parseUnits(value, decimals || 18),
    ],
  } as const;

  try {
    const hash = await writeContract(wagmiConfig, tokenApprovalConfig);
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return {
      success: true,
      result: hash
    }
  } catch (error: any) {
    if (error?.message?.includes("User rejected") || error?.code === 4001) {
      console.log("User rejected token0 approval");
      return {
        success: false,
        result: "User rejected token approval"
      };
    }
    return {
      success: false,
      result: "Unknown error"
    };
  }
}

export const openPosition = async (
  publicClient: any, 
  chainId: number,
  data: any
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
      amount0Desired: parseUnits(token0Value, token0Decimals),
      amount1Desired: parseUnits(token1Value, token1Decimals),
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
      args: [params._params],
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
        result: "User rejected open position"
      };
    }
    return {
      success: false,
      result: "Unknown error"
    };
  }
}

export const getSwapInfo = async (tokenId: string, chainId: number) => {
  const res: any = await readContract(wagmiConfig, {
    abi: PositionManagerABI, 
    address: getManagerContractAddressFromChainId(chainId), 
    functionName: "getSwapInfo",
    args: [parseInt(tokenId)]
  })
  if (res.length !== 12) {
    console.log("Invalid data format from getSwapInfo");
    return null;
  }
  const [token0Address, token1Address, token0Decimals, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1, principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals] = res
  return {
    token0Address, token1Address, token0Decimals, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1, principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals
  }
}

export const closePosition = async (tokenId: string, chainId: number) => {
  const swapInfo = await getSwapInfo(tokenId, chainId)
  if (!swapInfo)
    return
  const { token0Address, token1Address, token0Decimals, token1Decimals, feesEarned0, feesEarned1, protocolFee0, protocolFee1, principal0, principal1, ownerAccountingUnit, ownerAccountingUnitDecimals } = swapInfo

  const totalAmount0ToSwap = parseInt((principal0 + feesEarned0 - protocolFee0).toString())
  const minBuyAmount0 = (totalAmount0ToSwap * 0.95).toFixed(0)

  const response = await fetch(`${PARASWAP_API_URL}&srcToken=${token0Address}&srcDecimals=${token0Decimals}&destToken=${ownerAccountingUnit}&destDecimals=${ownerAccountingUnitDecimals}&amount=${minBuyAmount0}&side=SELL&network=8453&slippage=5&userAddress=${getManagerContractAddressFromChainId(chainId)}`);
  const response_json = await response.json();
  if (response_json && response_json.txParams) {
    const { data } = response_json.txParams;
    const params = [
      BigInt(tokenId), 
      data.toString(),
      "0x",
      BigInt((response_json.priceRoute.destAmount * 0.95).toFixed(0)), 
      BigInt(0)
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
      console.log(error)
      if (error?.message?.includes("User rejected") || error?.code === 4001) {
        return {
          success: false,
          result: "User rejected open position"
        };
      }
      return {
        success: false,
        result: "Unknown error"
      };
    }
  }
}

export const fetchTokenPriceWithLoading = async (tokenAddress: string, setPrice: Function, setIsLoading: Function, chainId: number) => {
  const chainName = chainId === 1 ? "ethereum" : chainId === 8453 ? "base" : chainId === 42161 ? "arbitrum" : "not-supported"
  if (!tokenAddress)
    return
  setIsLoading(true);
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );
    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      const priceInfo = data.pairs.filter((pair: any) => pair.chainId === chainName || pair.dexId === "uniswap")
      setPrice(priceInfo[0].priceUsd);
    }
  } catch (error) {
    console.error("Error fetching token1 price:", error);
  } finally {
    setIsLoading(false);
  }
}

export const reArrangeTokensByContractAddress = (tokens: any[]) => {
  const token0Address = tokens[0].address;
  const token1Address = tokens[1].address;
  if (!token0Address || !token1Address || token0Address < token1Address)
    return tokens;
  else {
    const result = [tokens[1], tokens[0]];
    return result;
  }
}