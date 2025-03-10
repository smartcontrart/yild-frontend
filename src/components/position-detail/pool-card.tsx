import { usePoolData } from "@/hooks/use-pool-data"
import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { getExplorerURLFromChainId } from "@/utils/constants"
import { visualizeFeeTier } from "@/utils/functions"

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
              {poolData.token0Balance} {poolData.token0.symbol}
            </div>
            <div>
              {poolData.token1Balance} {poolData.token1.symbol}
            </div>
            <div>
              {poolData.token0Price}
            </div>
            <div>
              {poolData.token1Price}
            </div>
            <div>
              <a target="_blank" href={`${getExplorerURLFromChainId(chainId)}/address/${address}#multichain-portfolio`}>
                TVL: {Number(poolData.token0Balance) * Number(poolData.token0Price) + Number(poolData.token1Balance) * Number(poolData.token1Price)}
              </a>
            </div>
          </div>
        </Card>
      }
    </>
  )
}