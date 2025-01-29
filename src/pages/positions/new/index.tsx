"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseUnits } from "viem";
import type { Abi } from 'viem';
import { useAccount, useWriteContract, useChainId, usePublicClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { POSITION_MANAGER_CONTRACT_ADDRESS, TOKEN_LIST } from "@/utils/constant";
import { erc20Abi } from "viem";
import positionManagerAbi from "@/abi/OpenPositionABI.json";
import { TokenSelector } from "@/components/token-selector";
import { useState, useEffect } from "react";
import { priceToTick, tickToPrice, nearestValidTick } from "@/utils/ticks";
import { useDebounce } from "@/hooks/useDebounce";

const formSchema = z.object({
  token0: z.string().min(1, "Token 0 is required"),
  token1: z.string().min(1, "Token 1 is required"),
  token0Address: z.string().optional(),
  token1Address: z.string().optional(),
  feeTier: z.string().min(1, "Fee tier is required"),
  minPrice: z.string().min(1, "Min price is required"),
  maxPrice: z.string().min(1, "Max price is required"),
  amount0: z.string().min(1, "Token 0 amount is required"),
  amount1: z.string().min(1, "Token 1 amount is required"),
  tickLower: z.string().min(1, "Tick lower is required"),
  tickUpper: z.string().min(1, "Tick upper is required"),
});

export default function NewPositionPage() {
  const { isConnected, address } = useAccount();
  const { writeContractAsync, status, error } = useWriteContract();
  const publicClient = usePublicClient();
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
  
  const [token0Price, setToken0Price] = useState<string | null>(null);
  const [token1Price, setToken1Price] = useState<string | null>(null);
  const [token0Name, setToken0Name] = useState<string | null>(null);
  const [token1Name, setToken1Name] = useState<string | null>(null);
  const [isLoadingToken0Price, setIsLoadingToken0Price] = useState(false);
  const [isLoadingToken1Price, setIsLoadingToken1Price] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [tickLowerInput, setTickLowerInput] = useState("");
  const [tickUpperInput, setTickUpperInput] = useState("");
  
  const debouncedMinPrice = useDebounce(minPriceInput, 1000);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 1000);

  useEffect(() => {
    if (!debouncedMinPrice || isNaN(Number(debouncedMinPrice))) return;

    const numericPrice = Number(debouncedMinPrice);
    const tick = priceToTick(numericPrice, 18, 6);
    const feeTier = Number(form.getValues("feeTier") || "3000");
    const validTick = nearestValidTick(tick, feeTier);
    setTickLowerInput(validTick.toString());
    form.setValue("tickLower", validTick.toString());
    const adjustedPrice = tickToPrice(validTick, 18, 6).toString();
    setMinPriceInput(adjustedPrice)
    form.setValue("minPrice", adjustedPrice);
  }, [debouncedMinPrice, form]);

  useEffect(() => {
    if (!debouncedMaxPrice || isNaN(Number(debouncedMaxPrice))) return;
    
    const numericPrice = Number(debouncedMaxPrice);
    const tick = priceToTick(numericPrice, 18, 6);
    const feeTier = Number(form.getValues("feeTier") || "3000");
    const validTick = nearestValidTick(tick, feeTier);
    setTickUpperInput(validTick.toString());
    form.setValue("tickUpper", validTick.toString());  
    const adjustedPrice = tickToPrice(validTick, 18, 6).toString();
    setMaxPriceInput(adjustedPrice)
    form.setValue("maxPrice", adjustedPrice);
  }, [debouncedMaxPrice, form]);

  const handleMinPriceChange = (value: string) => {
    setMinPriceInput(value);
  };

  const handleMaxPriceChange = (value: string) => {
    setMaxPriceInput(value);
  };

  const handleTickLowerChange = (value: string) => {
    setTickLowerInput(value);
  };

  const handleTickUpperChange = (value: string) => {
    setTickUpperInput(value);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const token0Info = values.token0 === "custom" 
      ? { address: values.token0Address as `0x${string}`, decimals: 18 }
      : { address: TOKEN_LIST[Number(values.token0)].ADDRESS.BASE, decimals: TOKEN_LIST[Number(values.token0)].DECIMAL };

    const token1Info = values.token1 === "custom"
      ? { address: values.token1Address as `0x${string}`, decimals: 18 }
      : { address: TOKEN_LIST[Number(values.token1)].ADDRESS.BASE, decimals: TOKEN_LIST[Number(values.token1)].DECIMAL };

    try {
      // Approve both tokens
      const token0ApprovalConfig = {
        abi: erc20Abi,
        address: token0Info.address,
        functionName: 'approve',
        args: [POSITION_MANAGER_CONTRACT_ADDRESS.BASE, parseUnits(values.amount0, token0Info.decimals)]
      } as const;

      const token1ApprovalConfig = {
        abi: erc20Abi,
        address: token1Info.address,
        functionName: 'approve',
        args: [POSITION_MANAGER_CONTRACT_ADDRESS.BASE, parseUnits(values.amount1, token1Info.decimals)]
      } as const;

      console.log('Approving token0...');
      const token0Hash = await writeContractAsync(token0ApprovalConfig);
      console.log('Token0 approval tx:', token0Hash);

      console.log('Approving token1...');
      const token1Hash = await writeContractAsync(token1ApprovalConfig);
      console.log('Token1 approval tx:', token1Hash);

      // Wait for both approval transactions to be confirmed
      if (publicClient) {
        console.log('Waiting for token approvals to be confirmed...');
        await Promise.all([
          publicClient.waitForTransactionReceipt({ hash: token0Hash }),
          publicClient.waitForTransactionReceipt({ hash: token1Hash })
        ]);
        console.log('Both token approvals confirmed');
      }

      if (!publicClient) {
        console.error('publicClient is not available');
        return;
      }

      const block = await publicClient.getBlock();
      const currentTimestamp = Number(block.timestamp);
      const deadlineTimestamp = currentTimestamp + (10 * 60); // Add 10 minutes in seconds

      // Open position
      if (!writeContractAsync) {
        console.error('writeContractAsync is not available');
        return;
      }

      const params = {
        _params: {
          token0: values.token0Address,
          token1: values.token1Address,
          fee: parseInt(values.feeTier),
          tickUpper: parseInt(values.tickLower),
          tickLower: parseInt(values.tickUpper),
          amount0Desired: parseUnits(values.amount0, token0Info.decimals),
          amount1Desired: parseUnits(values.amount1, token1Info.decimals),
          amount0Min: 0,
          amount1Min: 0,
          recipient: POSITION_MANAGER_CONTRACT_ADDRESS.BASE,
          deadline: deadlineTimestamp
        },
        _owner: address,
        _accountingUnit: values.token1Address
      }

      console.log(params)

      console.log('Opening position...');
      await openPosition(params);
    } catch (error) {
      console.error('Error in transaction process:', error);
    }
  }

  const openPosition = async (params: any) => {
    try {
      const result: any = await writeContractAsync({
        abi: positionManagerAbi as Abi,
        address: POSITION_MANAGER_CONTRACT_ADDRESS.BASE,
        functionName: 'openPosition',
        args: [params._params, params._owner, params._accountingUnit],
      });
      
      if (result) {
        console.log('Transaction hash:', result);
        return result;
      }
    } catch (err: any) {
      console.error('Error in openPosition:', err);
    }
  }

  useEffect(() => {
    if (status === 'success') {
      console.log('Transaction successful!');
      // Add your success handling here
    }
    if (status === 'error') {
      console.error('Transaction failed:', error);
      // Add your error handling here
    }
    // if (status === 'loading') {
    //   console.log('Transaction is processing...');
    //   // Add your loading state handling here
    // }
  }, [status, error]);

  useEffect(() => {
    const fetchToken0Price = async () => {
      const token0Value = form.getValues("token0");
      if (!token0Value) return;

      setIsLoadingToken0Price(true);
      try {
        let tokenAddress;
        if (token0Value === "custom") {
          tokenAddress = form.getValues("token0Address");
        } else {
          tokenAddress = TOKEN_LIST[Number(token0Value)].ADDRESS.BASE;
          form.setValue("token0Address", tokenAddress);
          setToken0Name(TOKEN_LIST[Number(token0Value)].NAME);
        }

        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
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
  }, [form.watch("token0"), form.watch("token0Address")]);

  useEffect(() => {
    const fetchToken1Price = async () => {
      const token1Value = form.getValues("token1");
      if (!token1Value) return;

      setIsLoadingToken1Price(true);
      try {
        let tokenAddress;
        if (token1Value === "custom") {
          tokenAddress = form.getValues("token1Address");
        } else {
          tokenAddress = TOKEN_LIST[Number(token1Value)].ADDRESS.BASE;
          form.setValue("token1Address", tokenAddress);
          setToken1Name(TOKEN_LIST[Number(token1Value)].NAME);
        }

        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
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
  }, [form.watch("token1"), form.watch("token1Address")]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Connect your wallet to continue</h2>
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
                  label="Token 0"
                  addressFieldName="token0Address"
                />
                {(isLoadingToken0Price || token0Price) && (
                  <div className="flex items-center mt-2">
                    {isLoadingToken0Price ? (
                      <span className="text-sm text-muted-foreground">Loading price...</span>
                    ) : (
                      <span className="text-sm">
                        ≈ ${token0Price} USD
                      </span>
                    )}
                  </div>
                )}
                <TokenSelector
                  control={form.control}
                  name="token1"
                  label="Token 1"
                  addressFieldName="token1Address"
                />
                {(isLoadingToken1Price || token1Price) && (
                  <div className="flex items-center mt-2">
                    {isLoadingToken1Price ? (
                      <span className="text-sm text-muted-foreground">Loading price...</span>
                    ) : (
                      <span className="text-sm">
                        ≈ ${token1Price} USD
                      </span>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          onChange={(e) => handleMinPriceChange(e.target.value)}
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
                          onChange={(e) => handleTickLowerChange(e.target.value)}
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
                          onChange={(e) => handleMaxPriceChange(e.target.value)}
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
                          onChange={(e) => handleTickUpperChange(e.target.value)}
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
                      <FormLabel>Token 0 Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="0.0" {...field} />
                      </FormControl>
                      {token0Price && !isNaN(Number(field.value)) && (
                        <div className="text-sm text-muted-foreground mt-1">
                          ≈ ${(Number(field.value) * Number(token0Price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
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
                      <FormLabel>Token 1 Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="0.0" {...field} />
                      </FormControl>
                      {token1Price && !isNaN(Number(field.value)) && (
                        <div className="text-sm text-muted-foreground mt-1">
                          ≈ ${(Number(field.value) * Number(token1Price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Create Position
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}