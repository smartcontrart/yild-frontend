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
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ERROR_CODES, POSITION_DETAIL_PAGE_STATE } from "@/utils/types";
import { compoundFees } from "@/utils/position-manage";

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
      const { success, result } = await compoundFees(positionId, chainId)
      if (success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.POSITION_COMPOUNDED)
      }
      else if (result === ERROR_CODES.USER_REJECTED) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.USER_REJECTED)
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
        <>Loading...</>
        :
        <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)} modal>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Compound position
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Compound position</DialogTitle>
              <DialogDescription>
                Please input increase amounts.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button onClick={() => onClickCompound()}>Compound</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    </>
  )
}