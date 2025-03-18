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
import { Check, PlusCircle, Recycle } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ERROR_CODES, POSITION_DETAIL_PAGE_STATE } from "@/utils/types";
import { compoundFees } from "@/utils/position-manage";
import { Skeleton } from "../ui/skeleton";

export const CompoundPosition = ({
  positionId,
  chainId,
  setPageStatus
}: {
  positionId: number,
  chainId: number,
  setPageStatus: Function
}) => {

  const { isConnected, address } = useAccount();
  const [dialogOpen, setDialogOpen] = useState(false)

  const onClickCompound = async () => {
    try {
      setPageStatus(POSITION_DETAIL_PAGE_STATE.COMPOUNDING_POSITION)
      const { success, result } = await compoundFees(positionId, chainId)
      if (success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.POSITION_COMPOUNDED)
      }
      else if (result === ERROR_CODES.USER_REJECTED) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.USER_REJECTED)
      }
      else if (result === ERROR_CODES.NOT_ENOUGH_FEES_EARNED) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.NOT_ENOUGH_FEES_EARNED)
      }
      else if (result === ERROR_CODES.UNKNOWN_ERROR) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.PARASWAP_ERROR)
      }
      else {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.COMPOUND_POSITION_FAILED)
      }
    } catch (error) {
      console.log(error)
      setPageStatus(POSITION_DETAIL_PAGE_STATE.COMPOUND_POSITION_FAILED)
    }
  }

  return (
    <>
      {
        (!isConnected) ? 
        <Skeleton className="h-[36px] rounded-l" />
        :
        <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)} modal>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Recycle className=" h-4 w-4" />
              Compound Liquidity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Compound Liquidity</DialogTitle>
              <DialogDescription>
                Deposit fees earned back into the liquidity...
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button onClick={() => onClickCompound()}>
                <Check />
                Compound
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    </>
  )
}