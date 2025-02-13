/**
 * Calculates the required amount of token1 given an amount of token0 and the price range
 * @param currentPrice Current price of token0 in terms of token1
 * @param priceLower Lower bound of the price range
 * @param priceUpper Upper bound of the price range
 * @param token0Amount Amount of token0 to provide (in human readable form)
 * @returns Required amount of token1 to provide (in human readable form)
 */
export function getRequiredToken1FromToken0Amount(
  currentPrice: number,
  priceLower: number,
  priceUpper: number,
  token0Amount: string,
  token1Decimals: number
): string {
  // Convert prices to square root prices (prices are already adjusted for decimals)
  const sqrtPrice = Math.sqrt(currentPrice);
  const sqrtPriceLower = Math.sqrt(priceLower);
  const sqrtPriceUpper = Math.sqrt(priceUpper);

  // Calculate liquidity using token0 amount
  const liquidity = Number(token0Amount) * (sqrtPriceUpper * sqrtPrice) / (sqrtPriceUpper - sqrtPrice);

  // Calculate required token1 amount using the liquidity
  let token1Raw = "";

  // If current price is below upper bound, we need some token1
  if (currentPrice < priceUpper) {
    token1Raw = (liquidity * (sqrtPrice - sqrtPriceLower)).toFixed(token1Decimals)
  }

  // Convert raw amount back to human readable form
  return token1Raw;
}

/**
 * Calculates the required amount of token0 given an amount of token1 and the price range
 * @param currentPrice Current price of token0 in terms of token1
 * @param priceLower Lower bound of the price range
 * @param priceUpper Upper bound of the price range
 * @param token1Amount Amount of token1 to provide (in human readable form)
 * @returns Required amount of token0 to provide (in human readable form)
 */
export function getRequiredToken0FromToken1Amount(
  currentPrice: number,
  priceLower: number,
  priceUpper: number,
  token1Amount: string,
): string {
  // Convert prices to square root prices
  const sqrtPrice = Math.sqrt(currentPrice);
  const sqrtPriceLower = Math.sqrt(priceLower);
  const sqrtPriceUpper = Math.sqrt(priceUpper);

  console.log(sqrtPrice, sqrtPriceLower, sqrtPriceUpper, token1Amount)

  // Calculate liquidity using token1 amount
  const liquidity = Number(token1Amount) / (1 / sqrtPrice - 1 / sqrtPriceLower);
  console.log(liquidity)

  // Calculate required token0 amount using the liquidity
  let token0Raw = 0;

  // For USDC/WETH, if current price is above lower bound, we need some WETH
  token0Raw = Math.floor(liquidity * (1 / sqrtPriceUpper - 1 / sqrtPrice));

  return (token0Raw * currentPrice).toString();
}
