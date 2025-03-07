"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ERC20TokenInfo } from "@/utils/constants";
import { useTokenPrice } from "@/hooks/use-token-price";
import { PriceRangeSetter } from "./price-range-setter";
import { AmountSetter } from "./amount-setter";

export const RangeAndAmountSetter = ({
  tokens,
  chainId,
  selectedFeeTier
}: {
  tokens: ERC20TokenInfo[],
  chainId: number,
  selectedFeeTier: number
}) => {

  const [pricedToken, setPricedToken] = useState(tokens[0])
  const [baseToken, setBaseToken] = useState(tokens[1])
  const [direction, setDirection] = useState<"0p1" | "1p0">("0p1")

  const { data: token0Price } = useTokenPrice(tokens[0].address, chainId)
  const { data: token1Price } = useTokenPrice(tokens[1].address, chainId)  

  const [tickLower, setTickLower] = useState(0)
  const [tickUpper, setTickUpper] = useState(0)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Tabs
          value={direction}
          onValueChange={(value: string) => {
            setDirection(value as "0p1" | "1p0")
            if (direction === "0p1") {
              setPricedToken(tokens[0])
              setBaseToken(tokens[1])
            }
            else if (direction === "1p0") {
              setPricedToken(tokens[1])
              setBaseToken(tokens[0])
            }
          }}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="0p1">{`${tokens[1].symbol}/${tokens[0].symbol}`}</TabsTrigger>
            <TabsTrigger value="1p0">{`${tokens[0].symbol}/${tokens[1].symbol}`}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {
        direction === "0p1" ? 
        <div>
          1 {tokens[0].symbol} is worth {(Number(token0Price) / Number(token1Price))} {tokens[1].symbol}
        </div>
        : 
        <div>
          1 {tokens[1].symbol} is worth {(Number(token1Price) / Number(token0Price))} {tokens[0].symbol}
        </div>
      }

      {
        token0Price && token1Price ? 
        <>
          <PriceRangeSetter 
            tokens={tokens}
            chainId={chainId}
            feeTier={selectedFeeTier}
            direction={direction}
            token0Price={Number(token0Price)}
            token1Price={Number(token1Price)}
            onTickChange={(data: any) => {
              setTickLower(data.tickLower || 0)
              setTickUpper(data.tickUpper || 0)
            }}
          />
          <AmountSetter 
            tokens={tokens}
            tickLower={tickLower}
            tickUpper={tickUpper}
            direction={direction}
            token0Price={Number(token0Price)}
            token1Price={Number(token1Price)}
          />
        </>
        : <></>
      }
    </>
  )
}