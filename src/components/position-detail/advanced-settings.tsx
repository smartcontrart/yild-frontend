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
import { getMaxSlippageForPosition, getTickBuffersForPosition, updateMaxSlippageForPosition, updateTickBuffers } from "@/utils/requests";
import { Skeleton } from "../ui/skeleton";
import { POSITION_DETAIL_PAGE_STATE } from "@/utils/types";
import { lightTheme } from "@rainbow-me/rainbowkit";
import { tickToPrice } from "@/utils/functions";

export const AdvancedSettings = ({
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
  const [upperTickBufferInput, setUpperTickBufferInput] = useState("")
  const [lowerTickBufferInput, setLowerTickBufferInput] = useState("")
  const [currentMaxSlippage, setCurrentMaxSlippage] = useState(0)
  const [currentUpperTickBuffer, setCurrentUpperTickBuffer] = useState(0)
  const [currentLowerTickBuffer, setCurrentLowerTickBuffer] = useState(0)
  const { data: positionStaticInfo, isLoading: isPositionStaticInfoLoading } = usePositionStaticInfo(address || "", positionId)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (positionId && chainId) {
      const fetchUpdatedMaxSlippage = async () => {
        const [newSlippage, buffers] = await Promise.all([
          getMaxSlippageForPosition(positionId, chainId),
          getTickBuffersForPosition(address || "", positionId, chainId)
        ])
        setCurrentMaxSlippage(newSlippage)
        setMaxSlippageInput(Number(newSlippage / 100).toString())
        const { upperTickBuffer: uTickBuffer, lowerTickBuffer: lTickBuffer } = buffers
        setCurrentLowerTickBuffer(lTickBuffer)
        setLowerTickBufferInput(Number(lTickBuffer / 100).toString())
        setCurrentUpperTickBuffer(uTickBuffer)
        setUpperTickBufferInput(Number(uTickBuffer / 100).toString())
      }
      fetchUpdatedMaxSlippage()
    }
  }, [positionId, chainId])

  const onClickUpdateMaxSlippage = async () => {
    setPageStatus(POSITION_DETAIL_PAGE_STATE.SETTING_MAX_SLIPPAGE)
    try {
      if (!maxSlippageInput)
        return
      const res = await updateMaxSlippageForPosition(positionId, chainId, parseInt((Number(maxSlippageInput) * 100).toString()))
      const re = await updateTickBuffers(positionId, parseInt((Number(upperTickBufferInput) * 100).toString()), parseInt((Number(lowerTickBufferInput) * 100).toString()))
      const newSlippage = await getMaxSlippageForPosition(positionId, chainId)
      const buffers = await getTickBuffersForPosition(address || "", positionId, chainId)
      const { upperTickBuffer: uTickBuffer, lowerTickBuffer: lTickBuffer } = buffers
      setCurrentLowerTickBuffer(lTickBuffer)
      setLowerTickBufferInput(Number(lTickBuffer / 100).toString())
      setCurrentUpperTickBuffer(uTickBuffer)
      setUpperTickBufferInput(Number(uTickBuffer / 100).toString())
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
              Advanced Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Proceed with caution, this is advanced settings...
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                Current Slippage: {Number(currentMaxSlippage) / 100} %
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  MaxSlippage
                </Label>
                <Input
                  type="number"
                  className="col-span-3"
                  placeholder="Type in new value here..."
                  onChange={(e) =>
                    setMaxSlippageInput(e.target.value)
                  }
                  value={maxSlippageInput}
                />
              </div>
              <div className="mt-8">
                Current LowerTickBuffer: {Number(currentLowerTickBuffer) / 100} %
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                LowerBuffer
                </Label>
                <Input
                  type="number"
                  className="col-span-3"
                  placeholder="Type in new value here..."
                  onChange={(e) =>
                    setLowerTickBufferInput(e.target.value)
                  }
                  value={lowerTickBufferInput}
                />
              </div>
              <div className="mt-8">
                Current UpperTickBuffer: {Number(currentUpperTickBuffer) / 100} %
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                UpperBuffer
                </Label>
                <Input
                  type="number"
                  className="col-span-3"
                  placeholder="Type in new value here..."
                  onChange={(e) =>
                    setUpperTickBufferInput(e.target.value)
                  }
                  value={upperTickBufferInput}
                />
              </div>
              
              {
                // (Number(upperTickBufferInput) > 0 || Number(lowerTickBufferInput)) ? (
                  <div>
                    <div>
                      New Tick Range
                    </div>
                    <div>
                      {tickToPrice(Math.floor(Number(positionStaticInfo.tickLower) * (100 - Number(lowerTickBufferInput)) / 100), positionStaticInfo.token0.decimals, positionStaticInfo.token1.decimals)} ~ {tickToPrice(Math.floor(Number(positionStaticInfo.tickUpper) * (100 + Number(upperTickBufferInput)) / 100), positionStaticInfo.token0.decimals, positionStaticInfo.token1.decimals)}
                    </div>
                  </div>
                // ) : (
                //   <></>
                // )
              }
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