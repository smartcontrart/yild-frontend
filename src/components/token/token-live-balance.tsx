"use client"
import { Skeleton } from "@/components/ui/skeleton"

import { useTokenBalance } from "@/hooks/use-token-balance"
import { ERC20TokenInfo } from "@/utils/constants"
import { formatUnits } from "viem"

export default function TokenLiveBalance({
  userAddress,
  token,
}: {
  userAddress: `0x${string}` | undefined,
  token: ERC20TokenInfo,
}) {

  if (!userAddress || !token)
    return <></>

  const { data, isLoading } = useTokenBalance(userAddress, token.address)

  return (
    <div className="flex items-center mt-2">
      {(userAddress && token && isLoading) ? (
        <span className="text-sm text-muted-foreground">
          <Skeleton className="w-[100px] h-[20px] rounded" />
        </span>
      ) : (
        <span className="text-sm ml-2">Current balance: {formatUnits(data || BigInt(0), token.decimals).toString() || "0"} {token.symbol} </span>
      )}
    </div>
  )
}