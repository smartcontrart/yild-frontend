import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Check, Plus, PlusCircle } from "lucide-react";
import { useState } from "react";
import { usePositionStaticInfo } from "@/hooks/use-position-static-info";
import { useAccount } from "wagmi";
import { IncreaseLiquidityAmountSetter } from "./increase-liquidity-amount-setter";
import { ERROR_CODES, POSITION_DETAIL_PAGE_STATE } from "@/utils/types";
import { approveToken } from "@/utils/erc20";
import { increaseLiquidity } from "@/utils/position-manage";
import { getManagerContractAddressFromChainId } from "@/utils/constants";
import { Skeleton } from "../ui/skeleton";

export const IncreaseLiquidity = ({
  positionId,
  chainId,
  setPageStatus
}: {
  positionId: number,
  chainId: number,
  setPageStatus: Function
}) => {

  const { isConnected, address } = useAccount();
  const [increaseToken0Amount, setIncreaseToken0Amount] = useState("")
  const [increaseToken1Amount, setIncreaseToken1Amount] = useState("")
  const { data: positionStaticInfo, isLoading: isPositionStaticInfoLoading } = usePositionStaticInfo(address || "", positionId, chainId)
  const [dialogOpen, setDialogOpen] = useState(false)

  const onClickIncreaseLiquidity = async () => {
    if (!positionStaticInfo)
      return
    try {
      setPageStatus(POSITION_DETAIL_PAGE_STATE.APPROVING_TOKENS);
      const { token0, token1 } = positionStaticInfo

      const { success: approveToken0Success } = await approveToken(address as `0x${string}`, token0.address as `0x${string}`, getManagerContractAddressFromChainId(chainId), token0.decimals, increaseToken0Amount)
      if (!approveToken0Success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.TOKEN_APPROVE_FAILED)
        return
      }
      const { success: approveToken1Success } = await approveToken(address as `0x${string}`, token1.address as `0x${string}`, getManagerContractAddressFromChainId(chainId), token1.decimals, increaseToken1Amount)
      if (!approveToken1Success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.TOKEN_APPROVE_FAILED)
        return
      }

      setPageStatus(POSITION_DETAIL_PAGE_STATE.INCREASING_LIQUIDITY);
      const { success: addLiquiditySuccess, result } = await increaseLiquidity(chainId, {
        tokenId: positionId,
        amount0: increaseToken0Amount,
        amount1: increaseToken1Amount,
        decimals0: token0.decimals,
        decimals1: token1.decimals
      })
      if (addLiquiditySuccess) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.LIQUIDITY_INCREASED)
        setDialogOpen(false)
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
  }

  return (
    <>
      {
        (!isConnected || isPositionStaticInfoLoading) ? 
        <Skeleton className="h-[36px] rounded-l" />
        :
        <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)} modal>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)} variant="outline" >
              <Plus className="h-4 w-4" />
              Increase Liquidity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Increase Liquidity</DialogTitle>
              <DialogDescription>
                Deposit more tokens, earn more fee...
              </DialogDescription>
            </DialogHeader>
            <IncreaseLiquidityAmountSetter 
              token0={positionStaticInfo?.token0}
              token1={positionStaticInfo?.token1}
              tickLower={positionStaticInfo?.tickLower}
              tickUpper={positionStaticInfo?.tickUpper}
              token0Amount={increaseToken0Amount}
              token1Amount={increaseToken1Amount}
              chainId={chainId}
              onValuesChange={(data: any) => {
                if (typeof data.token0Amount === "string") setIncreaseToken0Amount(data.token0Amount.toString())
                if (typeof data.token1Amount === "string") setIncreaseToken1Amount(data.token1Amount.toString())
              }}
            />
            <DialogFooter>
              <Button disabled={!Number(increaseToken0Amount) || Number(increaseToken0Amount) <= 0 || !Number(increaseToken1Amount) || Number(increaseToken1Amount) <= 0} onClick={() => onClickIncreaseLiquidity()}>
                <Check />Deposit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    </>
  )
}