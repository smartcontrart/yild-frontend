"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Position cards will be mapped here */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">ETH/USDC</h3>
                <p className="text-sm text-muted-foreground">Range: $1,800 - $2,200</p>
              </div>
              <Link href="/positions/1">
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">TVL</span>
                <span className="font-medium">$10,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Unclaimed Fees</span>
                <span className="font-medium">$50</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}