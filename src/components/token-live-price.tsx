import { useEffect, useState } from "react"
import { Skeleton } from "./ui/skeleton"
import { fetchTokenPrice } from "@/utils/requests"
import { TOKEN_LIVE_PRICE_FETCH_INTERVAL } from "@/utils/constants"

export default function TokenLivePrice({
  address,
  chainId
}: {
  address: `0x${string}`,
  chainId: number
}) {
  const [loading, setLoading] = useState(true)
  const [price, setPrice] = useState(null)

  const refreshPrice = async () => {
    if (address && chainId) {
      setLoading(true)
      const livePrice = await fetchTokenPrice(address, chainId)
      setPrice(livePrice)
      setLoading(false)
    }
  }

  useEffect(() => {
    const intervalFunction = async () => {
      await refreshPrice();
      const interval = setInterval(() => refreshPrice(), TOKEN_LIVE_PRICE_FETCH_INTERVAL);
      return () => clearInterval(interval);
    }
    intervalFunction()
  }, [address, chainId])

  return (
    <div className="flex items-center mt-2">
      {(address && chainId && loading) ? (
        <span className="text-sm text-muted-foreground">
          <Skeleton className="w-[100px] h-[20px] rounded" />
        </span>
      ) : (
        <span className="text-sm ml-2">Current Price: ${price || "???"} USD</span>
      )}
    </div>
  )
}