import { ethers } from "ethers";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "wagmi/chains";
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { config as wagmiConfig } from "@/components/providers";
import { POSITION_MANAGER_CONTRACT_ADDRESS } from "./constants";
import { PositionManagerABI } from "@/abi/PositionManager";
import { erc20Abi, parseUnits } from "viem";

export const getDeployedContract = (chainId: number) => {
  if (chainId == 8453) {
    //base
    const rpcUrl = base.rpcUrls.default.http[0];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      POSITION_MANAGER_CONTRACT_ADDRESS["BASE"],
      PositionManagerABI,
      provider
    );
    return contract;
  }
};

export const getTokenContract = (address: string, chainId: number) => {
  if (chainId == 8453) {
    //base
    const rpcUrl = base.rpcUrls.default.http[0];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(address, erc20Abi, provider);
    return contract;
  }
};

export const getSymbolsAndDecimals = async (
  tokenId: number,
  chainId: number,
  contract: any
) => {
  try {
    const info = await contract.getSwapInfo(tokenId);
    const token0Contract = getTokenContract(info[0], chainId);
    const token1Contract = getTokenContract(info[1], chainId);

    if (token0Contract && token1Contract) {
      const symbol0 = await token0Contract.symbol();
      const symbol1 = await token1Contract.symbol();

      const decimals0 = parseInt(await token0Contract.decimals());
      const decimals1 = parseInt(await token1Contract.decimals());

      return { symbol0, symbol1, decimals0, decimals1 };
    }
  } catch (err) {
    console.log("getSwapInfo error: ", err);
  }
  return { symbol0: "", symbol1: "", decimals0: 0, decimals1: 0 };
};

export const approveToken = async (address: string, spender: string, decimal: number, value: any) => {
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
      parseUnits(value, decimal || 18),
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
    token0Decimal,
    token1Decimal
  } = data

  const params = {
    _params: {
      token0: token0Address,
      token1: token1Address,
      fee: parseInt(feeTier),
      tickUpper: parseInt(tickUpper),
      tickLower: parseInt(tickLower),
      amount0Desired: parseUnits(token0Value, token0Decimal),
      amount1Desired: parseUnits(token1Value, token1Decimal),
      amount0Min: 0,
      amount1Min: 0,
      recipient: POSITION_MANAGER_CONTRACT_ADDRESS.BASE,
      deadline: deadlineTimestamp,
    },
  };

  try {
    const hash = await writeContract(wagmiConfig, {
      abi: PositionManagerABI,
      address: POSITION_MANAGER_CONTRACT_ADDRESS.BASE,
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

export const fetchTokenPriceWithLoading = async (tokenAddress: string, setPrice: Function, setIsLoading: Function) => {
  if (!tokenAddress)
    return
  setIsLoading(true);
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );
    const data = await response.json();

    if (data.pairs && data.pairs[0]) {
      setPrice(data.pairs[0].priceUsd);
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