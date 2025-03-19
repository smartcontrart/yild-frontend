import Link from "next/link"
import { usePoolData } from "@/hooks/use-pool-data"
import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { getExplorerURLFromChainId } from "@/utils/constants"
import { formatNumber, visualizeFeeTier } from "@/utils/functions"
import { ExternalLink, Link2, SquareArrowOutUpRight, WavesLadder } from "lucide-react"

export const PoolCard = ({
  address,
  chainId
}: {
  address: string,
  chainId: number
}) => {
  if (!address || !chainId)
    return <Skeleton className="h-[426px] rounded-xl" />
  
  const { data: poolData, isLoading: isPoolDataLoading } = usePoolData(address, chainId)
  
  return (
    <>
      {
        isPoolDataLoading ? 
        <Skeleton className="h-[426px] rounded-xl" />
        :
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-2">
              <WavesLadder />
              <h3 className="font-semibold">
                {poolData.token0.symbol} / {poolData.token1.symbol} - {visualizeFeeTier(poolData.feeTier)} Pool
              </h3>
            </div>
            <div className="flex flex-col gap-4">
              <h3>
                In the Pool
              </h3>
              <div className="ml-4">
                {Number(poolData.token0Balance).toFixed(2)} {poolData.token0.symbol}
              </div>
              <div className="ml-8">
                $ {formatNumber(Number((poolData.token0Balance)) * Number(poolData.token0Price))}
              </div>
              <div className="ml-4">
                {Number(poolData.token1Balance).toFixed(2)} {poolData.token1.symbol}
              </div>
              <div className="ml-8">
                $ {formatNumber(Number((poolData.token1Balance)) * Number(poolData.token1Price))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h3>
                Total Value Locked in the Pool
              </h3>
              <div className="flex flex-row gap-2 ml-4">
                <div>
                  $ {formatNumber(Number(poolData.token0Balance) * Number(poolData.token0Price) + Number(poolData.token1Balance) * Number(poolData.token1Price))}
                </div>
                <Link className="cursor-pointer" href={`${getExplorerURLFromChainId(chainId)}/address/${address}#multichain-portfolio`} target="_blank">
                  <ExternalLink />
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h3>
                Current Price
              </h3>
              <div className="ml-4">
                {poolData.token0.symbol} : $ {poolData.token0Price}
              </div>
              <div className="ml-4">
                {poolData.token1.symbol} : $ {poolData.token1Price}
              </div>
            </div>
          </div>
        </Card>
      }
    </>
  )
}