import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { tickToPrice } from "@/utils/functions"
import { useTokenPrice } from "@/hooks/use-token-price"
import { useTokenMeta } from "@/hooks/use-token-meta"
import { formatUnits } from "viem"

export const PositionCard = ({
  data,
  positionId,
  chainId
}: {
  data: any,
  positionId: number,
  chainId: number
}) => {
  if (!data || !chainId)
    return <Skeleton className="w-[120px] h-[80px] rounded-l" />
  
  const { data: token0Price, isLoading: token0PriceLoading} = useTokenPrice(data.token0Address, chainId)
  const { data: token1Price, isLoading: token1PriceLoading} = useTokenPrice(data.token1Address, chainId)
  const { data: token0, isLoading: token0MetaDataLoading} = useTokenMeta(data.token0Address, chainId)
  const { data: token1, isLoading: token1MetaDataLoading} = useTokenMeta(data.token1Address, chainId)
  
  return (
    <>
      {
        (token0MetaDataLoading || token1MetaDataLoading || !token0 || !token1) ?
        <>Loading</>
        :
        <Card className="p-6">
          <h3 className="font-semibold">
            Position #{positionId}
          </h3>
          <div className="flex flex-col gap-4">
            {
              (data.tickLower && data.tickUpper) ?
              <div className="flex flex-col gap-4">
                <div>
                  {token0?.symbol} / {token1?.symbol} Price Range
                </div>
                <div>
                  {tickToPrice(data.tickLower, token0.decimals, token1.decimals).toFixed(4)} ~ {tickToPrice(data.tickUpper, token0.decimals, token1.decimals).toFixed(4)}
                </div>
              </div>
              : <></>
            }
            <div>
              Liquidity: {formatUnits(data.principal0, token0?.decimals)} {token0?.symbol}
            </div>
            <div>
              Liquidity: {formatUnits(data.principal1, token1?.decimals)} {token1?.symbol}
            </div>
            <div>
              FeesEarned: {formatUnits(data.feesEarned0, token0?.decimals)} {token0?.symbol}
            </div>
            <div>
              FeesEarned: {formatUnits(data.feesEarned1, token1?.decimals)} {token1?.symbol}
            </div>
            <div>
              ProtocolFee: {formatUnits(data.protocolFee0, token0?.decimals)} {token0?.symbol}
            </div>
            <div>
              ProtocolFee: {formatUnits(data.protocolFee1, token1?.decimals)} {token1?.symbol}
            </div>
            <div>
              TVL: $ {Number(formatUnits(data.principal0, token0?.decimals)) * Number(token0Price) + Number(formatUnits(data.principal1, token1?.decimals)) * Number(token1Price)}
            </div>
            <div>
              Unclaimed Fees: $ {Number(formatUnits((BigInt(data.feesEarned0) - BigInt(data.protocolFee0)), token0?.decimals)) * Number(token0Price) + Number(formatUnits(BigInt(data.feesEarned1) - BigInt(data.protocolFee1), token1?.decimals)) * Number(token1Price)}
            </div>
          </div>
        </Card>
      }
    </>
  )
}