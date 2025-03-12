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
import { Check, PiggyBank, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ERROR_CODES, POSITION_DETAIL_PAGE_STATE } from "@/utils/types";
import { collectFees } from "@/utils/position-manage";
import { usePositionFundsInfo } from "@/hooks/use-position-funds-info";
import FeeCollectEstimator from "./fee-collect-estimator";
import { Skeleton } from "../ui/skeleton";

export const CollectFees = ({
  positionId,
  chainId,
  setPageStatus
}: {
  positionId: number,
  chainId: number,
  setPageStatus: Function
}) => {

  const { isConnected, address } = useAccount();
  const { data: positionFundsInfo, isLoading: isPositionFundsInfoLoading } = usePositionFundsInfo(positionId, chainId)
  const [dialogOpen, setDialogOpen] = useState(false)

  const onClickCollect = async () => {
    if (!positionFundsInfo)
      return
    try {
      setPageStatus(POSITION_DETAIL_PAGE_STATE.COLLECTING_FEES);
      const { success, result } = await collectFees(positionId, chainId, address || "")
      if (success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.FEES_COLLECTED)
      }
      else if (result === ERROR_CODES.USER_REJECTED) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.USER_REJECTED)
      }
      else {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.COLLECT_FEES_FAILED)
      }
    } catch (error) {
      console.log(error)
      setPageStatus(POSITION_DETAIL_PAGE_STATE.COLLECT_FEES_FAILED)
    }
  }

  return (
    <>
      {
        (!isConnected || isPositionFundsInfoLoading) ? 
        <Skeleton className="h-[36px] rounded-l" />
        :
        <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)} modal>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <PiggyBank className="h-4 w-4" />
              Collect Fees
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Collect Fees Earned</DialogTitle>
              <DialogDescription>
                You are going to collect...
              </DialogDescription>
            </DialogHeader>
            <FeeCollectEstimator 
              positionId={positionId}
              chainId={chainId}
              fundsInfo={positionFundsInfo}
            />
            <DialogFooter>
              <Button onClick={() => onClickCollect()}>
                <Check />
                Collect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    </>
  )
}