import { useEffect, useState } from "react"
import { PoolInfo } from "./pool-info"
import { ERC20TokenInfo, INVALID_FEE_TIER } from "@/utils/constants"
import { reArrangeTokensByContractAddress } from "@/utils/functions"
import { getAvailablePools } from "@/utils/position-manage"

export default function PoolSelector({
  tokens,
  chainId,
  selectedFeeTier,
  onSelectPool
}: {
  tokens: ERC20TokenInfo[],
  chainId: number,
  selectedFeeTier: any,
  onSelectPool: Function
}) {

  if (!tokens || tokens.length != 2 || !tokens[0] || !tokens[1])
    return <></>

  const [availableFeeTiers, setAvailableFeeTiers] = useState<any[]>([])
  // const [selected, setSelected] = useState<number | null>(INVALID_FEE_TIER)

  useEffect(() => {
    onSelectPool(INVALID_FEE_TIER)
    const getPoolAddressFunc = async () => {
      if (!tokens || tokens.length != 2 || !tokens[0] || !tokens[1]) {
        setAvailableFeeTiers([])
        return
      }
      const [token0SortedByCA, token1SortedByCA] = reArrangeTokensByContractAddress(tokens)
      const [pool100, pool500, pool3000, pool10000] = await getAvailablePools(token0SortedByCA.address, token1SortedByCA.address, chainId)
      let temp = []
      if (pool100) temp.push(pool100)
      if (pool500) temp.push(pool500)
      if (pool3000) temp.push(pool3000)
      if (pool10000) temp.push(pool10000)
      setAvailableFeeTiers(temp)
    }
    getPoolAddressFunc()
  }, [])

  return (
    <>
      {
        availableFeeTiers.length > 0 ? 
        <div>Select one of the pools below to provide liquidity</div> : <></>
      }

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {
          availableFeeTiers.map((elem) => (
            <PoolInfo 
              key={`FeeTier_${elem?.feeTier}`}
              tokens={tokens}
              address={elem?.poolAddress} 
              feeTier={elem?.feeTier} 
              token0BalanceInPool={Number(elem.balance0) / (10 ** tokens[0].decimals)}
              token1BalanceInPool={Number(elem.balance1) / (10 ** tokens[1].decimals)}
              chainId={chainId}
              selected={selectedFeeTier === elem.feeTier}
              onClickPool={() => onSelectPool(elem.feeTier)} 
            />
          ))
        }
        {
          availableFeeTiers.length === 0 ? 
          <>No pools available for this pair. Please choose other tokens.</> : <></>
        }
      </div>
    </>
  )
}