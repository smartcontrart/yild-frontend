import { usePoolData } from "@/hooks/use-pool-data"
import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { getExplorerURLFromChainId } from "@/utils/constants"
import { tickToPrice, visualizeFeeTier } from "@/utils/functions"
import { useTokenPrice } from "@/hooks/use-token-price"
import { useTokenMeta } from "@/hooks/use-token-meta"
import { formatUnits } from "viem"

export const PositionCard = ({
  data,
  chainId
}: {
  data: any,
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
          <div className="flex flex-col gap-4">
            {
              (data.tickLower && data.tickUpper) ?
              <div>
                {tickToPrice(data.tickLower, token0.decimals, token1.decimals)} ~ {tickToPrice(data.tickUpper, token0.decimals, token1.decimals)}
              </div>
              : <></>
            }
            <div>
              {formatUnits(data.principal0, token0?.decimals)} {token0?.symbol}
            </div>
            <div>
              {formatUnits(data.principal1, token1?.decimals)} {token1?.symbol}
            </div>
            <div>
              {formatUnits(data.feesEarned0, token0?.decimals)} {token0?.symbol}
            </div>
            <div>
              {formatUnits(data.feesEarned1, token1?.decimals)} {token1?.symbol}
            </div>
            <div>
              {formatUnits(data.protocolFee0, token0?.decimals)} {token0?.symbol}
            </div>
            <div>
              {formatUnits(data.protocolFee1, token1?.decimals)} {token1?.symbol}
            </div>
            <div>
              TVL: {Number(formatUnits(data.principal0, token0?.decimals)) * Number(token0Price) + Number(formatUnits(data.principal1, token1?.decimals)) * Number(token1Price)} $$$
            </div>
            <div>
              Unclaimed Fees: {Number(formatUnits((BigInt(data.feesEarned0) - BigInt(data.protocolFee0)), token0?.decimals)) * Number(token0Price) + Number(formatUnits(BigInt(data.feesEarned1) - BigInt(data.protocolFee1), token1?.decimals)) * Number(token1Price)}
            </div>
            {/* <div>
              <a target="_blank" href={`${getExplorerURLFromChainId(chainId)}/address/${address}#multichain-portfolio`}>
                TVL: {Number(poolData.token0Balance) * Number(poolData.token0Price) + Number(poolData.token1Balance) * Number(poolData.token1Price)}
              </a>
            </div> */}
          </div>
        </Card>
      }
    </>
  )
}