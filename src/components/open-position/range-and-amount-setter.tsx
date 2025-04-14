"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { ERC20TokenInfo } from "@/utils/constants";
import { useTokenPrice } from "@/hooks/use-token-price";
import { PriceRangeSetter } from "./price-range-setter";
import { AmountSetter } from "./amount-setter";
import { reArrangeTokensByContractAddress } from "@/utils/functions";

export const RangeAndAmountSetter = ({
  tokens,
  chainId,
  selectedFeeTier,
  onInfoChange,
  tickLower,
  tickUpper,
  token0Amount,
  token1Amount
}: {
  tokens: ERC20TokenInfo[],
  chainId: number,
  selectedFeeTier: number,
  onInfoChange: Function,
  tickLower: number,
  tickUpper: number,
  token0Amount: number,
  token1Amount: number
}) => {

  const sortedTokensByCA = reArrangeTokensByContractAddress(tokens)
  const [direction, setDirection] = useState<"0p1" | "1p0">("0p1")

  const { data: token0Price } = useTokenPrice(sortedTokensByCA[0].address, chainId)
  const { data: token1Price } = useTokenPrice(sortedTokensByCA[1].address, chainId)  

  useEffect(() => {
    if (tickLower !== 0 && tickUpper !== 0 && token0Amount && token1Amount)
      onInfoChange({
        tickLower,
        tickUpper,
        token0Amount,
        token1Amount
      })
  }, [tickLower, tickUpper, token0Amount, token1Amount])

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Tabs
          value={direction}
          onValueChange={(value: string) => {
            setDirection(value as "0p1" | "1p0")
          }}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="0p1">{`${sortedTokensByCA[1].symbol}/${sortedTokensByCA[0].symbol}`}</TabsTrigger>
            <TabsTrigger value="1p0">{`${sortedTokensByCA[0].symbol}/${sortedTokensByCA[1].symbol}`}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {
        direction === "0p1" ? 
        <div>
          1 {sortedTokensByCA[0].symbol} is worth {(Number(token0Price) / Number(token1Price))} {sortedTokensByCA[1].symbol}
        </div>
        : 
        <div>
          1 {sortedTokensByCA[1].symbol} is worth {(Number(token1Price) / Number(token0Price))} {sortedTokensByCA[0].symbol}
        </div>
      }

      {
        token0Price && token1Price ? 
        <>
          <PriceRangeSetter 
            tokens={sortedTokensByCA}
            chainId={chainId}
            feeTier={selectedFeeTier}
            direction={direction}
            token0Price={Number(token0Price)}
            token1Price={Number(token1Price)}
            tickLower={tickLower}
            tickUpper={tickUpper}
            onTickChange={(data: any) => {
              data.tickLower && onInfoChange({ tickLower: data.tickLower })
              data.tickUpper && onInfoChange({ tickUpper: data.tickUpper })
            }}
          />
          <AmountSetter 
            tokens={sortedTokensByCA}
            tickLower={tickLower}
            tickUpper={tickUpper}
            token0Price={Number(token0Price)}
            token1Price={Number(token1Price)}
            onAmountsChange={(data: any) => {
              data.token0Amount && onInfoChange({ token0Amount: data.token0Amount })
              data.token1Amount && onInfoChange({ token1Amount: data.token1Amount })
            }}
            chainId={chainId}
          />
        </>
        : <></>
      }
    </>
  )
}