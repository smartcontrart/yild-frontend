import { ERC20TokenInfo } from "@/utils/constants";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { nearestValidTick, priceToTick, reArrangeTokensByContractAddress, tickToPrice } from "@/utils/functions";

export const PriceRangeSetter = ({
  tokens,
  chainId,
  feeTier,
  direction,
  token0Price,
  token1Price,
  tickLower,
  tickUpper,
  onTickChange
}: {
  tokens: ERC20TokenInfo[],
  chainId: number,
  feeTier: number,
  direction: string,
  token0Price: number,
  token1Price: number,
  tickLower: number,
  tickUpper: number,
  onTickChange: Function
}) => {

  const getNearestValidPrice = (debouncedValue: number) => {
    let numericPrice = debouncedValue;
    const [token0SortedByCA, token1SortedByCA] = reArrangeTokensByContractAddress(tokens);
    if (
      (token0SortedByCA.address === tokens[0].address && direction === "1p0") ||
      (token0SortedByCA.address !== tokens[0].address && direction === "1p0")
    )
      numericPrice = 1 / numericPrice;

    const tick = priceToTick(
      numericPrice,
      token0SortedByCA.decimals,
      token1SortedByCA.decimals
    );
    const validTick = nearestValidTick(tick, feeTier);
    let adjustedPrice = Number(tickToPrice(
      validTick,
      token0SortedByCA.decimals,
      token1SortedByCA.decimals
    ));
    if (
      (token0SortedByCA.address === tokens[0].address && direction === "1p0") ||
      (token0SortedByCA.address !== tokens[0].address && direction === "0p1")
    )
      adjustedPrice = 1 / adjustedPrice;
    return {
      validTick,
      adjustedPrice
    }
  }

  const setNearestValidPrice = (debouncedValue: number, isMin: boolean) => {
    const { validTick, adjustedPrice } = getNearestValidPrice(debouncedValue)
    if (validTick === 0 || validTick === Infinity || validTick === -Infinity)
      return

    if (isMin) {
      setMinPriceInput(adjustedPrice.toString());
      onTickChange({tickLower: validTick, tickUpper})
    }
    else {
      setMaxPriceInput(adjustedPrice.toString());
      onTickChange({tickLower, tickUpper: validTick})
    }
  }
  
  const [minPriceInput, setMinPriceInput] = useState("")
  const [maxPriceInput, setMaxPriceInput] = useState("")
  
  const debouncedMinPrice = useDebounce(minPriceInput, 2000)
  const debouncedMaxPrice = useDebounce(maxPriceInput, 2000)
  
  useEffect(() => {
    if (direction && token0Price && token1Price) {
      const basePriceRatio = direction === "0p1" ? token0Price / token1Price : token1Price / token0Price
      const { adjustedPrice: adjustedPriceMin, validTick: validTickLower } = getNearestValidPrice(basePriceRatio * 0.95)
      const { adjustedPrice: adjustedPriceMax, validTick: validTickUpper } = getNearestValidPrice(basePriceRatio * 1.05)
      setMinPriceInput(adjustedPriceMin.toString())
      setMaxPriceInput(adjustedPriceMax.toString())
      onTickChange({tickLower: validTickLower, tickUpper: validTickUpper})
    }
  }, [feeTier, direction])

  useEffect(() => {
    setNearestValidPrice(Number(debouncedMinPrice), true);
  }, [debouncedMinPrice]);

  useEffect(() => {
    setNearestValidPrice(Number(debouncedMaxPrice), false);
  }, [debouncedMaxPrice]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="">Min Price</label>
        <Input
          placeholder="0.0"
          value={minPriceInput}
          onChange={(e) => setMinPriceInput((e.target.value) || "0")}
        />
      </div>
      <div>
        <label htmlFor="">Max Price</label>
        <Input
          placeholder="0.0"
          value={maxPriceInput}
          onChange={(e) => setMaxPriceInput((e.target.value) || "0")}
        />
      </div>
    </div>
  )
}