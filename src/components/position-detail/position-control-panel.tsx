import { ClosePosition } from "./close-position";
import { CollectFees } from "./collect-fees";
import { CompoundPosition } from "./compound-position";
import { DecreaseLiquidity } from "./decrease-liquidity";
import { IncreaseLiquidity } from "./increase-liquidity";
import { SetMaxSlippage } from "./set-max-slippage";

export default function PositionControlPanel({
  positionId,
  chainId,
  setPageStatus
}: {
  positionId: number,
  chainId: number,
  setPageStatus: Function
}) {

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <IncreaseLiquidity 
        positionId={positionId}
        chainId={chainId} 
        setPageStatus={(newPageStatus: any) => setPageStatus(newPageStatus)} 
      />
      <DecreaseLiquidity
        positionId={positionId}
        chainId={chainId} 
        setPageStatus={(newPageStatus: any) => setPageStatus(newPageStatus)} 
      />
      <CollectFees
        positionId={positionId}
        chainId={chainId}
        setPageStatus={(newPageStatus: any) => setPageStatus(newPageStatus)}
      />
      <CompoundPosition
        positionId={positionId}
        chainId={chainId}
        setPageStatus={(newPageStatus: any) => setPageStatus(newPageStatus)}
      />
      <ClosePosition
        positionId={positionId}
        chainId={chainId}
        setPageStatus={(newPageStatus: any) => setPageStatus(newPageStatus)}
      />
      <SetMaxSlippage 
        positionId={positionId}
        chainId={chainId}
        setPageStatus={(newPageStatus: any) => setPageStatus(newPageStatus)}
      />
    </div>
  )
}