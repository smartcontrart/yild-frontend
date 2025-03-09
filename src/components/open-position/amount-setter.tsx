import { ERC20TokenInfo } from "@/utils/constants"
import { Input } from "../ui/input"
import { useEffect, useState } from "react"
import { getRequiredToken0AmountFromToken1Amount, getRequiredToken1AmountFromToken0Amount, reArrangeTokensByContractAddress, tickToPrice } from "@/utils/functions"
import TokenLiveBalance from "../token/token-live-balance"
import { useAccount } from "wagmi"
import { useTokenBalance } from "@/hooks/use-token-balance"
import { parseUnits } from "viem"

export const AmountSetter = ({
  tokens,
  tickLower,
  tickUpper,
  token0Price,
  token1Price,
  onAmountsChange
}: {
  tokens: ERC20TokenInfo[],
  tickLower: number,
  tickUpper: number,
  token0Price: number,
  token1Price: number,
  onAmountsChange: Function
}) => {

  const { address: userAddress } = useAccount();
  const [isUserEditingForToken0, setIsUserEditingForToken0] = useState(false)
  const [token0Amount, setToken0Amount] = useState("0")
  const [token1Amount, setToken1Amount] = useState("0")
  const { data: token0Balance } = useTokenBalance(userAddress || "", tokens[0].address)
  const { data: token1Balance } = useTokenBalance(userAddress || "", tokens[1].address)  

  useEffect(() => {
    const [token0SortedByCA, token1SortedByCA] = reArrangeTokensByContractAddress(tokens)
    const priceForTickLower = tickToPrice(tickLower, token0SortedByCA.decimals, token1SortedByCA.decimals)
    const priceForTickUpper = tickToPrice(tickUpper, token0SortedByCA.decimals, token1SortedByCA.decimals)
    let priceLower = priceForTickLower < priceForTickUpper ? priceForTickLower : priceForTickUpper
    let priceUpper = priceForTickLower < priceForTickUpper ? priceForTickUpper : priceForTickLower
    const priceToken0SortedByCA = token0SortedByCA.address === tokens[0].address ? token0Price : token1Price
    const priceToken1SortedByCA = token0SortedByCA.address === tokens[0].address ? token1Price : token0Price
    let priceRatio = priceToken0SortedByCA / priceToken1SortedByCA
    
    if (isUserEditingForToken0) {
      const newToken1Amount = getRequiredToken1AmountFromToken0Amount(priceRatio, priceLower, priceUpper, Number(token0Amount))
      setToken1Amount(parseFloat(newToken1Amount.toFixed(token1SortedByCA.decimals)).toString())
      onAmountsChange({
        token0Amount: Number(token0Amount),
        token1Amount: parseFloat(newToken1Amount.toFixed(token1SortedByCA.decimals)),
      })
    }
    else {
      const newToken0Amount = getRequiredToken0AmountFromToken1Amount(priceRatio, priceLower, priceUpper, Number(token1Amount))
      setToken0Amount(parseFloat(newToken0Amount.toFixed(token0SortedByCA.decimals)).toString())
      onAmountsChange({
        token0Amount: parseFloat(newToken0Amount.toFixed(token0SortedByCA.decimals)),
        token1Amount: Number(token1Amount)
      })
    }
  }, [token0Amount, token1Amount, tickLower, tickUpper])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="">{tokens[0].symbol}</label>
        <Input
          placeholder="0.0"
          value={token0Amount}
          onChange={(e) => {
            setIsUserEditingForToken0(true)
            setToken0Amount((e.target.value) || "")
          }}
        />
        <TokenLiveBalance userAddress={userAddress} token={tokens[0]} />
        {
          parseUnits(token0Amount, tokens[0].decimals) > (token0Balance || BigInt(0)) 
          ?
          <span className="text-sm ml-2">Not enough tokens...</span>
          : <></>
        }
      </div>
      <div>
        <label htmlFor="">{tokens[1].symbol}</label>
        <Input
          placeholder="0.0"
          value={token1Amount}
          onChange={(e) => {
            setIsUserEditingForToken0(false)
            setToken1Amount((e.target.value) || "")
          }}
        />
        <TokenLiveBalance userAddress={userAddress} token={tokens[1]} />
        {
          parseUnits(token1Amount, tokens[1].decimals) > (token1Balance || BigInt(0)) 
          ?
          <span className="text-sm ml-2">Not enough tokens...</span>
          : <></>
        }
      </div>
    </div>
  )
}