import { useAccount, useChainId } from "wagmi";

import { usePositionStaticInfo } from "@/hooks/use-position-static-info"
import { Skeleton } from "../ui/skeleton";
import { usePositionFundsInfo } from "@/hooks/use-position-funds-info";
import { PositionCardMinimized } from "./position-card-minimized";

export const PositionInfoFirstPage = ({
  positionId,
  chainId
}: {
  positionId: number,
  chainId: number
}) => {
  const { isConnected, address } = useAccount();
  const { data: positionStaticInfo, isLoading: isPositionStaticInfoLoading } = usePositionStaticInfo(address || "", positionId)
  const { data: positionFundsInfo, isLoading: isPositionFundsInfoLoading } = usePositionFundsInfo(positionId, chainId)

  if (!isConnected || !isPositionStaticInfoLoading && !positionStaticInfo) 
    return (
      <>No pool unfortunately</>
    )

  return (
    <>
      <div >
        {
          (isPositionFundsInfoLoading || isPositionStaticInfoLoading) ?
          <Skeleton className="h-[215px] rounded-xl"/>
          :
          <PositionCardMinimized 
            positionId={positionId}
            staticInfo={positionStaticInfo}
            data={{
              ...positionFundsInfo,
              tickLower: positionStaticInfo?.tickLower,
              tickUpper: positionStaticInfo?.tickUpper
            }} 
            showManageButton={true}
          />
        }
      </div>
    </>
  )
}