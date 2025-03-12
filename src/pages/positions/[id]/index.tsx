"use client";

import { useRouter } from "next/router";
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
import { useAccount, useChainId } from "wagmi";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { POSITION_DETAIL_PAGE_STATE } from "@/utils/types";
import { PositionInfo } from "@/components/position-detail/position-info";
import PositionControlPanel from "@/components/position-detail/position-control-panel";
import { YildLoading } from "@/components/global/yild-loading";

export default function PositionPage() {
  const { isConnected, address, isDisconnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const { toast } = useToast();
  const [pageStatus, setPageStatus] = useState(POSITION_DETAIL_PAGE_STATE.PAGE_LOADED);

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
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.SET_MAX_SLIPPAGE)
      toast({
        variant: "default",
        title: "Info",
        description: "Successfully updated max slippage",
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
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.SET_MAX_SLIPPAGE_FAILED)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update max slippage",
      })
    if (pageStatus === POSITION_DETAIL_PAGE_STATE.PARASWAP_ERROR)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch appropriate liquidity/router from Paraswap, please try again later.",
      })
  }, [pageStatus])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <YildLoading loading={!isDisconnected && !isConnected} />
        <h2 className="text-2xl font-bold mb-4">
          Connect your wallet to continue
        </h2>
        <p className="text-muted-foreground">
          Please connect your wallet to manage your LP position
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <YildLoading loading={!isDisconnected && !isConnected} />
      {
        (!Number(router.query.id) || !chainId)
        ? <>Loading Panel...</>
        :
        <>
          <PositionInfo positionId={Number(router.query.id)} />
          <PositionControlPanel 
            positionId={Number(router.query.id)} 
            chainId={chainId} 
            setPageStatus={(newPageStatus: any) => setPageStatus(newPageStatus)} 
          />
        </>
      }

      <AlertDialog
        open={
          pageStatus === POSITION_DETAIL_PAGE_STATE.APPROVING_TOKENS ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.CLOSING_POSITION ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.COLLECTING_FEES ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.COMPOUNDING_POSITION ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.DECREASING_LIQUIDITY ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.INCREASING_LIQUIDITY ||
          pageStatus === POSITION_DETAIL_PAGE_STATE.SETTING_MAX_SLIPPAGE
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
                : pageStatus === POSITION_DETAIL_PAGE_STATE.SETTING_MAX_SLIPPAGE
                ? "Updating max slippage, this might take a second."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
