import { useEffect, useState } from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { ERC20TokenInfo } from "@/utils/constants"
import { useTokenPrice } from "@/hooks/use-token-price"
import { getRequiredToken0AmountFromToken1Amount, getRequiredToken1AmountFromToken0Amount, roundDown, tickToPrice } from "@/utils/functions"
import { useTokenBalance } from "@/hooks/use-token-balance"
import { useAccount } from "wagmi"
import { formatUnits, parseUnits } from "viem"

export const IncreaseLiquidityAmountSetter = ({
  token0,
  token1,
  tickLower,
  tickUpper,
  token0Amount,
  token1Amount,
  chainId,
  onValuesChange
}: {
  token0: ERC20TokenInfo,
  token1: ERC20TokenInfo,
  tickLower: number,
  tickUpper: number,
  token0Amount: string,
  token1Amount: string,
  chainId: number,
  onValuesChange: Function
}) => {
  const { address: userAddress } = useAccount()
  const [isUserEditingForToken0, setIsUserEditingForToken0] = useState(true)
  const [increaseToken0Amount, setIncreaseToken0Amount] = useState(token0Amount)
  const [increaseToken1Amount, setIncreaseToken1Amount] = useState(token1Amount)
  const { data: token0Price } = useTokenPrice(token0.address, chainId)
  const { data: token1Price } = useTokenPrice(token1.address, chainId)
  const {data: token0Balance, isLoading: isToken0BalanceLoading} = useTokenBalance(userAddress || "", token0.address, chainId)
  const {data: token1Balance, isLoading: isToken1BalanceLoading} = useTokenBalance(userAddress || "", token1.address, chainId)

  useEffect(() => {
    const priceForTickLower = tickToPrice(tickLower, token0.decimals, token1.decimals)
    const priceForTickUpper = tickToPrice(tickUpper, token0.decimals, token1.decimals)
    let priceLower = priceForTickLower < priceForTickUpper ? priceForTickLower : priceForTickUpper
    let priceUpper = priceForTickLower < priceForTickUpper ? priceForTickUpper : priceForTickLower
    let priceRatio = Number(token0Price) / Number(token1Price)
    
    if (isUserEditingForToken0) {
      const newToken1Amount = getRequiredToken1AmountFromToken0Amount(priceRatio, priceLower, priceUpper, Number(increaseToken0Amount))
      onValuesChange({
        token0Amount: increaseToken0Amount,
        token1Amount: parseFloat(roundDown(newToken1Amount, token1.decimals)).toString()
      })
    }
    else {
      const newToken0Amount = getRequiredToken0AmountFromToken1Amount(priceRatio, priceLower, priceUpper, Number(increaseToken1Amount))
      onValuesChange({
        token0Amount: parseFloat(roundDown(newToken0Amount, token0.decimals)).toString(),
        token1Amount: increaseToken1Amount
      })
    }
  }, [increaseToken0Amount, increaseToken1Amount])
    
  return (
    <>
      {
        (!token0 || !token1) ?
        <>LOADING...</>
        :
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {token0?.symbol}
            </Label>
            <Input
              type="number"
              className="col-span-3"
              onChange={(e) => {
                setIsUserEditingForToken0(true)
                setIncreaseToken0Amount(e.target.value)
              }}
              value={token0Amount}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label ></Label>
            <div className="col-span-3 text-sm">
              Available: {formatUnits(BigInt(token0Balance || 0), token0.decimals)}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {token1?.symbol}
            </Label>
            <Input
              type="number"
              className="col-span-3"
              onChange={(e) => {
                setIsUserEditingForToken0(false)
                setIncreaseToken1Amount(e.target.value)
              }}
              value={token1Amount}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label ></Label>
            <div className="col-span-3 text-sm">
              Available: {formatUnits(BigInt(token1Balance || 0), token1.decimals)}
            </div>
          </div>
        </div>
      }
    </>
  )
}