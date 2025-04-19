import { ERC20TokenInfo } from "@/utils/constants"
import { Input } from "../ui/input"
import { useEffect, useState } from "react"
import { getRequiredToken0AmountFromToken1Amount, getRequiredToken1AmountFromToken0Amount, reArrangeTokensByContractAddress, roundDown, tickToPrice } from "@/utils/functions"
import TokenLiveBalance from "../token/token-live-balance"
import { useAccount } from "wagmi"
import { useTokenBalance } from "@/hooks/use-token-balance"
import { formatUnits, parseUnits } from "viem"
import SetPercentageButtons from "./set-percentage-buttons"

export const AmountSetter = ({
  tokens,
  tickLower,
  tickUpper,
  token0Price,
  token1Price,
  onAmountsChange,
  chainId
}: {
  tokens: ERC20TokenInfo[],
  tickLower: number,
  tickUpper: number,
  token0Price: number,
  token1Price: number,
  onAmountsChange: Function,
  chainId: number
}) => {

  const { address: userAddress } = useAccount();
  const [isUserEditingForToken0, setIsUserEditingForToken0] = useState(false)
  const [token0Amount, setToken0Amount] = useState("0")
  const [token1Amount, setToken1Amount] = useState("0")
  const { data: token0Balance } = useTokenBalance(userAddress || "", tokens[0].address, chainId)
  const { data: token1Balance } = useTokenBalance(userAddress || "", tokens[1].address, chainId)  

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
      setToken1Amount(parseFloat(roundDown(newToken1Amount, token1SortedByCA.decimals)).toString())
      onAmountsChange({
        token0Amount: Number(token0Amount),
        token1Amount: parseFloat(roundDown(newToken1Amount, token1SortedByCA.decimals)),
      })
    }
    else {
      const newToken0Amount = getRequiredToken0AmountFromToken1Amount(priceRatio, priceLower, priceUpper, Number(token1Amount))
      setToken0Amount(parseFloat(roundDown(newToken0Amount, token0SortedByCA.decimals)).toString())
      onAmountsChange({
        token0Amount: parseFloat(roundDown(newToken0Amount, token0SortedByCA.decimals)),
        token1Amount: Number(token1Amount)
      })
    }
  }, [token0Amount, token1Amount, tickLower, tickUpper])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label htmlFor="">{tokens[0].symbol}</label>
        <Input
          className={parseUnits(token0Amount, tokens[0].decimals) > (token0Balance || BigInt(0)) ? "text-destructive" : ""}
          placeholder="0.0"
          value={token0Amount}
          onChange={(e) => {
            setIsUserEditingForToken0(true)
            setToken0Amount((e.target.value) || "")
          }}
        />
        <SetPercentageButtons 
          maxAmount={formatUnits(token0Balance || BigInt(0), tokens[0].decimals)} 
          decimals={tokens[0].decimals} 
          onSetAmount={(newValue: number) => {
            setIsUserEditingForToken0(true)
            setToken0Amount(newValue.toString() || "")
          }} 
        />
        <div className={parseUnits(token0Amount, tokens[0].decimals) > (token0Balance || BigInt(0)) ? "text-destructive" : ""}>
          <TokenLiveBalance userAddress={userAddress} token={tokens[0]} chainId={chainId} />
        </div>
        {
          parseUnits(token0Amount, tokens[0].decimals) > (token0Balance || BigInt(0)) ? 
          <div className="ml-2 text-sm text-destructive">
            You do not have enough funds to provide liquidity, opening position will fail...
          </div>
          : <></>
        }
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="">{tokens[1].symbol}</label>
        <Input
          className={parseUnits(token1Amount, tokens[1].decimals) > (token1Balance || BigInt(0)) ? "text-destructive" : ""}
          placeholder="0.0"
          value={token1Amount}
          onChange={(e) => {
            setIsUserEditingForToken0(false)
            setToken1Amount((e.target.value) || "")
          }}
        />
        <SetPercentageButtons 
          maxAmount={formatUnits(token1Balance || BigInt(0), tokens[1].decimals)} 
          decimals={tokens[1].decimals} 
          onSetAmount={(newValue: number) => {
            setIsUserEditingForToken0(false)
            setToken1Amount(newValue.toString() || "")
          }} 
        />
        <div className={parseUnits(token1Amount, tokens[1].decimals) > (token1Balance || BigInt(0)) ? "text-destructive" : ""}>
          <TokenLiveBalance userAddress={userAddress} token={tokens[1]} chainId={chainId} />
        </div>
        {
          parseUnits(token1Amount, tokens[1].decimals) > (token1Balance || BigInt(0)) ? 
          <div className="ml-2 text-sm text-destructive">
            You do not have enough funds to provide liquidity, opening position will fail...
          </div>
          : <></>
        }
      </div>
    </div>
  )
}