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
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { openPosition, getAvailablePools } from "@/utils/position-manage";
import { approveToken, getERC20TokenBalance } from "@/utils/erc20";
import { CREATE_POSITION_PAGE_STATE } from "@/utils/types";
import { ERC20TokenInfo, INVALID_FEE_TIER, VALID_FEE_TIERS, getManagerContractAddressFromChainId } from "@/utils/constants";
import { Skeleton } from "@/components/ui/skeleton";
import TokenLivePrice from "@/components/token-live-price";
import PoolSelector from "@/components/pool-selector";

export default function NewPositionPage() {
  const { isConnected, address: userAddress } = useAccount();
  const { toast } = useToast();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const router = useRouter();

  const [pageStatus, setPageStatus] = useState<string | null>(CREATE_POSITION_PAGE_STATE.PAGE_LOADING);
  const [selectedToken0, setSelectedToken0] = useState<ERC20TokenInfo | null>(null);
  const [selectedToken1, setSelectedToken1] = useState<ERC20TokenInfo | null>(null);
  const [selectedToken0Amount, setSelectedToken0Amount] = useState(0)
  const [selectedToken1Amount, setSelectedToken1Amount] = useState(0)
  const [selectedFeeTier, setSelectedFeeTier] = useState(INVALID_FEE_TIER)
  const [tickUpper, setTickUpper] = useState(0)
  const [tickLower, setTickLower] = useState(0)

  const onOpenPosition = async () => {
    try {
      if (!userAddress || !selectedToken0 || !selectedToken1 || !selectedFeeTier || !tickUpper || !tickLower)
        return
      setPageStatus(CREATE_POSITION_PAGE_STATE.APPROVING_TOKENS);
      const { success: approveToken0Success } = await approveToken(userAddress, selectedToken0.address, getManagerContractAddressFromChainId(chainId), selectedToken0.decimals, selectedToken0Amount)
      if (!approveToken0Success) {
        setPageStatus(CREATE_POSITION_PAGE_STATE.TOKEN_APPROVE_FAILED)
        return
      }
      const { success: approveToken1Success } = await approveToken(userAddress, selectedToken1.address, getManagerContractAddressFromChainId(chainId), selectedToken1.decimals, selectedToken1Amount)
      if (!approveToken1Success) {
        setPageStatus(CREATE_POSITION_PAGE_STATE.TOKEN_APPROVE_FAILED)
        return
      }

      const [token0SortedByCA, token1SortedByCA] = reArrangeTokensByContractAddress([selectedToken0, selectedToken1])
      const token0AmountSortedByCA =
        token0SortedByCA.address === selectedToken0.address ? selectedToken0Amount : selectedToken1Amount;
      const token1AmountSortedByCA =
        token1SortedByCA.address === selectedToken1.address ? selectedToken1Amount : selectedToken0Amount;

      setPageStatus(CREATE_POSITION_PAGE_STATE.OPENING_POSITION);
      const { success: openPositionSuccess, result } = await openPosition(publicClient, chainId, {
        token0Address: token0SortedByCA.address,
        token1Address: token1SortedByCA.address,
        feeTier: selectedFeeTier,
        tickUpper: token0SortedByCA.address === selectedToken0.address ? tickUpper : tickLower,
        tickLower: token0SortedByCA.address === selectedToken0.address ? tickLower : tickUpper,
        token0Value: token0AmountSortedByCA,
        token1Value: token1AmountSortedByCA,
        token0Decimals: token0SortedByCA.decimals,
        token1Decimals: token1SortedByCA.decimals
      }, userAddress)
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
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <TokenSelector
                chainId={chainId}
                onSelectionChange={(info: ERC20TokenInfo) => {
                  setSelectedToken0(info)
                }}
              />
              <TokenLivePrice 
                address={selectedToken0?.address}
                chainId={chainId}
              />
            </div>
            <div>
              <TokenSelector
                chainId={chainId}
                onSelectionChange={(info: ERC20TokenInfo) => {
                  setSelectedToken1(info)
                }}
              />
              <TokenLivePrice 
                address={selectedToken1?.address}
                chainId={chainId}
              />
            </div>
          </div>

          {
            selectedToken0 && selectedToken1 ? 
            <PoolSelector 
              tokens={[selectedToken0, selectedToken1]}
              chainId={chainId}
              selectedFeeTier={selectedFeeTier}
              onSelectPool={(selectedFeeTier: any) => setSelectedFeeTier(selectedFeeTier)}
            />
            : <></>
          }

          {/* <div className={`${!token0Name || !token1Name || !feeTier || VALID_FEE_TIERS.indexOf(feeTier) < 0 || availableFeeTiers.length === 0 ? "hidden" : "space-y-4"}`}>
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
                        value={selectedToken0Amount || ""}
                        onChange={(e) => setselectedToken0Amount(e.target.value)}
                        placeholder="0.0"
                      />
                    </FormControl>
                    {token0Price && !isNaN(Number(selectedToken0Amount)) && (
                      <div className="text-sm text-muted-foreground mt-1">
                        ≈ $
                        {(
                          Number(selectedToken0Amount) * Number(token0Price)
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
                        value={selectedToken1Amount || ""}
                        onChange={(e) => setselectedToken1Amount(e.target.value)}
                        placeholder="0.0"
                      />
                    </FormControl>
                    {token1Price && !isNaN(Number(selectedToken1Amount)) && (
                      <div className="text-sm text-muted-foreground mt-1">
                        ≈ $
                        {(
                          Number(selectedToken1Amount) * Number(token1Price)
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
          </div> */}
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
          <Button 
            disabled={!selectedToken0 || !selectedToken1 || !selectedFeeTier || !tickLower || !tickUpper
              // || !parseFloat(selectedToken0Amount || "0") || !parseFloat(selectedToken1Amount || "0") || parseFloat(selectedToken0Amount || "0") > parseFloat(token0Balance) || parseFloat(selectedToken1Amount || "0") > parseFloat(token1Balance)
            }
            onClick={onOpenPosition}>
            Create Position
          </Button>
        </div>
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
                // setFeeTier(INVALID_FEE_TIER)
                // setPageStatus(CREATE_POSITION_PAGE_STATE.PAGE_LOADED)
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
