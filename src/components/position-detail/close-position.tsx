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
import { closePosition } from "@/utils/position-manage";
import { sendClosePositionReport } from "@/utils/requests";

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
        <>Loading...</>
        :
        <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)} modal>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Close position
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Close position</DialogTitle>
              <DialogDescription>
                Please input increase amounts.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button onClick={() => onClickClose()}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    </>
  )
}