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
  onTickChange
}: {
  tokens: ERC20TokenInfo[],
  chainId: number,
  feeTier: number,
  direction: string,
  token0Price: number,
  token1Price: number,
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

    if (isMin) {
      setTickLower(validTick);
      setMinPriceInput(adjustedPrice);
    }
    else {
      setTickUpper(validTick);
      setMaxPriceInput(adjustedPrice);
    }
  }

  const [minPriceInput, setMinPriceInput] = useState(0)
  const [maxPriceInput, setMaxPriceInput] = useState(0)
  const [tickLower, setTickLower] = useState(0)
  const [tickUpper, setTickUpper] = useState(0)

  const debouncedMinPrice = useDebounce(minPriceInput, 3000)
  const debouncedMaxPrice = useDebounce(maxPriceInput, 3000)

  useEffect(() => {

    const basePriceRatio = direction === "0p1" ? token0Price / token1Price : token1Price / token0Price
    const { adjustedPrice: adjustedPriceMin, validTick: validTickLower } = getNearestValidPrice(basePriceRatio * 0.95)
    setMinPriceInput(adjustedPriceMin)
    setTickLower(validTickLower)
    const { adjustedPrice: adjustedPriceMax, validTick: validTickUpper } = getNearestValidPrice(basePriceRatio * 1.05)
    setMaxPriceInput(adjustedPriceMax)
    setTickUpper(validTickUpper)
    onTickChange({tickLower: validTickLower, tickUpper: validTickUpper})
  }, [tokens, feeTier, direction, token0Price, token1Price])

  useEffect(() => {
    setNearestValidPrice(debouncedMinPrice, true);
  }, [debouncedMinPrice]);

  useEffect(() => {
    setNearestValidPrice(debouncedMaxPrice, false);
  }, [debouncedMaxPrice]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="">Min {tickLower}</label>
        <Input
          placeholder="0.0"
          value={minPriceInput}
          onChange={(e) => setMinPriceInput(parseFloat(e.target.value) || 0)}
        />
      </div>
      <div>
        <label htmlFor="">Max {tickUpper}</label>
        <Input
          placeholder="0.0"
          value={maxPriceInput}
          onChange={(e) => setMaxPriceInput(parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  )
}