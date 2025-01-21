"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { getPositions } from "@/utils/request";
import { getDeployedContract, getSymbol } from "@/utils/functions";

export default function Home() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const resData = await getPositions(address as `0x${string}`, chainId)

        if (resData.length) {
          const contract = getDeployedContract(chainId)

          if (contract) {
            let temp: any = []
            for (let i = 0; i < resData.length; i++) {
              const symbol = await getSymbol(resData[i].tokenId, chainId, contract)
              if (symbol) {
                temp = [...temp, { symbol, lower: resData[i].lowerTick, upper: resData[i].upperTick }]
              }
            }
            setPositions(temp)
          }
        }
        setLoading(false)
      } catch (err) {
        console.log('error: ', err)
      }
    }

    fetchData();
  }, [])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Connect your wallet to continue</h2>
        <p className="text-muted-foreground">
          Please connect your wallet to view and manage your LP positions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Your Positions</h2>
        <Link href="/positions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Position
          </Button>
        </Link>
      </div>
      {
        loading ? <p className="text-center">please wait...</p> :
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {
              positions.length > 0 && positions.map((e:any, i) =>
                <Card className="p-6" key={i}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{e.symbol}</h3>
                        <p className="text-sm text-muted-foreground">Range: ${e.lower} ~ ${e.upper}</p>
                      </div>
                      <Link href="/positions/1">
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </div>
                    {/* <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">TVL</span>
                        <span className="font-medium">$10,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Unclaimed Fees</span>
                        <span className="font-medium">$50</span>
                      </div>
                    </div> */}
                  </div>
                </Card>)
            }
          </div>
      }
    </div>
  );
}
