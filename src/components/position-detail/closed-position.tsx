import { useAccount, useChainId } from "wagmi";

import { usePositionStaticInfo } from "@/hooks/use-position-static-info"
import { Skeleton } from "../ui/skeleton";
import { usePositionFundsInfo } from "@/hooks/use-position-funds-info";
import { PositionCardMinimized } from "./position-card-minimized";
import { Card } from "../ui/card"
import { HandCoins, Wrench } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { tickToPrice, visualizeFeeTier } from "@/utils/functions";
import { formatUnits } from "viem";
import { useTokenPrice } from "@/hooks/use-token-price";
import { useTokenMeta } from "@/hooks/use-token-meta";
import { usePoolData } from "@/hooks/use-pool-data";
import { useEffect } from "react";
import { PositionCardMinimizedClosed } from "./position-card-minimized-closed";

export const ClosedPosition = ({
  positionId,
  tickLower,
  tickUpper,
  poolAddress
}: {
  positionId: number,
  tickLower: number,
  tickUpper: number,
  poolAddress: string
}) => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { data: poolData, isLoading: poolDataLoading } = usePoolData(poolAddress, chainId)
  
  return (
    <>
      {
        (!isConnected || poolDataLoading) ?
        <Skeleton className="h-[215px] rounded-xl" />
        :
        <PositionCardMinimizedClosed
          positionId={positionId}
          chainId={chainId}
          token0={poolData.token0}
          token1={poolData.token1}
          tickLower={tickLower}
          tickUpper={tickUpper}
          feeTier={poolData.feeTier}
        />
      }
    </>
  )
}