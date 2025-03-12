import { useTokenMeta } from "@/hooks/use-token-meta"
import { formatUnits } from "viem"

export default function FeeCollectEstimator({
  positionId,
  chainId,
  fundsInfo
}: {
  positionId: number,
  chainId: number,
  fundsInfo: any
}) {

  const { data: token0, isLoading: isLoadingToken0Meta} = useTokenMeta(fundsInfo?.token0Address, chainId)
  const { data: token1, isLoading: isLoadingToken1Meta} = useTokenMeta(fundsInfo?.token1Address, chainId)

  if (!positionId || !chainId || !token0 || !token1 || !fundsInfo || !fundsInfo.token0Address || !fundsInfo.token1Address)
    return (
      <>Loading Estimation...</>
    )
  
  return (
    <>
      <div>
        {formatUnits((BigInt(fundsInfo.feesEarned0) - BigInt(fundsInfo.protocolFee0)), token0.decimals)} {token0?.symbol}
      </div>
      <div>
        {formatUnits((BigInt(fundsInfo.feesEarned1) - BigInt(fundsInfo.protocolFee1)), token1.decimals)} {token1?.symbol}
      </div>
    </>
  )
}