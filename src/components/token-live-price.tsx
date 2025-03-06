import { Skeleton } from "./ui/skeleton"
import { useTokenPrice } from "@/hooks/use-token-price"

export default function TokenLivePrice({
  address,
  chainId
}: {
  address: `0x${string}`,
  chainId: number
}) {
  const { data, isLoading } = useTokenPrice(address, chainId)

  return (
    <div className="flex items-center mt-2">
      {(address && chainId && isLoading) ? (
        <span className="text-sm text-muted-foreground">
          <Skeleton className="w-[100px] h-[20px] rounded" />
        </span>
      ) : (
        <span className="text-sm ml-2">Current Price: ${data || "???"} USD</span>
      )}
    </div>
  )
}