import { writeContract, waitForTransactionReceipt, readContract, getStorageAt } from "@wagmi/core";
import { config as wagmiConfig } from "@/components/providers";
import { erc20Abi, parseUnits } from "viem";
import { ERROR_CODES } from "./types";

export const getERC20TokenInfo = async (address: string, chainId: number) => {
  try {

    // consider proxy contract in the next issue

    // const res = await getStorageAt(wagmiConfig, {
    //   address: address as `0x${string}`,
    //   slot: "0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC"
    // })
    // console.log(res)
    // 0x0000000000000000000000000000000000000000000000000000000000000000

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
    return { name, symbol, decimals, address }    
  } catch (error) {
    console.log(error)
  }
  return null
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
  if (currentAllowance >= parseUnits(value, decimals))
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
      parseUnits(value, decimals),
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

export const getERC20TokenBalance = async (tokenAddress: string, holderAddress: string) => {
  if (tokenAddress && holderAddress) {
    const balance = await readContract(wagmiConfig, {
      abi: erc20Abi, 
      address: tokenAddress as `0x${string}`, 
      functionName: "balanceOf",
      args: [holderAddress as `0x${string}`]
    })
    return balance
  }
  return 0
}