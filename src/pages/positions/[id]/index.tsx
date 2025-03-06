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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { closePosition, increaseLiquidity, decreaseLiquidity, getPositionInfo, collectFees, compoundFees, getPositionDetail, getPoolInfo } from "@/utils/position-manage";
import { approveToken } from "@/utils/erc20";
import { fetchTokenPrice, sendClosePositionReport } from "@/utils/requests";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { tickToPrice } from "@/utils/functions";
import { getRequiredToken1FromToken0Amount, visualizeFeeTier } from "@/utils/functions";
import { parseUnits, formatUnits } from "viem";
import { Skeleton } from "@/components/ui/skeleton";
import { ERROR_CODES, POSITION_DETAIL_PAGE_STATE } from "@/utils/types";
import { getManagerContractAddressFromChainId } from "@/utils/constants";

export default function PositionPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const router = useRouter();

  const { toast } = useToast();

  const [pageStatus, setPageStatus] = useState(POSITION_DETAIL_PAGE_STATE.PAGE_LOADED);
  const [feesEarned0, setFeesEarned0] = useState(0)
  const [feesEarned1, setFeesEarned1] = useState(0)
  const [priceLower, setPriceLower] = useState(0)
  const [priceUpper, setPriceUpper] = useState(0)
  const [tickLower, setTickLower] = useState<number>(-600000)
  const [tickUpper, setTickUpper] = useState<number>(600000)
  const [decimals0, setDecimals0] = useState<number>(18)
  const [decimals1, setDecimals1] = useState<number>(18)
  const [token0Address, setToken0Address] = useState("")
  const [token1Address, setToken1Address] = useState("")
  const [feeTier, setFeeTier] = useState(0)
  const [token0CurrentPrice, setToken0CurrentPrice] = useState(0)
  const [token1CurrentPrice, setToken1CurrentPrice] = useState(0)
  const [principal0, setPrincipal0] = useState(0)
  const [principal1, setPrincipal1] = useState(0)
  const [unclaimedFees0, setUnclaimedFees0] = useState(0)
  const [unclaimedFees1, setUnclaimedFees1] = useState(0)
  const [token0Symbol, setToken0Symbol] = useState("")
  const [token1Symbol, setToken1Symbol] = useState("")
  const [increaseToken0Amount, setIncreaseToken0Amount] = useState("");
  const [increaseToken1Amount, setIncreaseToken1Amount] = useState("");
  const [decreaseRatio, setDecreaseRatio] = useState("0");
  const [positionDetailLoading, setPositionDetailLoading] = useState(true);
  const [swapInfoLoading, setSwapInfoLoading] = useState(true);
  const [priceInfoLoading, setPriceInfoLoading] = useState(true);
  const debouncedIncreaseToken0Amount = useDebounce(increaseToken0Amount, 1000)

  useEffect(() => {
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.POSITION_CLOSED)
      toast({
        variant: "default",
        title: "Info",
        description: "Successfully closed the position.",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.FEES_COLLECTED)
      toast({
        variant: "default",
        title: "Info",
        description: "Successfully collected fees.",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.LIQUIDITY_DECREASED)
      toast({
        variant: "default",
        title: "Info",
        description: "Successfully decreased liquidity.",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.LIQUIDITY_INCREASED)
      toast({
        variant: "default",
        title: "Info",
        description: "Successfully increased liquidity in the position.",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.POSITION_COMPOUNDED)
      toast({
        variant: "default",
        title: "Info",
        description: "Successfully compounded fees back into the position.",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.COMPOUND_POSITION_FAILED)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to compound fees back into the position.",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.USER_REJECTED)
      toast({
        variant: "destructive",
        title: "Error",
        description: "User rejected the transaction.",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.CLOSE_POSITION_FAILED)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to close the position.",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.COLLECT_FEES_FAILED)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to collect fees.",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.INCREASE_LIQUIDITY_FAILED)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to increase liquidity in the position.",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.DECREASE_LIQUIDITY_FAILED)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to decrease liquidity in the position.",
      })
  }, [pageStatus])

  const refreshPositionInfo = async () => {
    if (router.isReady) {
      if (!chainId || !router.query.id)
        return
      
      setSwapInfoLoading(true)
      const swapInfo = await getPositionInfo(Number(router.query.id), chainId)
      if (swapInfo) {
        setPrincipal0(Number(formatUnits(swapInfo?.principal0, decimals0)))
        setPrincipal1(Number(formatUnits(swapInfo?.principal1, decimals1)))
        setFeesEarned0(Number(formatUnits(swapInfo?.feesEarned0, decimals0)))
        setFeesEarned1(Number(formatUnits(swapInfo?.feesEarned1, decimals1)))
        setUnclaimedFees0(Number(formatUnits(BigInt(swapInfo?.feesEarned0 - swapInfo?.protocolFee0), decimals0)))
        setUnclaimedFees1(Number(formatUnits(BigInt(swapInfo?.feesEarned1 - swapInfo?.protocolFee1), decimals1)))
      }
      setSwapInfoLoading(false)
  
      setPriceInfoLoading(true)
      if (token0Address && token1Address) {
        const price0 = await fetchTokenPrice(token0Address, chainId)
        setToken0CurrentPrice(price0)
        const price1 = await fetchTokenPrice(token1Address, chainId)
        setToken1CurrentPrice(price1)
      }
      setPriceInfoLoading(false)
    }
  }

  useEffect(() => {
    if (router.isReady) {
      setPositionDetailLoading(true)
      const fetchPositionDetail = async () => {
        const positionDetail = await getPositionDetail(address as `0x${string}`, chainId, Number(router.query.id))
        setToken0Address(positionDetail?.token0Address)
        setToken1Address(positionDetail?.token1Address)
        setDecimals0(positionDetail?.decimals0)
        setDecimals1(positionDetail?.decimals1)
        setToken0Symbol(positionDetail?.symbol0)
        setToken1Symbol(positionDetail?.symbol1)
        setTickLower(positionDetail?.tickLower)
        setTickUpper(positionDetail?.tickUpper)
  
        if (positionDetail?.poolAddress) {
          const feeTierFromPool = await getPoolInfo(positionDetail?.poolAddress, chainId)
          setFeeTier(feeTierFromPool)
        }
        setPositionDetailLoading(false)
      }
      address && fetchPositionDetail()
    }
  }, [address, router.isReady, router.query.id])

  useEffect(() => {
    if (router.isReady && address && chainId && token0Address && token1Address) {
      const interval = setInterval(() => refreshPositionInfo(), 30000);
      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [address, chainId, router.isReady, router.query.id, token0Address, token1Address])

  useEffect(() => {
    if (tickLower && decimals0 && decimals1)
      setPriceLower(Number(Number(tickToPrice(tickLower, decimals0, decimals1)).toFixed(2)))
    if (tickUpper && decimals0 && decimals1)
      setPriceUpper(Number(Number(tickToPrice(tickUpper, decimals0, decimals1)).toFixed(2)))
  }, [tickLower, tickUpper, decimals0, decimals1])

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

  const increasePosition = async () => {
    try {
      setPageStatus(POSITION_DETAIL_PAGE_STATE.APPROVING_TOKENS);

      const { success: approveToken0Success } = await approveToken(address as `0x${string}`, token0Address as `0x${string}`, getManagerContractAddressFromChainId(chainId), decimals0, increaseToken0Amount)
      if (!approveToken0Success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.TOKEN_APPROVE_FAILED)
        return
      }
      const { success: approveToken1Success } = await approveToken(address as `0x${string}`, token1Address as `0x${string}`, getManagerContractAddressFromChainId(chainId), decimals1, increaseToken1Amount)
      if (!approveToken1Success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.TOKEN_APPROVE_FAILED)
        return
      }

      setPageStatus(POSITION_DETAIL_PAGE_STATE.INCREASING_LIQUIDITY);
      const { success: addLiquiditySuccess, result } = await increaseLiquidity(chainId, {
        tokenId: Number(router.query.id),
        amount0: increaseToken0Amount,
        amount1: increaseToken1Amount,
        decimals0,
        decimals1
      })
      if (addLiquiditySuccess) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.LIQUIDITY_INCREASED)
      }
      else if (result === ERROR_CODES.USER_REJECTED) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.USER_REJECTED)
      }
      else {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.INCREASE_LIQUIDITY_FAILED)
      }
    } catch(err) {
      console.log(err)
      setPageStatus(POSITION_DETAIL_PAGE_STATE.INCREASE_LIQUIDITY_FAILED)
      return
    }
  };

  const decreasePosition = async () => {
    const amountInBPS = parseInt((parseFloat(decreaseRatio) * 100).toFixed(0))
    try {
      setPageStatus(POSITION_DETAIL_PAGE_STATE.DECREASING_LIQUIDITY);
      const { success, result } = await decreaseLiquidity(Number(router.query.id), chainId, amountInBPS);
      if (success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.LIQUIDITY_DECREASED)
      }
      else if (result === ERROR_CODES.USER_REJECTED) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.USER_REJECTED)
      }
      else {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.DECREASE_LIQUIDITY_FAILED)
      }
    } catch (error) {
      console.log(error)
      setPageStatus(POSITION_DETAIL_PAGE_STATE.DECREASE_LIQUIDITY_FAILED)
    }
  };

  const confirmClosePosition = async () => {
    try {
      setPageStatus(POSITION_DETAIL_PAGE_STATE.CLOSING_POSITION);
      const { success, result } = await closePosition(Number(router.query.id), chainId);
      if (success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.POSITION_CLOSED)
        await sendClosePositionReport(address as `0x${string}`, chainId, Number(router.query.id))
      }
      else if (result === ERROR_CODES.USER_REJECTED) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.USER_REJECTED)
      }
      else {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.CLOSE_POSITION_FAILED)
      }
    } catch (error) {
      console.log(error)
      setPageStatus(POSITION_DETAIL_PAGE_STATE.CLOSE_POSITION_FAILED)
    }
  };

  const confirmCollectFees = async () => {
    try {
      setPageStatus(POSITION_DETAIL_PAGE_STATE.COLLECTING_FEES);
      const { success, result } = await collectFees(Number(router.query.id), chainId, address || "")
      if (success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.FEES_COLLECTED)
      }
      else if (result === ERROR_CODES.USER_REJECTED) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.USER_REJECTED)
      }
      else {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.COLLECT_FEES_FAILED)
      }
    } catch (error) {
      console.log(error)
      setPageStatus(POSITION_DETAIL_PAGE_STATE.COLLECT_FEES_FAILED)
    }
  }

  const compoundPosition = async () => {
    try {
      const { success, result } = await compoundFees(Number(router.query.id), chainId)
      if (success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.POSITION_COMPOUNDED)
      }
      else if (result === ERROR_CODES.USER_REJECTED) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.USER_REJECTED)
      }
      else {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.COMPOUND_POSITION_FAILED)
      }
    } catch (error) {
      console.log(error)
      setPageStatus(POSITION_DETAIL_PAGE_STATE.COMPOUND_POSITION_FAILED)
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Position #{Number(router.query.id)}</h2>
      </div>

      <Card className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-4">- Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool</span>
                {
                  positionDetailLoading ? 
                    <span><Skeleton className="w-[120px] h-[24px] rounded-l"/></span>
                    :
                    <span>{token0Symbol} / {token1Symbol}</span>
                }
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee Tier</span>
                {
                  positionDetailLoading ? 
                    <span><Skeleton className="w-[60px] h-[24px] rounded-l"/></span>
                    :
                    <span>{visualizeFeeTier(feeTier)}</span>
                }
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Range</span>
                {
                  priceInfoLoading ? 
                    <span><Skeleton className="w-[180px] h-[24px] rounded-l"/></span>
                    :
                    <span>{priceLower} ~ {priceUpper}</span>
                }
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{token0Symbol} Price</span>
                {
                  priceInfoLoading ? 
                    <span><Skeleton className="w-[180px] h-[24px] rounded-l"/></span>
                    :
                    <span>{token0CurrentPrice} USD</span>
                }
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{token1Symbol} Price</span>
                {
                  priceInfoLoading ? 
                    <span><Skeleton className="w-[180px] h-[24px] rounded-l"/></span>
                    :
                    <span>{token1CurrentPrice} USD</span>
                }
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Position Value</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVL</span>
                {
                  swapInfoLoading || priceInfoLoading ? 
                    <span><Skeleton className="w-[180px] h-[24px] rounded-l"/></span>
                    :
                    <span>$ {Number(principal0 * token0CurrentPrice + principal1 * token1CurrentPrice).toFixed(2)}</span>
                }
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{token0Symbol}</span>
                {
                  swapInfoLoading ? 
                    <span><Skeleton className="w-[180px] h-[24px] rounded-l"/></span>
                    :
                    <span>{Number(principal0).toFixed(3)} {token0Symbol}</span>
                }
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{token1Symbol}</span>
                {
                  swapInfoLoading ? 
                    <span><Skeleton className="w-[180px] h-[24px] rounded-l"/></span>
                    :
                    <span>{Number(principal1).toFixed(3)} {token1Symbol}</span>
                }
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unclaimed Fees</span>
                {
                  swapInfoLoading ? 
                    <span><Skeleton className="w-[180px] h-[24px] rounded-l"/></span>
                    :
                    <span>{Number(unclaimedFees0).toFixed(5)} {token0Symbol}</span>
                }
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground"></span>
                {
                  swapInfoLoading ? 
                    <span><Skeleton className="w-[180px] h-[24px] rounded-l"/></span>
                    :
                    <span>{Number(unclaimedFees1).toFixed(5)} {token1Symbol}</span>
                }
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

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <MinusCircle className="mr-2 h-4 w-4" />
                  Decrease Position
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Decrease Position</DialogTitle>
                  <DialogDescription>
                    Please input decrease amounts in terms of %.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Decrease %
                    </Label>
                    <Input
                      type="number"
                      className="col-span-3"
                      onChange={(e) =>
                        setDecreaseRatio(e.target.value)
                      }
                      value={decreaseRatio}
                    />
                  </div>
                  <div>
                    You are going to decrease {decreaseRatio}% of your position.
                  </div>
                </div>
                <DialogFooter>
                  <Button disabled={!decreaseRatio || !parseFloat(decreaseRatio) ||parseFloat(decreaseRatio) < 0.1 || parseFloat(decreaseRatio) > 99} onClick={decreasePosition}>Decrease</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                <Button className="w-full">
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
                    </div>
                    <div className="text-center">
                      { feesEarned1 } { token1Symbol }
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
      <AlertDialog
        open={
          pageStatus === POSITION_DETAIL_PAGE_STATE.APPROVING_TOKENS ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.CLOSING_POSITION ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.COLLECTING_FEES ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.COMPOUNDING_POSITION ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.DECREASING_LIQUIDITY ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.INCREASING_LIQUIDITY
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Status</AlertDialogTitle>
            <AlertDialogDescription>
              {pageStatus === POSITION_DETAIL_PAGE_STATE.APPROVING_TOKENS
                ? "Approving tokens, proceed with your wallet."
                : pageStatus === POSITION_DETAIL_PAGE_STATE.CLOSING_POSITION
                ? "Closing your position, proceed with your wallet."
                : pageStatus === POSITION_DETAIL_PAGE_STATE.COLLECTING_FEES
                ? "Collecting fees earned, proceed with your wallet."
                : pageStatus === POSITION_DETAIL_PAGE_STATE.COMPOUNDING_POSITION
                ? "Compounding your position, proceed with your wallet."
                : pageStatus === POSITION_DETAIL_PAGE_STATE.DECREASING_LIQUIDITY
                ? "Decreasing liquidity, proceed with your wallet."
                : pageStatus === POSITION_DETAIL_PAGE_STATE.INCREASING_LIQUIDITY
                ? "Increasing liquidity, proceed with your wallet."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
