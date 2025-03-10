import ERC20Image from "@/components/common/erc20-image";
import { ERC20TokenInfo } from "@/utils/constants";
import { getERC20TokenInfo } from "@/utils/erc20";
import { getAccountingUnitFromAddress } from "@/utils/position-manage";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";

export default function Settings() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [accountingUnit, setAccountingUnit] = useState<ERC20TokenInfo | null>(null)

  useEffect(() => {
    if (address) {
      const fetchAccountingUnit = async () => {
        const accountingUnitAddress = await getAccountingUnitFromAddress(address, chainId)
        const unit = await getERC20TokenInfo(accountingUnitAddress, chainId)
        setAccountingUnit(unit)
      }
      fetchAccountingUnit()
    }
  }, [address])

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

  if (!accountingUnit) {
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
          tokenAddress={accountingUnit.address}
        />
        <span>{accountingUnit?.symbol}</span>
      </div>
      <div>
        Set other token as accounting unit.
      </div>
    </div>
  )
}