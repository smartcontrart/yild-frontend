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
import { Check, Minus, MinusCircle } from "lucide-react";
import { useState } from "react";
import { usePositionStaticInfo } from "@/hooks/use-position-static-info";
import { useAccount } from "wagmi";
import { ERROR_CODES, POSITION_DETAIL_PAGE_STATE } from "@/utils/types";
import { decreaseLiquidity } from "@/utils/position-manage";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { usePositionFundsInfo } from "@/hooks/use-position-funds-info";
import { formatUnits } from "viem";
import { roundDown } from "@/utils/functions";

export const DecreaseLiquidity = ({
  positionId,
  chainId,
  setPageStatus
}: {
  positionId: number,
  chainId: number,
  setPageStatus: Function
}) => {

  const { isConnected, address } = useAccount();
  const [decreaseRatio, setDecreaseRatio] = useState("")
  const { data: positionFundsInfo, isLoading: isPositionFundsInfoLoading } = usePositionFundsInfo(positionId, chainId)
  const { data: positionStaticInfo, isLoading: isPositionStaticInfoLoading } = usePositionStaticInfo(address || "", positionId)
  const [dialogOpen, setDialogOpen] = useState(false)

  const onClickDecreaseLiquidity = async () => {
    if (!positionStaticInfo)
      return
    const amountInBPS = parseInt(roundDown((parseFloat(decreaseRatio) * 100), 0))
    try {
      setPageStatus(POSITION_DETAIL_PAGE_STATE.DECREASING_LIQUIDITY);
      const { success, result } = await decreaseLiquidity(positionId, chainId, amountInBPS);
      if (success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.LIQUIDITY_DECREASED)
        setDialogOpen(false)
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
  }

  return (
    <>
      {
        (!isConnected || isPositionStaticInfoLoading) ? 
        <Skeleton className="h-[36px] rounded-l" />
        :
        <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)} modal>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Minus className="h-4 w-4" />
              Decrease Liquidity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Decrease Liquidity</DialogTitle>
              <DialogDescription>
                Withdraw some portion of current liquidity...
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-row gap-2 items-center">
              <div>
                Withdraw
              </div>
              <div className="grid items-center gap-1">
                <Input
                  type="number"
                  className="w-24"
                  onChange={(e) =>
                    setDecreaseRatio(e.target.value)
                  }
                  value={decreaseRatio}
                />
              </div>
              <div>
                % of the position.
              </div>
            </div>
            <div className={` flex-col gap-2 items-center ${Number(decreaseRatio) >= 100 || Number(decreaseRatio) < 1 ? "hidden" : "flex"}`}>
              <div>{(Number(formatUnits(positionFundsInfo.principal0, positionStaticInfo.token0?.decimals)) * Number(decreaseRatio) / 100).toFixed(6)} {positionStaticInfo.token0.symbol}</div>
              <div>{(Number(formatUnits(positionFundsInfo.principal1, positionStaticInfo.token1?.decimals)) * Number(decreaseRatio) / 100).toFixed(6)} {positionStaticInfo.token1.symbol}</div>
            </div>
            <DialogFooter>
              <Button disabled={!decreaseRatio || !parseFloat(decreaseRatio) ||parseFloat(decreaseRatio) < 0.1 || parseFloat(decreaseRatio) > 99} onClick={onClickDecreaseLiquidity}>
                <Check />
                Withdraw
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    </>
  )
}