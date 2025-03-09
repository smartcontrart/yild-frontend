"use client";
import {
  useAccount,
  useChainId,
  usePublicClient,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { TokenSelector } from "@/components/token/token-selector";
import { useState, useEffect } from "react";
import { reArrangeTokensByContractAddress } from "@/utils/functions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { openPosition } from "@/utils/position-manage";
import { approveToken } from "@/utils/erc20";
import { CREATE_POSITION_PAGE_STATE } from "@/utils/types";
import { ERC20TokenInfo, INVALID_FEE_TIER, getManagerContractAddressFromChainId } from "@/utils/constants";
import TokenLivePrice from "@/components/token/token-live-price";
import PoolSelector from "@/components/pool/pool-selector";
import { RangeAndAmountSetter } from "@/components/open-position/range-and-amount-setter";

export default function NewPositionPage() {
  const { isConnected, address: userAddress } = useAccount();
  const { toast } = useToast();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const router = useRouter();

  const [pageStatus, setPageStatus] = useState<string | null>(CREATE_POSITION_PAGE_STATE.PAGE_LOADING);
  const [selectedToken0, setSelectedToken0] = useState<ERC20TokenInfo | null>(null);
  const [selectedToken1, setSelectedToken1] = useState<ERC20TokenInfo | null>(null);
  const [sortedToken0Amount, setSortedToken0Amount] = useState(0)
  const [sortedToken1Amount, setSortedToken1Amount] = useState(0)
  const [selectedFeeTier, setSelectedFeeTier] = useState(INVALID_FEE_TIER)
  const [tickUpper, setTickUpper] = useState(0)
  const [tickLower, setTickLower] = useState(0)

  useEffect(() => {
    setSelectedFeeTier(INVALID_FEE_TIER)
  }, [selectedToken0, selectedToken1])

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

  const onOpenPosition = async () => {
    if (!selectedToken0 || !selectedToken1)
      return

    const [token0SortedByCA, token1SortedByCA] = reArrangeTokensByContractAddress([selectedToken0, selectedToken1])

    if (!userAddress || !selectedFeeTier || !tickUpper || !tickLower || !userAddress)
      return
    
    try {
      setPageStatus(CREATE_POSITION_PAGE_STATE.APPROVING_TOKENS);
      const { success: approveToken0Success } = await approveToken(userAddress, token0SortedByCA.address, getManagerContractAddressFromChainId(chainId), token0SortedByCA.decimals, sortedToken0Amount)
      if (!approveToken0Success) {
        setPageStatus(CREATE_POSITION_PAGE_STATE.TOKEN_APPROVE_FAILED)
        return
      }
      const { success: approveToken1Success } = await approveToken(userAddress, token1SortedByCA.address, getManagerContractAddressFromChainId(chainId), token1SortedByCA.decimals, sortedToken1Amount)
      if (!approveToken1Success) {
        setPageStatus(CREATE_POSITION_PAGE_STATE.TOKEN_APPROVE_FAILED)
        return
      }

      setPageStatus(CREATE_POSITION_PAGE_STATE.OPENING_POSITION);
      const { success: openPositionSuccess, result } = await openPosition(publicClient, chainId, {
        token0Address: token0SortedByCA.address,
        token1Address: token1SortedByCA.address,
        feeTier: selectedFeeTier,
        tickUpper: tickUpper > tickLower ? tickUpper : tickLower,
        tickLower: tickLower < tickUpper ? tickLower : tickUpper,
        token0Value: sortedToken0Amount,
        token1Value: sortedToken1Amount,
        token0Decimals: token0SortedByCA.decimals,
        token1Decimals: token1SortedByCA.decimals
      }, userAddress)
      if (!openPositionSuccess) {
        setPageStatus(CREATE_POSITION_PAGE_STATE.OPEN_POSITION_FAILED)
        return
      }
      setPageStatus(CREATE_POSITION_PAGE_STATE.POSITION_OPENED)
    } catch(err) {
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

          {
            selectedToken0 && selectedToken1 && selectedFeeTier ?
            <RangeAndAmountSetter 
              tokens={[selectedToken0, selectedToken1]}
              chainId={chainId}
              selectedFeeTier={selectedFeeTier}
              tickLower={tickLower}
              tickUpper={tickUpper}
              token0Amount={sortedToken0Amount}
              token1Amount={sortedToken1Amount}
              onInfoChange={(data: any) => {
                if (typeof data.tickLower === "number")
                  setTickLower(data.tickLower);
                if (typeof data.tickUpper === "number")
                  setTickUpper(data.tickUpper);
                if (typeof data.token0Amount === "number")
                  setSortedToken0Amount(data.token0Amount);
                if (typeof data.token1Amount === "number")
                  setSortedToken1Amount(data.token1Amount);
              }}
            />
            : <></>
          }
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
            disabled={!selectedToken0 || !selectedToken1 || !selectedFeeTier || !tickLower || !tickUpper}
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
                setSelectedFeeTier(INVALID_FEE_TIER)
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
