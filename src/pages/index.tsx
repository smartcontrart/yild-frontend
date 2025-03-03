"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { getPositions } from "@/utils/requests";
import { tickToPrice } from "@/utils/functions";
import { usePositionsStore } from "@/store/usePositionsStore";
import { Skeleton } from "@/components/ui/skeleton";
import { YildLoading } from "@/components/yild-loading";

export default function Home() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const positionsData = await getPositions(address as `0x${string}`, chainId) || []
        setPositions(positionsData)
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

  useEffect(() => {
    !hydrated && setHydrated(true)
  }, [])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center sm:min-h-[60vh] min-h-[80vh]">
        <YildLoading hydrated={hydrated} />
        <h2 className="text-xl font-bold mb-4 text-center">Sign in with your wallet to continue</h2>
        <p className="text-muted-foreground sm:max-w-[60vw]">
        Yild Finance is a cutting-edge DeFi platform designed to automate Uniswap V3 liquidity provision. By leveraging smart algorithms and on-chain data, Yild Finance dynamically adjusts liquidity positions, optimizing yield generation while reducing impermanent loss. Whether you're a passive investor or an experienced liquidity provider, our platform simplifies LP management, allowing you to maximize profits with minimal effort.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <YildLoading hydrated={hydrated} />
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Positions</h2>
        <Link href="/positions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Open
          </Button>
        </Link>
      </div>
      {
        loading ? 
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[125px] rounded-xl" />
            <Skeleton className="h-[125px] rounded-xl" />
            <Skeleton className="h-[125px] rounded-xl" />
            <Skeleton className="h-[125px] rounded-xl" />
            <Skeleton className="h-[125px] rounded-xl" />
            <Skeleton className="h-[125px] rounded-xl" />
          </div> :
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {
                positions.length > 0 && positions.map((e:any, i) =>
                  <Card className="p-6" key={i}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{e.symbol}</h3>
                          <p className="text-sm text-muted-foreground">${tickToPrice(e.tickLower, e.decimals0, e.decimals1).toFixed(2)} ~ ${tickToPrice(e.tickUpper, e.decimals0, e.decimals1).toFixed(2)}</p>
                        </div>
                        <Link href={`/positions/${e.tokenId}`}>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>)
                }
            </div>
            <div>
              {
                positions.length === 0 && (
                  <>
                  You do not have any open positions at the moment.
                  </>
                )
              }
            </div>
          </>
      }
    </div>
  );
}
