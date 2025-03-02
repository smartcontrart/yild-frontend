"use client";

import {
  useAccount,
  useChainId,
  usePublicClient,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TokenSelector } from "@/components/token-selector";
import { useState, useEffect } from "react";
import { priceToTick, tickToPrice, nearestValidTick, reArrangeTokensByContractAddress } from "@/utils/functions";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  getRequiredToken0FromToken1Amount,
  getRequiredToken1FromToken0Amount,
} from "../../../utils/functions";
import { approveToken, openPosition, getManagerContractAddressFromChainId, getAvailablePools, getERC20TokenBalance } from "@/utils/contract";
import { fetchTokenPriceWithLoading } from "@/utils/requests"
import { FeeTier } from "@/components/fee-tier";
import { CREATE_POSITION_PAGE_STATE } from "@/utils/page-states";
import { INVALID_FEE_TIER, VALID_FEE_TIERS } from "@/utils/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnits, parseEther, parseUnits } from "viem";

const formSchema = z.object({
  token0: z.string().min(1, "Token is required"),
  token1: z.string().min(1, "Token is required"),
  token0Address: z.string().optional(),
  token1Address: z.string().optional(),
  feeTier: z.string().min(1, "Fee tier is required"),
  minPrice: z.string().min(1, "Min price is required"),
  maxPrice: z.string().min(1, "Max price is required"),
  amount0: z.string().min(1, "Token amount is required"),
  amount1: z.string().min(1, "Token amount is required"),
  tickLower: z.string().min(1, "Tick lower is required"),
  tickUpper: z.string().min(1, "Tick upper is required"),
});

