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
import { useEffect, useState } from "react";
import { usePositionStaticInfo } from "@/hooks/use-position-static-info";
import { useAccount } from "wagmi";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { getMaxSlippageForPosition, updateMaxSlippageForPosition } from "@/utils/requests";

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
    try {
      if (!maxSlippageInput)
        return
      const res = await updateMaxSlippageForPosition(positionId, chainId, parseInt(maxSlippageInput))
      const newSlippage = await getMaxSlippageForPosition(positionId, chainId)
      setCurrentMaxSlippage(newSlippage)
  } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      {
        (!isConnected || isPositionStaticInfoLoading) ? 
        <>Loading...</>
        :
        <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)} modal>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <MinusCircle className="mr-2 h-4 w-4" />
              Set Max Slippage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Set Max Slippage</DialogTitle>
              <DialogDescription>
                Please input decrease amounts in terms of %.
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
                You are going to set {maxSlippageInput} to MaxSlippage for this position.
              </div>
            </div>
            <DialogFooter>
              <Button onClick={onClickUpdateMaxSlippage}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    </>
  )
}