import { ERC20TokenInfo } from "@/utils/constants"
import { Input } from "../ui/input"
import { useState } from "react"

export const AmountSetter = ({
  tokens,
  tickLower,
  tickUpper,
  direction,
  token0Price,
  token1Price
}: {
  tokens: ERC20TokenInfo[],
  tickLower: number,
  tickUpper: number,
  direction: string,
  token0Price: number,
  token1Price: number
}) => {

  const [token0Amount, setToken0Amount] = useState("0")
  const [token1Amount, setToken1Amount] = useState("0")

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="">{tokens[0].symbol} deposit amount</label>
        <Input
          placeholder="0.0"
          value={token0Amount}
          onChange={(e) => setToken0Amount((e.target.value) || "0")}
        />
      </div>
      <div>
        <label htmlFor="">{tokens[1].symbol} deposit amount</label>
        <Input
          placeholder="0.0"
          value={token1Amount}
          onChange={(e) => setToken1Amount((e.target.value) || "0")}
        />
      </div>
    </div>
  )
}