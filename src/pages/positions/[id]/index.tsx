"use client";

import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card"; import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useAccount, useWriteContract } from "wagmi";
import { DEPLOYED_ADDRESS } from "@/constant";
import Abi from "@/abi/PositionManager.json";
import { useState } from "react";
import { ethers } from "ethers";

export default function PositionPage() {
  const { isConnected, address } = useAccount();
  const { writeContract } = useWriteContract()

  const [increaseToken0Amount, setIncreaseToken0Amount] = useState(0);
  const [increaseToken1Amount, setIncreaseToken1Amount] = useState(0);

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

  const collectFees = () => {
    writeContract({
      abi: Abi.abi,
      address: `0x${DEPLOYED_ADDRESS.base}`,
      functionName: 'collectFees',
      args: [
        positionId,
        address
      ],
    })
  }

  const increasePosition = () => {
    writeContract({
      abi: Abi.abi,
      address: `0x${DEPLOYED_ADDRESS.base}`,
      functionName: 'increaseLiquidity',
      args: [
        positionId,
        increaseToken0Amount,
        increaseToken1Amount
      ],
    })
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
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />Increase Position
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Increase Position</DialogTitle>
                  <DialogDescription>
                    Please input increase amounts.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Token0
                    </Label>
                    <Input type="number" className="col-span-3" onChange={e => setIncreaseToken0Amount(Number(e.target.value))} value={increaseToken0Amount}/>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Token1
                    </Label>
                    <Input type="number" className="col-span-3" onChange={e => setIncreaseToken1Amount(Number(e.target.value))} value={increaseToken1Amount}/>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={increasePosition}>Increase</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button className="w-full" variant="secondary" onClick={() => { }}>
              <MinusCircle className="mr-2 h-4 w-4" />
              Decrease Position
            </Button>
            <Button className="w-full" variant="destructive" onClick={() => { }}>
              <X className="mr-2 h-4 w-4" />
              Close Position
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button className="w-full" onClick={collectFees}>
              <Coins className="mr-2 h-4 w-4" />
              Collect Fees
            </Button>
            <Button className="w-full" onClick={() => { }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Compound Fees
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}