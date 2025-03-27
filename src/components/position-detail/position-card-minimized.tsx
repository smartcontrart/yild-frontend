import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { tickToPrice, visualizeFeeTier } from "@/utils/functions"
import { useTokenPrice } from "@/hooks/use-token-price"
import { useTokenMeta } from "@/hooks/use-token-meta"
import { formatUnits } from "viem"
import Link from "next/link"
import { Button } from "../ui/button"
import { HandCoins, Wrench } from "lucide-react"
import ERC20Image from "../common/erc20-image"
import { usePoolData } from "@/hooks/use-pool-data"

export const PositionCardMinimized = ({
  data,
  positionId,
  staticInfo,
  chainId,
  showManageButton
}: {
  data: any,
  positionId: number,
  staticInfo: any,
  chainId: number,
  showManageButton: boolean
}) => {
  if (!data || !chainId)
    return <Skeleton className="h-[215px] rounded-xl" />
  
  const { data: token0Price, isLoading: token0PriceLoading} = useTokenPrice(data.token0Address, chainId)
  const { data: token1Price, isLoading: token1PriceLoading} = useTokenPrice(data.token1Address, chainId)
  const { data: token0, isLoading: token0MetaDataLoading} = useTokenMeta(data.token0Address, chainId)
  const { data: token1, isLoading: token1MetaDataLoading} = useTokenMeta(data.token1Address, chainId)
  const { data: poolData, isLoading: poolDataLoading } = usePoolData(staticInfo.poolAddress, chainId)
  
  return (
    <>
      {
        (token0MetaDataLoading || token1MetaDataLoading || !token0 || !token1 || poolDataLoading) ?
        <Skeleton className="h-[215px] rounded-xl" />
        :
        <Card className="p-6">
          <div className="flex flex-row justify-between items-center mb-3">
            <div className="flex flex-row gap-1">
              <HandCoins />
              <h3 className="font-semibold">
                {positionId}
              </h3>
            </div>
            <Link href={`/positions/${positionId}`} target="_self">
              <Button className={showManageButton ? "" : "hidden"} variant="ghost" size="sm">
                <Wrench />
                <span className="font-semibold">Manage</span>
              </Button>
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {
              (data.tickLower && data.tickUpper) ?
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-0">
                  {/* <ERC20Image 
                    chainId={chainId}
                    tokenAddress={token0?.address}
                  />
                  <ERC20Image 
                    chainId={chainId}
                    tokenAddress={token1?.address}
                  /> */}
                  {token0?.symbol} / {token1?.symbol} ({visualizeFeeTier(poolData?.feeTier)})
                </div>
                <div>
                  $ {tickToPrice(data.tickLower, token0.decimals, token1.decimals).toFixed(2)} ~ $ {tickToPrice(data.tickUpper, token0.decimals, token1.decimals).toFixed(2)}
                </div>
              </div>
              : <></>
            }
            
            <div>
              Position Value : $ {(Number(formatUnits(data.principal0, token0?.decimals)) * Number(token0Price) + Number(formatUnits(data.principal1, token1?.decimals)) * Number(token1Price)).toFixed(3)}
            </div>
            <div>
              Fees Earned : $ {(Number(formatUnits((BigInt(data.feesEarned0) - BigInt(data.protocolFee0)), token0?.decimals)) * Number(token0Price) + Number(formatUnits(BigInt(data.feesEarned1) - BigInt(data.protocolFee1), token1?.decimals)) * Number(token1Price)).toFixed(5)}
            </div>
          </div>
          
        </Card>
      }
    </>
  )
}