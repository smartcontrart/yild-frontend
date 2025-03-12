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
import { Check, MinusCircle, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { usePositionStaticInfo } from "@/hooks/use-position-static-info";
import { useAccount } from "wagmi";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { getMaxSlippageForPosition, updateMaxSlippageForPosition } from "@/utils/requests";
import { Skeleton } from "../ui/skeleton";
import { POSITION_DETAIL_PAGE_STATE } from "@/utils/types";

export const SetMaxSlippage = ({
  positionId,
  chainId,
  setPageStatus
}: {
  positionId: number,
  chainId: number,
  setPageStatus: Function
}) => {

  const { isConnected, address } = useAccount();
  const [maxSlippageInput, setMaxSlippageInput] = useState("")
  const [currentMaxSlippage, setCurrentMaxSlippage] = useState(0)
  const { data: positionStaticInfo, isLoading: isPositionStaticInfoLoading } = usePositionStaticInfo(address || "", positionId, chainId)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (positionId && chainId) {
      const fetchUpdatedMaxSlippage = async () => {
        const newSlippage = await getMaxSlippageForPosition(positionId, chainId)
        setCurrentMaxSlippage(newSlippage)
      }
      fetchUpdatedMaxSlippage()
    }
  }, [positionId, chainId])

  const onClickUpdateMaxSlippage = async () => {
    setPageStatus(POSITION_DETAIL_PAGE_STATE.SETTING_MAX_SLIPPAGE)
    try {
      if (!maxSlippageInput)
        return
      const res = await updateMaxSlippageForPosition(positionId, chainId, parseInt(maxSlippageInput))
      const newSlippage = await getMaxSlippageForPosition(positionId, chainId)
      setCurrentMaxSlippage(newSlippage)
      setPageStatus(POSITION_DETAIL_PAGE_STATE.SET_MAX_SLIPPAGE)
    } catch (error) {
      console.log(error)
      setPageStatus(POSITION_DETAIL_PAGE_STATE.SET_MAX_SLIPPAGE_FAILED)
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
              <Wrench className=" h-4 w-4" />
              Set Max Slippage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Set Max Slippage</DialogTitle>
              <DialogDescription>
                You are going to set max slippage for failsafe options...
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                Current Slippage: {currentMaxSlippage}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  MaxSlippage
                </Label>
                <Input
                  type="number"
                  className="col-span-3"
                  onChange={(e) =>
                    setMaxSlippageInput(e.target.value)
                  }
                  value={maxSlippageInput}
                />
              </div>
              <div>
                Proceed with caution, this is advanced setting.
              </div>
            </div>
            <DialogFooter>
              <Button onClick={onClickUpdateMaxSlippage}>
                <Check />
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    </>
  )
}