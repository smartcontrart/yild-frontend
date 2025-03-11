import Link from "next/link"
import { usePoolData } from "@/hooks/use-pool-data"
import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { getExplorerURLFromChainId } from "@/utils/constants"
import { formatNumber, visualizeFeeTier } from "@/utils/functions"
import { Link2 } from "lucide-react"

export const PoolCard = ({
  address,
  chainId
}: {
  address: string,
  chainId: number
}) => {
  if (!address || !chainId)
    return <Skeleton className="w-[120px] h-[80px] rounded-l" />
  
  const { data: poolData, isLoading: isPoolDataLoading } = usePoolData(address, chainId)
  
  return (
    <>
      {
        isPoolDataLoading ? 
        <Skeleton className="w-[120px] h-[80px] rounded-l" />
        :
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">
              {poolData.token0.symbol} / {poolData.token1.symbol} - {visualizeFeeTier(poolData.feeTier)} Pool
            </h3>
            <div>
              {Number(poolData.token0Balance).toFixed(2)} {poolData.token0.symbol}
            </div>
            <div>
              {Number(poolData.token1Balance).toFixed(2)} {poolData.token1.symbol}
            </div>
            <div>
              {poolData.token0.symbol} Price: $ {poolData.token0Price}
            </div>
            <div>
              {poolData.token1.symbol} Price: $ {poolData.token1Price}
            </div>
            <div className="flex flex-row gap-4">
              <div>
                TVL: $ {formatNumber(Number(poolData.token0Balance) * Number(poolData.token0Price) + Number(poolData.token1Balance) * Number(poolData.token1Price))}
              </div>
              <Link className="cursor-pointer" href={`${getExplorerURLFromChainId(chainId)}/address/${address}#multichain-portfolio`} target="_blank">
                <Link2 />
              </Link>
            </div>
          </div>
        </Card>
      }
    </>
  )
}