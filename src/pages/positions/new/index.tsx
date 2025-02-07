"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseUnits } from "viem";
import type { Abi } from "viem";
import {
  useAccount,
  useWriteContract,
  useChainId,
  usePublicClient,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { POSITION_MANAGER_CONTRACT_ADDRESS } from "@/utils/constants";
import { erc20Abi } from "viem";
import { PositionManagerABI } from "@/abi/PositionManager";
import { TokenSelector } from "@/components/token-selector";
import { useState, useEffect } from "react";
import { priceToTick, tickToPrice, nearestValidTick } from "@/utils/ticks";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import {
  getRequiredToken0FromToken1Amount,
  getRequiredToken1FromToken0Amount,
} from "../../../utils/liquidity";

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
  const { writeContractAsync, status, error } = useWriteContract();
  const publicClient = usePublicClient();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token0: "",
      token1: "",
      token0Address: "",
      token1Address: "",
      feeTier: "",
      minPrice: "",
      maxPrice: "",
      tickLower: "",
      tickUpper: "",
      amount0: "",
      amount1: "",
    },
  });

  const [pageStatus, setPageStatus] = useState<string | null>("loaded");
  const [token0Price, setToken0Price] = useState<string | null>(null);
  const [token1Price, setToken1Price] = useState<string | null>(null);
  const [token0Amount, setToken0Amount] = useState<string | null>(null);
  const [token1Amount, setToken1Amount] = useState<string | null>(null);
  const [token0Address, setToken0Address] = useState<string | null>(null);
  const [token1Address, setToken1Address] = useState<string | null>(null);
  const [token0Decimal, setToken0Decimal] = useState<number | null>(null);
  const [token1Decimal, setToken1Decimal] = useState<number | null>(null);
  const [token0Name, setToken0Name] = useState<string | null>(null);
  const [token1Name, setToken1Name] = useState<string | null>(null);
  const [isLoadingToken0Price, setIsLoadingToken0Price] = useState(false);
  const [isLoadingToken1Price, setIsLoadingToken1Price] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [tickLowerInput, setTickLowerInput] = useState("");
  const [tickUpperInput, setTickUpperInput] = useState("");
  const [feeTier, setFeeTier] = useState<number | null>(3000);
  const [currentTab, setCurrentTab] = useState<"zpo" | "opz">("zpo");

  const debouncedMinPrice = useDebounce(minPriceInput, 1000);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 1000);

  useEffect(() => {
    if (!debouncedMinPrice || isNaN(Number(debouncedMinPrice))) return;

    let numericPrice = Number(debouncedMinPrice);
    const [realToken0, realToken1] = getRealTokens();
    if (
      (realToken0.address === token0Address && currentTab === "opz") ||
      (realToken0.address !== token0Address && currentTab === "zpo")
    )
      numericPrice = 1 / numericPrice;

    const tick = priceToTick(
      numericPrice,
      realToken0.decimals,
      realToken1.decimals
    );
    const validTick = nearestValidTick(tick, feeTier || 3000);

    setTickLowerInput(validTick.toString());
    form.setValue("tickLower", validTick.toString());

    let adjustedPrice = tickToPrice(
      validTick,
      realToken0.decimals,
      realToken1.decimals
    ).toString();
    if (
      (realToken0.address === token0Address && currentTab === "opz") ||
      (realToken0.address !== token0Address && currentTab === "zpo")
    )
      adjustedPrice = 1 / adjustedPrice;

    setMinPriceInput(adjustedPrice);
    form.setValue("minPrice", adjustedPrice);
  }, [debouncedMinPrice, form]);

  useEffect(() => {
    if (!debouncedMaxPrice || isNaN(Number(debouncedMaxPrice))) return;

    let numericPrice = Number(debouncedMaxPrice);
    const [realToken0, realToken1] = getRealTokens();
    if (
      (realToken0.address === token0Address && currentTab === "opz") ||
      (realToken0.address !== token0Address && currentTab === "zpo")
    )
      numericPrice = 1 / numericPrice;

    const tick = priceToTick(
      numericPrice,
      realToken0.decimals,
      realToken1.decimals
    );
    const validTick = nearestValidTick(tick, feeTier || 3000);

    setTickUpperInput(validTick.toString());
    form.setValue("tickUpper", validTick.toString());

    let adjustedPrice = tickToPrice(
      validTick,
      realToken0.decimals,
      realToken1.decimals
    ).toString();
    if (
      (realToken0.address === token0Address && currentTab === "opz") ||
      (realToken0.address !== token0Address && currentTab === "zpo")
    )
      adjustedPrice = 1 / adjustedPrice;

    setMaxPriceInput(adjustedPrice);
    form.setValue("maxPrice", adjustedPrice);
  }, [debouncedMaxPrice, form]);

  const getRealTokens = () => {
    if (!token0Address || !token1Address || token0Address < token1Address)
      return [
        {
          address: token0Address as `0x${string}`,
          decimals: token0Decimal || 18,
          name: token0Name,
          price: token0Price,
        },
        {
          address: token1Address as `0x${string}`,
          decimals: token1Decimal || 18,
          name: token1Name,
          price: token1Price,
        },
      ];
    else
      return [
        {
          address: token1Address as `0x${string}`,
          decimals: token1Decimal || 18,
          name: token1Name,
          price: token1Price,
        },
        {
          address: token0Address as `0x${string}`,
          decimals: token0Decimal || 18,
          name: token0Name,
          price: token0Price,
        },
      ];
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value as "zpo" | "opz");
    if (minPriceInput)
      setMinPriceInput((1 / parseFloat(minPriceInput)).toString());
    if (maxPriceInput)
      setMaxPriceInput((1 / parseFloat(maxPriceInput)).toString());
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setPageStatus("approving");

      // Approve both tokens
      if (!token0Address || !token0Address.startsWith("0x")) {
        throw new Error("Invalid token0 address");
      }

      if (!token1Address || !token1Address.startsWith("0x")) {
        throw new Error("Invalid token1 address");
      }

      const token0ApprovalConfig = {
        abi: erc20Abi,
        address: token0Address as `0x${string}`,
        functionName: "approve",
        args: [
          POSITION_MANAGER_CONTRACT_ADDRESS.BASE,
          parseUnits(values.amount0, token0Decimal || 18),
        ],
      } as const;

      const token1ApprovalConfig = {
        abi: erc20Abi,
        address: token1Address as `0x${string}`,
        functionName: "approve",
        args: [
          POSITION_MANAGER_CONTRACT_ADDRESS.BASE,
          parseUnits(values.amount1, token1Decimal || 18),
        ],
      } as const;

      console.log(`Approving ${token0Name}`);
      let token0Hash = null;
      try {
        token0Hash = await writeContractAsync(token0ApprovalConfig);
        console.log("Token0 approval tx:", token0Hash);
      } catch (error: any) {
        if (error?.message?.includes("User rejected") || error?.code === 4001) {
          console.log("User rejected token0 approval");
          setPageStatus("loaded");
          return;
        }
        throw error;
      }

      console.log(`Approving ${token1Name}`);
      let token1Hash = null;
      try {
        token1Hash = await writeContractAsync(token1ApprovalConfig);
        console.log("Token1 approval tx:", token1Hash);
      } catch (error: any) {
        if (error?.message?.includes("User rejected") || error?.code === 4001) {
          console.log("User rejected token1 approval");
          setPageStatus("loaded");
          return;
        }
        throw error;
      }

      if (!token0Hash || !token1Hash) {
        console.log("Token approval failed");
        setPageStatus("loaded");
        return;
      }

      // Wait for both approval transactions to be confirmed
      if (publicClient) {
        console.log("Waiting for token approvals to be confirmed...");
        await Promise.all([
          publicClient.waitForTransactionReceipt({ hash: token0Hash }),
          publicClient.waitForTransactionReceipt({ hash: token1Hash }),
        ]);
        console.log("Both token approvals confirmed");
      }

      setPageStatus("opening");

      if (!publicClient) {
        console.error("publicClient is not available");
        return;
      }

      const block = await publicClient.getBlock();
      const currentTimestamp = Number(block.timestamp);
      const deadlineTimestamp = currentTimestamp + 10 * 60; // Add 10 minutes in seconds

      // Open position
      if (!writeContractAsync) {
        console.error("writeContractAsync is not available");
        return;
      }

      const [realToken0, realToken1] = getRealTokens();
      const realToken0Value =
        realToken0.address === token0Address ? values.amount0 : values.amount1;
      const realToken1Value =
        realToken1.address === token1Address ? values.amount1 : values.amount0;

      console.log({
        token0: realToken0.address,
        token1: realToken1.address,
        fee: parseInt(values.feeTier),
        tickUpper: parseInt(values.tickUpper),
        tickLower: parseInt(values.tickLower),
        amount0Desired: parseUnits(realToken0Value, realToken0.decimals),
        amount1Desired: parseUnits(realToken1Value, realToken1.decimals),
        amount0Min: 0,
        amount1Min: 0,
        recipient: POSITION_MANAGER_CONTRACT_ADDRESS.BASE,
        deadline: deadlineTimestamp,
      });
      console.log(address);
      console.log(realToken1.address);

      const params = {
        _params: {
          token0: realToken0.address,
          token1: realToken1.address,
          fee: parseInt(values.feeTier),
          tickUpper: parseInt(values.tickUpper),
          tickLower: parseInt(values.tickLower),
          amount0Desired: parseUnits(realToken0Value, realToken0.decimals),
          amount1Desired: parseUnits(realToken1Value, realToken1.decimals),
          amount0Min: 0,
          amount1Min: 0,
          recipient: POSITION_MANAGER_CONTRACT_ADDRESS.BASE,
          deadline: deadlineTimestamp,
        },
        _owner: address,
        _accountingUnit: realToken1.address,
      };

      console.log("Opening position...");
      try {
        await openPosition(params);
      } catch (error: any) {
        if (error?.message?.includes("User rejected") || error?.code === 4001) {
          console.log("User rejected position opening transaction");
          setPageStatus("loaded");
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Error in transaction process:", error);
      setPageStatus("error");
    }
  }

  const openPosition = async (params: any) => {
    try {
      const result: any = await writeContractAsync({
        abi: PositionManagerABI as Abi,
        address: POSITION_MANAGER_CONTRACT_ADDRESS.BASE,
        functionName: "openPosition",
        args: [params._params, params._owner, params._accountingUnit],
      });

      if (result) {
        console.log("Transaction hash:", result);
        setPageStatus("opened");
        return result;
      }
    } catch (err: any) {
      console.error("Error in openPosition:", err);
      setPageStatus("error");
    }
  };

  useEffect(() => {
    if (status === "success") {
      console.log("Transaction successful!");
      // Add your success handling here
    }
    if (status === "error") {
      console.error("Transaction failed:", error);
      // Add your error handling here
    }
    // if (status === 'loading') {
    //   console.log('Transaction is processing...');
    //   // Add your loading state handling here
    // }
  }, [status, error]);

  useEffect(() => {
    const fetchToken0Price = async () => {
      setIsLoadingToken0Price(true);
      try {
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${token0Address}`
        );
        const data = await response.json();

        if (data.pairs && data.pairs[0]) {
          setToken0Price(data.pairs[0].priceUsd);
        }
      } catch (error) {
        console.error("Error fetching token0 price:", error);
      } finally {
        setIsLoadingToken0Price(false);
      }
    };
    fetchToken0Price();
  }, [token0Address]);

  useEffect(() => {
    const fetchToken1Price = async () => {
      setIsLoadingToken1Price(true);
      try {
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${token1Address}`
        );
        const data = await response.json();

        if (data.pairs && data.pairs[0]) {
          setToken1Price(data.pairs[0].priceUsd);
        }
      } catch (error) {
        console.error("Error fetching token1 price:", error);
      } finally {
        setIsLoadingToken1Price(false);
      }
    };
    fetchToken1Price();
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
      token0Amount || "0"
    );
    setToken1Amount(newToken1Amount);
    form.setValue("amount1", newToken1Amount || "0");
  }, [token0Amount]);

  // temporary comment

  // useEffect(() => {
  //   const priceLower = currentTab === "opz" ? minPriceInput : (1 / parseFloat(minPriceInput)).toString();
  //   const priceUpper = currentTab === "opz" ? maxPriceInput : (1 / parseFloat(maxPriceInput)).toString();
  //   const newToken0Amount = getRequiredToken0FromToken1Amount(parseFloat(token1Price || "0.0") / parseFloat(token0Price || "0.0"), parseFloat(priceLower), parseFloat(priceUpper), token1Amount || "0")
  //   setToken0Amount(newToken0Amount)
  // }, [token1Amount])

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
        <h2 className="text-3xl font-bold">Create New Position</h2>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-1">
                <TokenSelector
                  control={form.control}
                  name="token0"
                  addressFieldName="token0Address"
                  label="Select Token"
                  onTokenInfoChange={(info) => {
                    setToken0Name(info.symbol);
                    setToken0Decimal(info.decimals);
                    setToken0Address(info.address);
                  }}
                />
                {(isLoadingToken0Price || token0Price) && (
                  <div className="flex items-center mt-2">
                    {isLoadingToken0Price ? (
                      <span className="text-sm text-muted-foreground">
                        Loading price...
                      </span>
                    ) : (
                      <span className="text-sm">≈ ${token0Price} USD</span>
                    )}
                  </div>
                )}
                <TokenSelector
                  control={form.control}
                  name="token1"
                  addressFieldName="token1Address"
                  label="Select Token"
                  onTokenInfoChange={(info) => {
                    setToken1Name(info.symbol);
                    setToken1Decimal(info.decimals);
                    setToken1Address(info.address);
                  }}
                />
                {(isLoadingToken1Price || token1Price) && (
                  <div className="flex items-center mt-2">
                    {isLoadingToken1Price ? (
                      <span className="text-sm text-muted-foreground">
                        Loading price...
                      </span>
                    ) : (
                      <span className="text-sm">≈ ${token1Price} USD</span>
                    )}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="feeTier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Tier</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="100">0.01%</SelectItem>
                        <SelectItem value="500">0.05%</SelectItem>
                        <SelectItem value="3000">0.3%</SelectItem>
                        <SelectItem value="10000">1%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={`${!token0Name || !token1Name ? "hidden" : ""}`}>
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
          pageStatus === "approving" ||
          pageStatus === "opening" ||
          pageStatus === "opened"
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Status</AlertDialogTitle>
            <AlertDialogDescription>
              {pageStatus === "approving"
                ? "Approving your tokens to deposit into liquidity pools..."
                : pageStatus === "opening"
                ? "Opening your position..."
                : "Position opened successfully!"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pageStatus === "opened" && (
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPageStatus("loaded")}>
                Open another position
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
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
