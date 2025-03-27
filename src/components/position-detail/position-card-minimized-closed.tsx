import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { tickToPrice, visualizeFeeTier } from "@/utils/functions"
import { useTokenPrice } from "@/hooks/use-token-price"
import { useTokenMeta } from "@/hooks/use-token-meta"
import { HandCoins } from "lucide-react"
import { ERC20TokenInfo } from "@/utils/constants"

export const PositionCardMinimizedClosed = ({
  positionId,
  chainId,
  token0,
  token1,
  tickLower,
  tickUpper,
  feeTier
}: {
  positionId: number,
  chainId: number,
  token0: ERC20TokenInfo,
  token1: ERC20TokenInfo,
  tickLower: number,
  tickUpper: number,
  feeTier: number
}) => {
  if (!chainId)
    return <Skeleton className="h-[215px] rounded-xl" />
  
  const { data: token0Price, isLoading: token0PriceLoading} = useTokenPrice(token0.address, chainId)
  const { data: token1Price, isLoading: token1PriceLoading} = useTokenPrice(token1.address, chainId)
  
  return (
    <>
      {
        (!token0 || !token1) ?
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
          </div>
          <div className="flex flex-col gap-2">
            {
              (tickLower && tickUpper) ?
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-0">
                  {token0?.symbol} / {token1?.symbol} ({visualizeFeeTier(feeTier)})
                </div>
                <div>
                  $ {tickToPrice(tickLower, token0.decimals, token1.decimals).toFixed(5)} ~ $ {tickToPrice(tickUpper, token0.decimals, token1.decimals).toFixed(5)}
                </div>
              </div>
              : <></>
            }
            
            <div>
              Position Value : ---
            </div>
            <div>
              Fees Earned : ---
            </div>
          </div>
        </Card>
      }
    </>
  )
}