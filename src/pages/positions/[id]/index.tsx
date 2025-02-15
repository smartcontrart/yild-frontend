"use client";

import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownUp,
  Coins,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { useState, useEffect } from "react";
import { approveToken, closePosition, increaseLiquidity, decreaseLiquidity, getManagerContractAddressFromChainId, getSwapInfo, collectFees, compoundFees, getPositionDetail, getPoolInfo } from "@/utils/contract";
import { fetchTokenPrice } from "@/utils/requests";
import { useDebounce } from "@/hooks/useDebounce";
import { tickToPrice } from "@/utils/functions";
import { getRequiredToken1FromToken0Amount } from "@/utils/functions";
import { parseUnits, formatUnits } from "viem";

export default function PositionPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  // const { positions } = usePositionsStore();
  const router = useRouter();
  const tokenId = Number(router.query.id);
  // const position = positions.find((p) => p.tokenId === Number(positionId)) || {};

  // const { tokenId, tickLower, tickUpper, decimals0, decimals1, token0Address, token1Address, symbol0, symbol1 } = position

  const [pageStatus, setPageStatus] = useState("loaded");
  const [feesEarned0, setFeesEarned0] = useState("")
  const [feesEarned1, setFeesEarned1] = useState("")
  const [priceLower, setPriceLower] = useState(0)
  const [priceUpper, setPriceUpper] = useState(0)
  const [tickLower, setTickLower] = useState<number>(-600000)
  const [tickUpper, setTickUpper] = useState<number>(600000)
  const [decimals0, setDecimals0] = useState<number>(18)
  const [decimals1, setDecimals1] = useState<number>(18)
  const [token0Address, setToken0Address] = useState("")
  const [token1Address, setToken1Address] = useState("")
  const [feeTier, setFeeTier] = useState(1400)
  const [token0CurrentPrice, setToken0CurrentPrice] = useState(0)
  const [token1CurrentPrice, setToken1CurrentPrice] = useState(0)
  const [unclaimedFees0, setUnclaimedFees0] = useState(0)
  const [unclaimedFees1, setUnclaimedFees1] = useState(0)
  const [token0Symbol, setToken0Symbol] = useState("")
  const [token1Symbol, setToken1Symbol] = useState("")
  const [increaseToken0Amount, setIncreaseToken0Amount] = useState("");
  const [increaseToken1Amount, setIncreaseToken1Amount] = useState("");
  const debouncedIncreaseToken0Amount = useDebounce(increaseToken0Amount, 1000)





  const refreshPositionInfo = async () => {
    const swapInfo = await getSwapInfo(tokenId, chainId)
    if (swapInfo) {
      setFeesEarned0(swapInfo?.feesEarned0)
      setFeesEarned1(swapInfo?.feesEarned1)
      setUnclaimedFees0(swapInfo?.feesEarned0 - swapInfo?.protocolFee0)
      setUnclaimedFees1(swapInfo?.feesEarned1 - swapInfo?.protocolFee1)
    }

    if (token0Address && token1Address) {
      const price0 = await fetchTokenPrice(token0Address, chainId)
      setToken0CurrentPrice(price0)
      const price1 = await fetchTokenPrice(token1Address, chainId)
      setToken1CurrentPrice(price1)
    }
  }

  useEffect(() => {
    const fetchPositionDetail = async () => {
      const positionDetail = await getPositionDetail(address as `0x${string}`, chainId, tokenId)
      setToken0Address(positionDetail?.token0Address)
      setToken1Address(positionDetail?.token1Address)
      setDecimals0(positionDetail?.decimals0)
      setDecimals1(positionDetail?.decimals1)
      setToken0Symbol(positionDetail?.symbol0)
      setToken1Symbol(positionDetail?.symbol1)

      if (positionDetail?.poolAddress) {
        const feeTierFromPool = await getPoolInfo(positionDetail?.poolAddress, chainId)
        setFeeTier(feeTierFromPool)
      }
    }
    tokenId && address && fetchPositionDetail()
  }, [tokenId, address])

  useEffect(() => {
    const interval = setInterval(() => refreshPositionInfo(), 30000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // useEffect(() => {
  //   const getTokensMetadata = async () => {
  //     const token0Metadata = await getTokenMetadataFromCoinGecko(token0Address, chainId)
  //     setToken0(token0Metadata)
  //     const token1Metadata = await getTokenMetadataFromCoinGecko(token1Address, chainId)
  //     setToken1(token1Metadata)
  //   }
  //   getTokensMetadata()
  // }, [])

  useEffect(() => {
    if (!debouncedIncreaseToken0Amount)
      return
    const setValidToken1Amount = async () => {
      const priceLower = tickToPrice(tickLower, decimals0, decimals1)
      const priceUpper = tickToPrice(tickUpper, decimals0, decimals1)
      const token0Price = await fetchTokenPrice(token0Address, chainId)
      const token1Price = await fetchTokenPrice(token1Address, chainId)
      const newToken1Amount = getRequiredToken1FromToken0Amount(
        parseFloat(token0Price || "0.0") / parseFloat(token1Price || "0.0"),
        parseFloat(priceLower),
        parseFloat(priceUpper),
        debouncedIncreaseToken0Amount.toString() || "0",
        decimals1 || 18
      );
      setIncreaseToken1Amount(newToken1Amount)
    }
    setValidToken1Amount()
  }, [debouncedIncreaseToken0Amount]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">
          Connect your wallet to continue
        </h2>
        <p className="text-muted-foreground">
          Please connect your wallet to manage your LP position
        </p>
      </div>
    );
  }

  const getUnCollectedFees = async () => {
    const swapInfo = await getSwapInfo(tokenId, chainId)
    console.log(swapInfo)
    if (!swapInfo)
      return null
    setFeesEarned0(formatUnits((swapInfo.feesEarned0).toString(), decimals0).toString())
    setFeesEarned1(formatUnits((swapInfo.feesEarned1).toString(), decimals1).toString())
  };

  const increasePosition = async () => {
    try {
      setPageStatus("approving");
      
      const { success: approveToken0Success } = await approveToken(token0Address as `0x${string}`, getManagerContractAddressFromChainId(chainId), decimals0, increaseToken0Amount)
      if (!approveToken0Success) {
        setPageStatus("approve token failed")
        return
      }
      const { success: approveToken1Success } = await approveToken(token1Address as `0x${string}`, getManagerContractAddressFromChainId(chainId), decimals1, increaseToken1Amount)
      if (!approveToken1Success) {
        setPageStatus("approve token failed")
        return
      }

      setPageStatus("adding");
      const { success: addLiquiditySuccess, result } = await increaseLiquidity(chainId, {
        tokenId,
        amount0: increaseToken0Amount,
        amount1: increaseToken1Amount,
        decimals0,
        decimals1
      })
      if (!addLiquiditySuccess) {
        setPageStatus("add liquidity failed")
        return
      }
      setPageStatus("add liquidity success")
    } catch(err) {
      console.log(err)
      setPageStatus("error while add liquidity")
      return
    }
  };

  const decreasePosition = async () => {
    const amountInBPS = 500 // 18%
    try {
      await decreaseLiquidity(tokenId, chainId, amountInBPS);
    } catch (error) {
      console.log(error)
    }
  };

  const confirmClosePosition = async () => {
    try {
      await closePosition(tokenId, chainId);
    } catch (error) {
      console.log(error)
    }
  };

  const confirmCollectFees = async () => {
    try {
      await collectFees(tokenId, chainId, address || "")
    } catch (error) {
      console.log(error)
    }
  }

  const compoundPosition = async () => {
    try {
      await compoundFees(tokenId, chainId)
    } catch (error) {
      console.log(error)
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Manage Position #{tokenId}</h2>
      </div>

      <Card className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-4">Position Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool</span>
                <span>{token0Symbol} / {token1Symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee Tier</span>
                {/* <span>{visualizeFeeTier(feeTier)}</span> */}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Range</span>
                <span>{priceLower} ~ {priceUpper}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Price</span>
                <span>{token0Symbol}: {token0CurrentPrice} USD</span>
                <span>{token1Symbol}: {token1CurrentPrice} USD</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Position Value</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVL</span>
                <span>wtf is TVL ?</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token 0</span>
                <span>{token0Symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token 1</span>
                <span>{token1Symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unclaimed Fees</span>
                <span>{token0Symbol}: {unclaimedFees0}</span>
                <span>{token1Symbol}: {unclaimedFees1}</span>
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
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Increase Position
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
                      {token0Symbol}
                    </Label>
                    <Input
                      type="number"
                      className="col-span-3"
                      onChange={(e) =>
                        setIncreaseToken0Amount(e.target.value)
                      }
                      value={increaseToken0Amount}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      {token1Symbol}
                    </Label>
                    <Input
                      type="number"
                      className="col-span-3"
                      onChange={(e) =>
                        setIncreaseToken1Amount(e.target.value)
                      }
                      value={increaseToken1Amount}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={increasePosition}>Increase</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              className="w-full"
              variant="secondary"
              onClick={decreasePosition}
            >
              <MinusCircle className="mr-2 h-4 w-4" />
              Decrease Position
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <X className="mr-2 h-4 w-4" />
                  Close Position
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Are you Sure?</DialogTitle>
                </DialogHeader>
                <div className="text-center">
                  <Button className="px-8" onClick={confirmClosePosition}>
                    Yes
                  </Button>
                  <DialogClose asChild>
                    <Button className="px-8 ml-4" variant="secondary">
                      No
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={getUnCollectedFees}>
                <Coins className="mr-2 h-4 w-4" />
                  Collect Fees
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Collect Fees Earned {feesEarned0}</DialogTitle>
                  <DialogDescription>
                    <div className="text-center">
                      { feesEarned0 } { token0Symbol }

                      {/* <Input
                        type="number"
                        className="col-span-3"
                        onChange={(e) => setFeesEarned0(e.target.value)}
                        value={feesEarned0}
                      /> */}
                    </div>
                    <div className="text-center">
                      { feesEarned1 } { token1Symbol }
                      {/* <Input
                        type="number"
                        className="col-span-3"
                        onChange={(e) => setFeesEarned1(e.target.value)}
                        value={feesEarned1}
                      /> */}
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <div className="text-center">
                    <Button className="px-8" onClick={confirmCollectFees}>
                      Yes
                    </Button>
                    <DialogClose asChild>
                      <Button className="px-8 ml-4" variant="secondary">
                        No
                      </Button>
                    </DialogClose>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button className="w-full" onClick={compoundPosition}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Compound Fees
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