export default function NewPositionPage() {
  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token0: "",
      token1: "",
      token0Address: "",
      token1Address: "",
      feeTier: "3000",
      minPrice: "",
      maxPrice: "",
      tickLower: "",
      tickUpper: "",
      amount0: "",
      amount1: "",
    },
  });

  const [pageStatus, setPageStatus] = useState<string | null>(CREATE_POSITION_PAGE_STATE.PAGE_LOADING);
  const [token0Price, setToken0Price] = useState<string | null>(null);
  const [token1Price, setToken1Price] = useState<string | null>(null);
  const [token0Amount, setToken0Amount] = useState<string | null>(null);
  const [token1Amount, setToken1Amount] = useState<string | null>(null);
  const [token0Address, setToken0Address] = useState<string | null>(null);
  const [token1Address, setToken1Address] = useState<string | null>(null);
  const [token0Decimals, setToken0Decimals] = useState<number | null>(null);
  const [token1Decimals, setToken1Decimals] = useState<number | null>(null);
  const [token0Balance, setToken0Balance] = useState("");
  const [token1Balance, setToken1Balance] = useState("");
  const [isLoadingToken0Balance, setIsLoadingToken0Balance] = useState(false);
  const [isLoadingToken1Balance, setIsLoadingToken1Balance] = useState(false);
  const [token0Name, setToken0Name] = useState<string | null>(null);
  const [token1Name, setToken1Name] = useState<string | null>(null);
  const [isLoadingToken0Price, setIsLoadingToken0Price] = useState(false);
  const [isLoadingToken1Price, setIsLoadingToken1Price] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [tickLowerInput, setTickLowerInput] = useState("");
  const [tickUpperInput, setTickUpperInput] = useState("");
  const [feeTier, setFeeTier] = useState<number>(INVALID_FEE_TIER);
  const [availableFeeTiers, setAvailableFeeTiers] = useState<any[]>([])
  const [currentTab, setCurrentTab] = useState<"zpo" | "opz">("zpo");

  const debouncedMinPrice = useDebounce(minPriceInput, 1000);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 1000);

  const setNearestValidPrice = (debouncedValue: string, isMinOrMax: boolean) => {
    if (!debouncedValue || isNaN(Number(debouncedValue))) return;
    let numericPrice = Number(debouncedValue);
    const [token0, token1] = getReArrangedTokens();
    if (
      (token0.address === token0Address && currentTab === "opz") ||
      (token0.address !== token0Address && currentTab === "zpo")
    )
      numericPrice = 1 / numericPrice;

    const tick = priceToTick(
      numericPrice,
      token0.decimals,
      token1.decimals
    );
    const validTick = nearestValidTick(tick, feeTier);
    let adjustedPrice = Number(tickToPrice(
      validTick,
      token0.decimals,
      token1.decimals
    ));
    if (
      (token0.address === token0Address && currentTab === "opz") ||
      (token0.address !== token0Address && currentTab === "zpo")
    )
      adjustedPrice = 1 / adjustedPrice;

    if (isMinOrMax) {
      setTickLowerInput(validTick.toString());
      form.setValue("tickLower", validTick.toString());
      setMinPriceInput(adjustedPrice.toString());
      form.setValue("minPrice", adjustedPrice.toString());
    }
    else {
      setTickUpperInput(validTick.toString());
      form.setValue("tickUpper", validTick.toString());
      setMaxPriceInput(adjustedPrice.toString());
      form.setValue("maxPrice", adjustedPrice.toString());
    }
  }

  useEffect(() => {
    setNearestValidPrice(debouncedMinPrice, true);
  }, [debouncedMinPrice]);

  useEffect(() => {
    setNearestValidPrice(debouncedMaxPrice, false);
  }, [debouncedMaxPrice]);

  useEffect(() => {
    setNearestValidPrice(minPriceInput, true);
    setNearestValidPrice(maxPriceInput, false);
  }, [feeTier])

  useEffect(() => {
    if (token0Address && token0Decimals) {
      const getTokenBalance = async () => {
        setIsLoadingToken0Balance(true)
        const balance = await getERC20TokenBalance(token0Address, address || "")
        if (balance)
          setToken0Balance(Number(formatUnits(balance, token0Decimals)).toFixed(4))
        setIsLoadingToken0Balance(false)
      }
      getTokenBalance()
    }
  }, [token0Address])

  useEffect(() => {
    if (token1Address && token1Decimals) {
      const getTokenBalance = async () => {
        setIsLoadingToken1Balance(true)
        const balance = await getERC20TokenBalance(token1Address, address || "")
        if (balance)
          setToken1Balance(Number(formatUnits(balance, token1Decimals)).toFixed(4))
        setIsLoadingToken1Balance(false)
      }
      getTokenBalance()
    }
  }, [token1Address])

  useEffect(() => {
    if (token0Address && token1Address) {
      setFeeTier(INVALID_FEE_TIER)
      const getPoolAddressFunc = async () => {
        const [orderedToken0, orderedToken1] = getReArrangedTokens()
        const [pool100, pool500, pool3000, pool10000] = await getAvailablePools(orderedToken0.address, orderedToken1.address, chainId)
        let temp = []
        if (pool100) temp.push(pool100)
        if (pool500) temp.push(pool500)
        if (pool3000) temp.push(pool3000)
        if (pool10000) temp.push(pool10000)
        setAvailableFeeTiers(temp)
      }
      getPoolAddressFunc()
    }
  }, [token0Address, token1Address, chainId])

  useEffect(() => {
    if (pageStatus === CREATE_POSITION_PAGE_STATE.POSITION_OPENED)
      toast({
        variant: "default",
        title: "Info",
        description: "Successfully opened a new position.",
      })
    if (pageStatus === CREATE_POSITION_PAGE_STATE.OPEN_POSITION_FAILED)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Open position failed",
      })
    if (pageStatus === CREATE_POSITION_PAGE_STATE.TOKEN_APPROVE_FAILED)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Token approval failed",
      })
  
  }, [pageStatus])

  const getReArrangedTokens = () => reArrangeTokensByContractAddress([
    {
      address: token0Address as `0x${string}`,
      decimals: token0Decimals || 18,
      name: token0Name,
      price: token0Price,
    },
    {
      address: token1Address as `0x${string}`,
      decimals: token1Decimals || 18,
      name: token1Name,
      price: token1Price,
    },
  ])

  const handleTabChange = (value: string) => {
    setCurrentTab(value as "zpo" | "opz");
    if (minPriceInput)
      setMinPriceInput((1 / parseFloat(minPriceInput)).toString());
    if (maxPriceInput)
      setMaxPriceInput((1 / parseFloat(maxPriceInput)).toString());
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    
    try {
      setPageStatus(CREATE_POSITION_PAGE_STATE.APPROVING_TOKENS);
      
      const { success: approveToken0Success } = await approveToken(address as `0x${string}`, token0Address as `0x${string}`, getManagerContractAddressFromChainId(chainId), token0Decimals || 18, values.amount0)
      if (!approveToken0Success) {
        setPageStatus(CREATE_POSITION_PAGE_STATE.TOKEN_APPROVE_FAILED)
        return
      }
      const { success: approveToken1Success } = await approveToken(address as `0x${string}`, token1Address as `0x${string}`, getManagerContractAddressFromChainId(chainId), token1Decimals || 18, values.amount1)
      if (!approveToken1Success) {
        setPageStatus(CREATE_POSITION_PAGE_STATE.TOKEN_APPROVE_FAILED)
        return
      }

      const [realToken0, realToken1] = getReArrangedTokens();
      const realToken0Value =
        realToken0.address === token0Address ? values.amount0 : values.amount1;
      const realToken1Value =
        realToken1.address === token1Address ? values.amount1 : values.amount0;

      setPageStatus(CREATE_POSITION_PAGE_STATE.OPENING_POSITION);
      const { success: openPositionSuccess, result } = await openPosition(publicClient, chainId, {
        token0Address: realToken0.address,
        token1Address: realToken1.address,
        feeTier: feeTier,
        tickUpper: realToken0.address === token0Address ? values.tickUpper : values.tickLower,
        tickLower: realToken0.address === token0Address ? values.tickLower : values.tickUpper,
        token0Value: realToken0Value,
        token1Value: realToken1Value,
        token0Decimals: realToken0.decimals,
        token1Decimals: realToken1.decimals
      }, address)
      if (!openPositionSuccess) {
        setPageStatus(CREATE_POSITION_PAGE_STATE.OPEN_POSITION_FAILED)
        return
      }
      setPageStatus(CREATE_POSITION_PAGE_STATE.POSITION_OPENED)
    } catch(err) {
      console.log(err)
      setPageStatus(CREATE_POSITION_PAGE_STATE.OPEN_POSITION_FAILED)
      return
    }
  }

  useEffect(() => {
    fetchTokenPriceWithLoading(token0Address || "", setToken0Price, setIsLoadingToken0Price, chainId);
  }, [token0Address]);

  useEffect(() => {
    fetchTokenPriceWithLoading(token1Address || "", setToken1Price, setIsLoadingToken1Price, chainId);
  }, [token1Address]);

  useEffect(() => {
    form.setValue("amount0", token0Amount || "0");
    const priceLower =
      currentTab === "zpo"
        ? minPriceInput
        : (1 / parseFloat(minPriceInput)).toString();
    const priceUpper =
      currentTab === "zpo"
        ? maxPriceInput
        : (1 / parseFloat(maxPriceInput)).toString();
    const newToken1Amount = getRequiredToken1FromToken0Amount(
      parseFloat(token0Price || "0.0") / parseFloat(token1Price || "0.0"),
      parseFloat(priceLower),
      parseFloat(priceUpper),
      token0Amount || "0",
      token1Decimals || 18
    );
    setToken1Amount(newToken1Amount);
    form.setValue("amount1", newToken1Amount || "0");
  }, [token0Amount]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">
          Connect your wallet to continue
        </h2>
        <p className="text-muted-foreground">
          Please connect your wallet to create a new LP position
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Open Position</h2>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <TokenSelector
                    control={form.control}
                    name="token0"
                    addressFieldName="token0Address"
                    label="Select Token"
                    chainId={chainId}
                    onTokenInfoChange={(info) => {
                      setToken0Name(info.symbol);
                      setToken0Decimals(info.decimals);
                      setToken0Address(info.address);
                    }}
                  />
                  {(isLoadingToken0Price || token0Price) && (
                    <div className="flex items-center mt-2">
                      {isLoadingToken0Price ? (
                        <span className="text-sm text-muted-foreground">
                          <Skeleton className="w-[100px] h-[20px] rounded" />
                        </span>
                      ) : (
                        <span className="text-sm ml-2">Current Price: ${token0Price} USD</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <TokenSelector
                    control={form.control}
                    name="token1"
                    addressFieldName="token1Address"
                    label="Select Token"
                    chainId={chainId}
                    onTokenInfoChange={(info) => {
                      setToken1Name(info.symbol);
                      setToken1Decimals(info.decimals);
                      setToken1Address(info.address);
                    }}
                  />
                  {(isLoadingToken1Price || token1Price) && (
                    <div className="flex items-center mt-2">
                      {isLoadingToken1Price ? (
                        <span className="text-sm text-muted-foreground">
                          <Skeleton className="w-[100px] h-[20px] rounded" />
                        </span>
                      ) : (
                        <span className="text-sm ml-2">Current Price: ${token1Price} USD</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {
                  availableFeeTiers.map((elem) => (
                    <FeeTier 
                      key={`FeeTier_${elem.feeTier}`}
                      address={elem.poolAddress} 
                      feeTier={elem.feeTier} 
                      pair={`${token0Name}/${token1Name}`}
                      balance0={Number(elem.balance0) / (10 ** (token0Decimals || 18))} 
                      balance1={Number(elem.balance1) / (10 ** (token1Decimals || 18))} 
                      price0={Number(token0Price || 0)}
                      price1={Number(token1Price || 0)}
                      chainId={chainId}
                      selected={feeTier === elem.feeTier}
                      onClickPool={() => setFeeTier(elem.feeTier)} 
                    />
                  ))
                }
                {
                  availableFeeTiers.length === 0 ? 
                  <>No pools available for this pair. Please choose other tokens.</> : <></>
                }
              </div>

              <div className={`${!token0Name || !token1Name || VALID_FEE_TIERS.indexOf(feeTier) < 0 || availableFeeTiers.length === 0 ? "hidden" : "space-y-4"}`}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Tabs
                    value={currentTab}
                    onValueChange={handleTabChange}
                    className="w-full"
                  >
                    <TabsList>
                      <TabsTrigger value="zpo">{`${token1Name} per ${token0Name}`}</TabsTrigger>
                      <TabsTrigger value="opz">{`${token0Name} per ${token1Name}`}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {
                  currentTab === "zpo" ? 
                    <div>
                      Current Price for {token1Name} per {token0Name}: {Number(token0Price) / Number(token1Price)}
                    </div>
                    : 
                    <div>
                      Current Price for {token0Name} per {token1Name}: {Number(token1Price) / Number(token0Price)}
                    </div>
                }

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="minPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Price</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0.0"
                            value={minPriceInput}
                            onChange={(e) => setMinPriceInput(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tickLower"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormLabel>Tick Lower</FormLabel>
                        <FormControl>
                          <Input
                            value={tickLowerInput}
                            onChange={(e) => setTickLowerInput(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Price</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0.0"
                            value={maxPriceInput}
                            onChange={(e) => setMaxPriceInput(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tickUpper"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormLabel>Tick Upper</FormLabel>
                        <FormControl>
                          <Input
                            value={tickUpperInput}
                            onChange={(e) => setTickUpperInput(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="amount0"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{`${token0Name} Amount`}</FormLabel>
                        <FormControl>
                          <Input
                            value={token0Amount || ""}
                            onChange={(e) => setToken0Amount(e.target.value)}
                            placeholder="0.0"
                          />
                        </FormControl>
                        {token0Price && !isNaN(Number(token0Amount)) && (
                          <div className="text-sm text-muted-foreground mt-1">
                            ≈ $
                            {(
                              Number(token0Amount) * Number(token0Price)
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            USD
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{`${token1Name} Amount`}</FormLabel>
                        <FormControl>
                          <Input
                            value={token1Amount || ""}
                            onChange={(e) => setToken1Amount(e.target.value)}
                            placeholder="0.0"
                          />
                        </FormControl>
                        {token1Price && !isNaN(Number(token1Amount)) && (
                          <div className="text-sm text-muted-foreground mt-1">
                            ≈ $
                            {(
                              Number(token1Amount) * Number(token1Price)
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            USD
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {(token0Balance !== "" || isLoadingToken0Balance) && (
                    <div className="flex items-center mt-2">
                      {isLoadingToken0Balance ? (
                        <span className="text-sm text-muted-foreground">
                          <Skeleton className="w-[100px] h-[20px] rounded" />
                        </span>
                      ) : (
                        <span className="text-sm ml-2">Current Balance: {token0Balance} {token0Name}</span>
                      )}
                    </div>
                  )}
                  {(token1Balance !== "" || isLoadingToken1Balance) && (
                    <div className="flex items-center mt-2">
                      {isLoadingToken1Balance ? (
                        <span className="text-sm text-muted-foreground">
                          <Skeleton className="w-[100px] h-[20px] rounded" />
                        </span>
                      ) : (
                        <span className="text-sm ml-2">Current Balance: {token1Balance} {token1Name}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/");
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Position</Button>
            </div>
          </form>
        </Form>
      </Card>

      <AlertDialog
        open={
          pageStatus === CREATE_POSITION_PAGE_STATE.APPROVING_TOKENS ||
          pageStatus === CREATE_POSITION_PAGE_STATE.OPENING_POSITION ||
          pageStatus === CREATE_POSITION_PAGE_STATE.POSITION_OPENED
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Status</AlertDialogTitle>
            <AlertDialogDescription>
              {pageStatus === CREATE_POSITION_PAGE_STATE.APPROVING_TOKENS
                ? "Approving your tokens to deposit into liquidity pools..."
                : pageStatus === CREATE_POSITION_PAGE_STATE.OPENING_POSITION
                ? "Opening your position..."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pageStatus === CREATE_POSITION_PAGE_STATE.POSITION_OPENED && (
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setFeeTier(INVALID_FEE_TIER)
                setPageStatus(CREATE_POSITION_PAGE_STATE.PAGE_LOADED)
              }}>
                Open another position
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  router.push("/");
                }}
              >
                Check open positions
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
