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
import { Ban, Check, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ERROR_CODES, POSITION_DETAIL_PAGE_STATE } from "@/utils/types";
import { closePosition } from "@/utils/position-manage";
import { sendClosePositionReport } from "@/utils/requests";
import { Skeleton } from "../ui/skeleton";

export const ClosePosition = ({
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

  const onClickClose = async () => {
    try {
      setPageStatus(POSITION_DETAIL_PAGE_STATE.CLOSING_POSITION);
      const { success, result } = await closePosition(positionId, chainId);
      if (success) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.POSITION_CLOSED)
        await sendClosePositionReport(address as `0x${string}`, chainId, positionId)
      }
      else if (result === ERROR_CODES.USER_REJECTED) {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.USER_REJECTED)
      }
      else {
        setPageStatus(POSITION_DETAIL_PAGE_STATE.CLOSE_POSITION_FAILED)
      }
    } catch (error) {
      console.log(error)
      setPageStatus(POSITION_DETAIL_PAGE_STATE.CLOSE_POSITION_FAILED)
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
              <Ban className=" h-4 w-4" />
              Close position
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Close position</DialogTitle>
              <DialogDescription>
                Close the position and withdraw total funds...
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button onClick={() => onClickClose()}>
                <Check />
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    </>
  )
}