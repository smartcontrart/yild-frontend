import ERC20Image from "@/components/common/erc20-image";
import { ERC20TokenInfo } from "@/utils/constants";
import { getERC20TokenInfo } from "@/utils/erc20";
import { getAccountingUnitFromAddress, setAccountingUnit } from "@/utils/position-manage";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MinusCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { TokenSelector } from "@/components/token/token-selector";

export default function Settings() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [currentAccountingUnit, setCurrentAccountingUnit] = useState<ERC20TokenInfo | null>(null)
  const [newUnitAddress, setNewUnitAddress] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (address) {
      const fetchAccountingUnit = async () => {
        const accountingUnitAddress = await getAccountingUnitFromAddress(address, chainId)
        const unit = await getERC20TokenInfo(accountingUnitAddress, chainId)
        setCurrentAccountingUnit(unit)
      }
      fetchAccountingUnit()
    }
  }, [address])

  const updateAccountingUnit = async () => {
    if (address && newUnitAddress && chainId) {
      await setAccountingUnit(newUnitAddress, chainId)
      const newAccountingUnit = await getAccountingUnitFromAddress(address, chainId)
      setCurrentAccountingUnit(newAccountingUnit)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">
          Connect your wallet to continue
        </h2>
        <p className="text-muted-foreground">
          Please connect your wallet to manage your settings on YildFinance smart contract
        </p>
      </div>
    );
  }

  if (!currentAccountingUnit) {
    return (
      <>Loading...</>
    )
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-xl font-bold mb-4">
        Your Accounting Unit
      </h2>
      <div className="flex flex-row gap-2">
        <ERC20Image 
          chainId={chainId}
          tokenAddress={currentAccountingUnit.address}
        />
        <span>{currentAccountingUnit?.symbol}</span>
      </div>
      <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)} modal>
        <DialogTrigger asChild>
          <Button onClick={() => setDialogOpen(true)}>
            <MinusCircle className="mr-2 h-4 w-4" />
            Update Accounting Unit
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
            <div className="flex flex-row gap-2">
              <Label htmlFor="name" className="text-right">Current Accounting Unit: </Label>
              <ERC20Image 
                chainId={chainId}
                tokenAddress={currentAccountingUnit.address}
              />
              <span>{currentAccountingUnit?.symbol}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                New Accounting Unit
              </Label>
              <TokenSelector
                chainId={chainId}
                onSelectionChange={(info) => {
                  if (info && info.address && info.address !== currentAccountingUnit.address) {
                    setNewUnitAddress(info.address)
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={updateAccountingUnit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}