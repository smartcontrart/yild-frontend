import { useAccount, useChainId } from "wagmi";

import { usePositionStaticInfo } from "@/hooks/use-position-static-info"
import { Skeleton } from "../ui/skeleton";
import { PoolCard } from "./pool-card";
import { usePositionFundsInfo } from "@/hooks/use-position-funds-info";
import { PositionCard } from "./position-card";
import { useAccountingUnit } from "@/hooks/use-accounting-unit";

export const PositionInfo = ({
  positionId,
  chainId
}: {
  positionId: number,
  chainId: number
}) => {
  const { isConnected, address } = useAccount();
  const { data: accountingUnit, isLoading: isAccountingUnitLoading } = useAccountingUnit(address || "", chainId)
  const { data: positionStaticInfo, isLoading: isPositionStaticInfoLoading } = usePositionStaticInfo(address || "", positionId)
  const { data: positionFundsInfo, isLoading: isPositionFundsInfoLoading } = usePositionFundsInfo(positionId, chainId)

  if (!isConnected || !isPositionStaticInfoLoading && !positionStaticInfo) 
    return (
      <>Position Not Found...</>
    )

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {
          (isPositionFundsInfoLoading || isAccountingUnitLoading) ?
          <Skeleton className="h-[426px] rounded-xl"/>
          :
          <PositionCard 
            accountingUnit={accountingUnit}
            positionId={positionId}
            data={{
              ...positionFundsInfo,
              tickLower: positionStaticInfo?.tickLower,
              tickUpper: positionStaticInfo?.tickUpper
            }} 
            chainId={chainId} 
          />
        }
        {
          isPositionStaticInfoLoading ? 
          <Skeleton className="h-[426px] rounded-xl"/>
          :
          <PoolCard 
            address={positionStaticInfo.poolAddress} 
            chainId={chainId} 
          />
        }
      </div>
    </>
  )
}