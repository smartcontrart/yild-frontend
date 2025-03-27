"use client";

import { Button } from "@/components/ui/button";
import { Coins, Plus, WavesLadder } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { getClosedPositions, getPositions } from "@/utils/requests";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YildLoading } from "@/components/global/yild-loading";
import { PositionInfoFirstPage } from "@/components/position-detail/position-info-firstpage";
import { ClosedPosition } from "@/components/position-detail/closed-position";

export default function Home() {
  const { isConnected, address, isDisconnected } = useAccount();
  const chainId = useChainId();
  const [openedSwitch, setOpenedSwitch] = useState("opened")
  const [positions, setPositions] = useState([])
  const [closedPositions, setClosedPositions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const positionsData = await getPositions(address as `0x${string}`, chainId) || []
        setPositions(positionsData)
        const closedPostionsData = await getClosedPositions(address as `0x${string}`, chainId) || []
        setClosedPositions(closedPostionsData)
      } catch (err) {
        console.error('Error fetching positions:', err)
        setPositions([])
      } finally {
        setLoading(false)
      }
    }

    if (isConnected && address) {
      fetchData()
    }
  }, [address, chainId, isConnected, setLoading, setPositions])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center sm:min-h-[60vh] min-h-[80vh]">
        <YildLoading loading={!isDisconnected && !isConnected} />
        <h2 className="text-xl font-bold mb-4 text-center">Sign in with your wallet to continue</h2>
        <p className="text-muted-foreground sm:max-w-[60vw]">
        Yild Finance is a cutting-edge DeFi platform designed to automate Uniswap V3 liquidity provision. By leveraging smart algorithms and on-chain data, Yild Finance dynamically adjusts liquidity positions, optimizing yield generation while reducing impermanent loss. Whether you're a passive investor or an experienced liquidity provider, our platform simplifies LP management, allowing you to maximize profits with minimal effort.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <YildLoading loading={!isDisconnected && !isConnected} />
      <div className="flex justify-between items-center">
        <div className="flex flex-row gap-2">
          <WavesLadder className="self-center" />
          <h2 className="text-xl font-bold">Positions</h2>
        </div>
        <Link href="/positions/new">
          <Button variant="outline">
            <Coins className="mr-1 h-4 w-4" />
            Provide Liquidity
          </Button>
        </Link>
      </div>
      <Tabs
        value={openedSwitch}
        onValueChange={(value: string) => {
          setOpenedSwitch(value)
        }}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="opened">Open Positions</TabsTrigger>
          <TabsTrigger value="closed">Closed Positions</TabsTrigger>
        </TabsList>
      </Tabs>
      {
        loading ? 
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[215px] rounded-xl" />
            <Skeleton className="h-[215px] rounded-xl" />
            <Skeleton className="h-[215px] rounded-xl" />
            <Skeleton className="h-[215px] rounded-xl" />
            <Skeleton className="h-[215px] rounded-xl" />
            <Skeleton className="h-[215px] rounded-xl" />
          </div> :
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {
                (openedSwitch === "opened" && positions.length > 0) && positions.map((positionData:any, i) =>
                  <PositionInfoFirstPage
                    key={i}
                    positionId={positionData.tokenId}
                  />
                )
              }
              {
                (openedSwitch === "closed" && closedPositions.length > 0) && closedPositions.map((positionData:any, i) =>
                  <ClosedPosition
                    key={i}
                    positionId={positionData.tokenId}
                    poolAddress={positionData.poolAddress}
                    tickLower={positionData.lowerTick}
                    tickUpper={positionData.upperTick}
                  />
                )
              }
            </div>
            <div className="md:text-center md:mt-40">
              {
                openedSwitch === "opened" && positions.length === 0 ? (
                  <>
                  You do not have any {openedSwitch} positions at the moment. Provide liquidity to open a new position.
                  </>
                ) : openedSwitch === "closed" && closedPositions.length === 0 ? (
                  <>
                  You do not have any archieved positions.
                  </>
                ) : (<></>)
              }
            </div>
          </>
      }
    </div>
  );
}
