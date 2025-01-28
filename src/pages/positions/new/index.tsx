"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseEther, parseUnits } from "viem";
import { useAccount, useWriteContract, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { POSITION_MANAGER_CONTRACT_ADDRESS, TOKEN_LIST } from "@/utils/constant";
import { erc20Abi } from "viem";
import { TokenSelector } from "@/components/token-selector";
import { useState, useEffect } from "react";

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
});

export default function NewPositionPage() {
  const { isConnected, address } = useAccount();
  const { writeContract } = useWriteContract();
  const [token0Price, setToken0Price] = useState<string | null>(null);
  const [token1Price, setToken1Price] = useState<string | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

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
      amount0: "",
      amount1: "",
    },
  });

  const fetchLivePrice = async (token0Address: string, token1Address: string) => {
    try {
      setIsLoadingPrice(true);
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${token0Address},${token1Address}`
      );
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        // Initialize prices
        let token0Price = null;
        let token1Price = null;

        // Look through pairs to find prices for both tokens
        data.pairs.forEach((pair: any) => {
          if (pair.baseToken.address.toLowerCase() === token0Address.toLowerCase()) {
            token0Price = pair.priceUsd;
          } else if (pair.baseToken.address.toLowerCase() === token1Address.toLowerCase()) {
            token1Price = pair.priceUsd;
          }
          
          if (pair.quoteToken.address.toLowerCase() === token0Address.toLowerCase()) {
            token0Price = pair.priceUsd;
          } else if (pair.quoteToken.address.toLowerCase() === token1Address.toLowerCase()) {
            token1Price = pair.priceUsd;
          }
        });

        setToken0Price(token0Price);
        setToken1Price(token1Price);
      } else {
        setToken0Price(null);
        setToken1Price(null);
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
      setToken0Price(null);
      setToken1Price(null);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Watch for token changes and update price
  useEffect(() => {
    const values = form.getValues();
    const token0Info = values.token0 === "custom" 
      ? values.token0Address
      : values.token0 ? TOKEN_LIST[Number(values.token0)].ADDRESS.BASE
      : null;

    const token1Info = values.token1 === "custom"
      ? values.token1Address
      : values.token1 ? TOKEN_LIST[Number(values.token1)].ADDRESS.BASE
      : null;

    if (token0Info && token1Info) {
      fetchLivePrice(token0Info, token1Info);
    }
  }, [form.watch("token0"), form.watch("token1"), form.watch("token0Address"), form.watch("token1Address")]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const token0Info = values.token0 === "custom" 
      ? { address: values.token0Address as `0x${string}`, decimals: 18 } // You might want to store decimals in state
      : { address: TOKEN_LIST[Number(values.token0)].ADDRESS.BASE, decimals: TOKEN_LIST[Number(values.token0)].DECIMAL };

    const token1Info = values.token1 === "custom"
      ? { address: values.token1Address as `0x${string}`, decimals: 18 } // You might want to store decimals in state
      : { address: TOKEN_LIST[Number(values.token1)].ADDRESS.BASE, decimals: TOKEN_LIST[Number(values.token1)].DECIMAL };

    console.log(token0Info, token1Info)
    return
    
    writeContract({
      abi: erc20Abi,
      address: token0Info.address,
      functionName: 'approve',
      args: [POSITION_MANAGER_CONTRACT_ADDRESS.BASE, parseUnits(values.amount0, token0Info.decimals)]
    });

    writeContract({
      abi: erc20Abi,
      address: token1Info.address,
      functionName: 'approve',
      args: [POSITION_MANAGER_CONTRACT_ADDRESS.BASE, parseUnits(values.amount1, token1Info.decimals)]
    });
  }

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
          <div className="text-xl font-bold">
                      Token 0: {token0Price} USD
                      <br />
                      Token 1: {token1Price} USD
                    </div>
            {(isLoadingPrice || token0Price || token1Price) && (
              <div className="flex items-center justify-center p-4 bg-secondary rounded-lg">
                {isLoadingPrice ? (
                  <span>Loading prices...</span>
                ) : (
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">Current Prices:</span>
                    <div className="text-xl font-bold">
                      Token 0: {token0Price} USD
                      <br />
                      Token 1: {token1Price} USD
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TokenSelector
                  control={form.control}
                  name="token0"
                  label="Token 0"
                  addressFieldName="token0Address"
                />
                <TokenSelector
                  control={form.control}
                  name="token1"
                  label="Token 1"
                  addressFieldName="token1Address"
                />
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
                        <Input type="number" placeholder="0.00" {...field} />
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
                        <Input type="number" placeholder="0.00" {...field} />
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
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
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
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
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