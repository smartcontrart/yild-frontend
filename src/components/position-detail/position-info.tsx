import { useAccount, useChainId } from "wagmi";

import { usePositionStaticInfo } from "@/hooks/use-position-static-info"
import { Skeleton } from "../ui/skeleton";
import { PoolCard } from "./pool-card";
import { usePositionFundsInfo } from "@/hooks/use-position-funds-info";
import { PositionCard } from "./position-card";

export const PositionInfo = ({
  positionId
}: {
  positionId: number
}) => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { data: positionStaticInfo, isLoading: isPositionStaticInfoLoading } = usePositionStaticInfo(address || "", positionId, chainId)
  const { data: positionFundsInfo, isLoading: isPositionFundsInfoLoading } = usePositionFundsInfo(positionId, chainId)

  if (!isConnected || !isPositionStaticInfoLoading && !positionStaticInfo) 
    return (
      <>No pool unfortunately</>
    )

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {
          isPositionFundsInfoLoading ?
          <Skeleton className="w-[120px] h-[24px] rounded-l"/>
          :
          <PositionCard 
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
          <Skeleton className="w-[120px] h-[24px] rounded-l"/>
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