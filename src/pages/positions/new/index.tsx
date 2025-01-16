"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ethers } from "ethers";
import { useAccount, useWriteContract } from "wagmi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DEPLOYED_ADDRESS, TOKEN_LIST } from "@/constant";
import Abi from "@/abi/PositionManager.json";

const formSchema = z.object({
  token0: z.string().min(1, "Token 0 is required"),
  token1: z.string().min(1, "Token 1 is required"),
  feeTier: z.string().min(1, "Fee tier is required"),
  minPrice: z.string().min(1, "Min price is required"),
  maxPrice: z.string().min(1, "Max price is required"),
  amount0: z.string().min(1, "Token 0 amount is required"),
  amount1: z.string().min(1, "Token 1 amount is required"),
});

export default function NewPositionPage() {
  const { isConnected, address } = useAccount();
  const { writeContract } = useWriteContract()

  // const { chain } = useChains();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token0: "",
      token1: "",
      feeTier: "",
      minPrice: "",
      maxPrice: "",
      amount0: "",
      amount1: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Implement position creation logic here
      writeContract({
        abi: Abi.abi,
        address: `0x${DEPLOYED_ADDRESS.base}`,
        functionName: 'openPosition',
        args: [
          {
            token0: TOKEN_LIST[Number(values.token0)].address,
            token1: TOKEN_LIST[Number(values.token1)].address,
            fee: values.feeTier,
            tickLower: values.minPrice,
            tickUpper: values.maxPrice,
            amount0Desired: ethers.parseUnits(values.amount0, TOKEN_LIST[Number(values.token0)].decimal),
            amount1Desired: ethers.parseUnits(values.amount1, TOKEN_LIST[Number(values.token1)].decimal),
            amount0Min: 0,
            amount1Min: 0,
            recipient: address,
            deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
          },
          address,
          "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" //usdc address
        ],
      })
    } catch (error) {
      console.error("Error creating position:", error);
    }
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
        {/* {chain && <p className="text-sm text-muted-foreground">Network: {chain.name}</p>} */}
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="token0"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token 0</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select token" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {
                            TOKEN_LIST.map((v, i) => <SelectItem key={"key1" + v.name} value={i.toString()}>{v.name}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="token1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token 1</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select token" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {
                            TOKEN_LIST.map((v, i) => <SelectItem key={"key2" + v.name} value={i.toString()}>{v.name}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
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