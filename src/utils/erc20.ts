import { writeContract, waitForTransactionReceipt, readContract } from "@wagmi/core";
import { config as wagmiConfig, baseWagmiConfig, arbitrumWagmiConfig } from "@/components/global/providers";
import { erc20Abi, parseUnits } from "viem";
import { ERROR_CODES } from "./types";
import { ERC20TokenInfo } from "./constants";

export const getERC20TokenInfo = async (address: string, chainId: number): Promise<ERC20TokenInfo> => {
  try {
    const contractAddress = address as `0x${string}`
    const [name, symbol, decimals] = await Promise.all([
      readContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
        abi: erc20Abi, 
        address: contractAddress as `0x${string}`, 
        functionName: "name",
      }),
      readContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
        abi: erc20Abi, 
        address: contractAddress as `0x${string}`, 
        functionName: "symbol",
      }),
      readContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
        abi: erc20Abi, 
        address: contractAddress as `0x${string}`, 
        functionName: "decimals",
      })
    ])
    return { name, symbol, decimals, address: contractAddress }    
  } catch (error) {
    console.log(error)
  }
  return { name: "UNDEFINED", symbol: "UNDEFINED", decimals: 18, address: "0x00000000000000000000000000000000" } 
};

export const getCurrentAllowance = async (userAddress: string, tokenAddress: string, spender: string) => {
  if (!userAddress || !userAddress.startsWith("0x") || !spender || !spender.startsWith("0x") || !tokenAddress || !tokenAddress.startsWith("0x")) {
    return 0
  }
  const getCurrentAllowanceConfig = {
    abi: erc20Abi,
    address: tokenAddress as `0x${string}`,
    functionName: "allowance",
    args: [
      userAddress as `0x${string}`,
      spender as `0x${string}`,
    ],
  } as const;

  try {
    const allowance = await readContract(wagmiConfig, getCurrentAllowanceConfig);
    return allowance
  } catch (error: any) {
    console.log(error)
  }
  return 0
}

export const approveToken = async (userAddress: string, tokenAddress: string, spenderAddress: string, decimals: number, value: any) => {
  if (!userAddress || !userAddress.startsWith("0x")) {
    return {
      success: false,
      result: "Invalid user address"
    }
  }

  if (!tokenAddress || !tokenAddress.startsWith("0x")) {
    return {
      success: false,
      result: "Invalid token contract address"
    }
  }

  if (!spenderAddress || !spenderAddress.startsWith("0x")) {
    return {
      success: false,
      result: "Invalid spender address"
    }
  }

  const currentAllowance = await getCurrentAllowance(userAddress, tokenAddress, spenderAddress);
  if (currentAllowance && currentAllowance > 0 && currentAllowance >= parseUnits(value.toString(), decimals))
    return {
      success: true,
      result: "Already approved"
    }

  const tokenApprovalConfig = {
    abi: erc20Abi,
    address: tokenAddress as `0x${string}`,
    functionName: "approve",
    args: [
      spenderAddress as `0x${string}`,
      parseUnits(value.toString(), decimals),
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

export const getERC20TokenBalance = async (tokenAddress: string, holderAddress: string, chainId: number) => {
  if (tokenAddress && holderAddress) {
    const balance = await readContract(chainId === 8453 ? baseWagmiConfig : arbitrumWagmiConfig, {
      abi: erc20Abi, 
      address: tokenAddress as `0x${string}`, 
      functionName: "balanceOf",
      args: [holderAddress as `0x${string}`]
    })
    if (balance)
      return balance
  }
  return BigInt(0)
}