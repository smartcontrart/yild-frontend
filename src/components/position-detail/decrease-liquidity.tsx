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
import { MinusCircle } from "lucide-react";
import { useState } from "react";
import { usePositionStaticInfo } from "@/hooks/use-position-static-info";
import { useAccount } from "wagmi";
import { ERROR_CODES, POSITION_DETAIL_PAGE_STATE } from "@/utils/types";
import { decreaseLiquidity } from "@/utils/position-manage";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

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
  const { data: positionStaticInfo, isLoading: isPositionStaticInfoLoading } = usePositionStaticInfo(address || "", positionId, chainId)
  const [dialogOpen, setDialogOpen] = useState(false)

  const onClickDecreaseLiquidity = async () => {
    if (!positionStaticInfo)
      return
    const amountInBPS = parseInt((parseFloat(decreaseRatio) * 100).toFixed(0))
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
        <>Loading...</>
        :
        <Dialog open={dialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <MinusCircle className="mr-2 h-4 w-4" />
              Decrease Position
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Decrease Position</DialogTitle>
              <DialogDescription>
                Please input decrease amounts in terms of %.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Decrease %
                </Label>
                <Input
                  type="number"
                  className="col-span-3"
                  onChange={(e) =>
                    setDecreaseRatio(e.target.value)
                  }
                  value={decreaseRatio}
                />
              </div>
              <div>
                You are going to decrease {decreaseRatio}% of your position.
              </div>
            </div>
            <DialogFooter>
              <Button disabled={!decreaseRatio || !parseFloat(decreaseRatio) ||parseFloat(decreaseRatio) < 0.1 || parseFloat(decreaseRatio) > 99} onClick={onClickDecreaseLiquidity}>Decrease</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    </>
  )
}