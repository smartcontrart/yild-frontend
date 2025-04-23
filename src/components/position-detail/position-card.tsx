import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { tickToPrice } from "@/utils/functions"
import { useTokenPrice } from "@/hooks/use-token-price"
import { useTokenMeta } from "@/hooks/use-token-meta"
import { formatUnits } from "viem"
import { HandCoins } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { useState } from "react"
import { ERC20TokenInfo } from "@/utils/constants"

export const PositionCard = ({
  data,
  accountingUnit,
  positionId,
  chainId
}: {
  data: any,
  accountingUnit: ERC20TokenInfo | undefined,
  positionId: number,
  chainId: number
}) => {
  if (!data || !chainId || !accountingUnit)
    return <Skeleton className="h-[426px] rounded-xl" />
  
  const [direction, setDirection] = useState<"0p1" | "1p0">("0p1")
  const { data: token0Price, isLoading: token0PriceLoading} = useTokenPrice(data.token0Address, chainId)
  const { data: token1Price, isLoading: token1PriceLoading} = useTokenPrice(data.token1Address, chainId)
  const { data: accountingUnitPrice, isLoading: isAccountingUnitPriceLoading} = useTokenPrice(accountingUnit.address, chainId)
  const { data: token0, isLoading: token0MetaDataLoading} = useTokenMeta(data.token0Address, chainId)
  const { data: token1, isLoading: token1MetaDataLoading} = useTokenMeta(data.token1Address, chainId)
  
  return (
    <>
      {
        (token0MetaDataLoading || token1MetaDataLoading || !token0 || !token1 || token0PriceLoading || token1PriceLoading || isAccountingUnitPriceLoading) ?
        <Skeleton className="h-[426px] rounded-xl" />
        :
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-2">
              <HandCoins />
              <h3 className="font-semibold">
                Liquidity Position #{positionId}
              </h3>
            </div>
            <div className="flex flex-col gap-4">
              {
                (data.tickLower && data.tickUpper) ?
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-2 ml-[-10px]">
                    <Tabs
                      value={direction}
                      onValueChange={(value: string) => {
                        setDirection(value as "0p1" | "1p0")
                      }}
                      className="w-full"
                    >
                      <TabsList>
                        <TabsTrigger value="0p1">{token0.symbol}</TabsTrigger>
                        <TabsTrigger value="1p0">{token1.symbol}</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div>
                    <div>
                      Tokens Price
                    </div>
                    <div className="ml-4 mt-2">
                      1 {token0.symbol} = $ {token0Price}
                    </div>
                    <div className="ml-4 mt-2">
                      1 {token1.symbol} = $ {token1Price}
                    </div>
                    <div className="mt-4">
                      Curent Accounting Unit: {accountingUnit.symbol}
                    </div>
                  </div>

                  {
                    direction === "0p1" ? 
                    (
                      <div className="mt-4">
                        <div>
                          {token0.symbol}/{token1.symbol} Price Range
                        </div>
                        <div className="ml-4 mt-2">
                          {Number(tickToPrice(data.tickLower, token0.decimals, token1.decimals))} ~ {Number(tickToPrice(data.tickUpper, token0.decimals, token1.decimals))}
                        </div>
                        <div className="ml-4">
                          Current: {Number(token0Price) / Number(token1Price)}
                        </div>
                        {
                          (accountingUnit.address.toLowerCase() !== token1.address.toLowerCase() && accountingUnit.address.toLowerCase() !== token0.address.toLowerCase()) ? (
                            <>
                              <div className="mt-2">
                                {token0.symbol}/{accountingUnit.symbol} Price Range
                              </div>
                              <div className="ml-4 mt-2">
                                {Number(tickToPrice(data.tickLower, token0.decimals, token1.decimals)) * Number(token1Price) / Number(accountingUnitPrice)} ~ {Number(tickToPrice(data.tickUpper, token0.decimals, token1.decimals)) * Number(token1Price) / Number(accountingUnitPrice)}
                              </div>
                              <div className="ml-4">
                                Current: {Number(token0Price) / Number(accountingUnitPrice)}
                              </div>
                            </>
                          ) : (
                            <></>
                          )
                        }
                      </div>
                    )
                    :
                    (
                      <div className="mt-4">
                        <div>
                          {token1.symbol}/{token0.symbol} Price Range
                        </div>
                        <div className="ml-4 mt-2">
                          {Number(1 / Number(tickToPrice(data.tickUpper, token0.decimals, token1.decimals)))} ~ {Number(1 / Number(tickToPrice(data.tickLower, token0.decimals, token1.decimals)))}
                        </div>
                        <div className="ml-4">
                          Current: {Number(token1Price) / Number(token0Price)}
                        </div>
                        {
                          (accountingUnit.address.toLowerCase() !== token1.address.toLowerCase() && accountingUnit.address.toLowerCase() !== token0.address.toLowerCase()) ? (
                            <>
                              <div className="mt-2">
                                {token1.symbol}/{accountingUnit.symbol} Price Range
                              </div>
                              <div className="ml-4 mt-2">
                                {Number(1 / Number(tickToPrice(data.tickUpper, token0.decimals, token1.decimals))) * Number(token0Price) / Number(accountingUnitPrice)} ~ {Number(1 / Number(tickToPrice(data.tickLower, token0.decimals, token1.decimals))) * Number(token0Price) / Number(accountingUnitPrice)}
                              </div>
                              <div className="ml-4">
                                Current: {Number(token1Price) / Number(accountingUnitPrice)}
                              </div>
                            </>
                          ) : (
                            <></>
                          )
                        }
                      </div>
                    )
                  }
                </div>
                : <></>
              }
              <div className="flex flex-col gap-2">
                <h3>
                  Position Liquidity
                </h3>
                <div className="ml-4">
                  {Number(formatUnits(data.principal0, token0?.decimals)).toFixed(5)} {token0?.symbol}
                </div>
                <div className="ml-4">
                  {Number(formatUnits(data.principal1, token1?.decimals)).toFixed(5)} {token1?.symbol}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3>
                  Fees Claimable
                </h3>
                <div className="ml-4">
                  {Number(formatUnits(BigInt(data.feesEarned0) - BigInt(data.protocolFee0), token0?.decimals)).toFixed(8)} {token0?.symbol}
                </div>
                <div className="ml-4">
                  {Number(formatUnits(BigInt(data.feesEarned1) - BigInt(data.protocolFee1), token1?.decimals)).toFixed(8)} {token1?.symbol}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3>
                  Position Total Value
                </h3>
                <div className="ml-4">
                  $ {(Number(formatUnits(data.principal0, token0?.decimals)) * Number(token0Price) + Number(formatUnits(data.principal1, token1?.decimals)) * Number(token1Price)).toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      }
    </>
  )
}