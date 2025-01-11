"use client";

import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownUp,
  Coins,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";

export default function PositionPage() {
  const { isConnected } = useAccount();
  const router = useRouter()
  const positionId = router.query.id;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Connect your wallet to continue</h2>
        <p className="text-muted-foreground">
          Please connect your wallet to manage your LP position
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Manage Position #{positionId}</h2>
      </div>

      <Card className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-4">Position Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool</span>
                <span>ETH/USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee Tier</span>
                <span>0.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Range</span>
                <span>$1,800 - $2,200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Price</span>
                <span>$2,000</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Position Value</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVL</span>
                <span>$10,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token 0</span>
                <span>2.5 ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token 1</span>
                <span>5,000 USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unclaimed Fees</span>
                <span>$50</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button className="w-full" onClick={() => {}}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Increase Position
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => {}}>
              <MinusCircle className="mr-2 h-4 w-4" />
              Decrease Position
            </Button>
            <Button className="w-full" variant="destructive" onClick={() => {}}>
              <X className="mr-2 h-4 w-4" />
              Close Position
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button className="w-full" onClick={() => {}}>
              <Coins className="mr-2 h-4 w-4" />
              Collect Fees
            </Button>
            <Button className="w-full" onClick={() => {}}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Compound Fees
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}