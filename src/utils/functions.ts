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

  // Calculate liquidity using token1 amount
  const liquidity = Number(token1Amount) / (1 / sqrtPrice - 1 / sqrtPriceLower);

  // Calculate required token0 amount using the liquidity
  let token0Raw = 0;

  // For USDC/WETH, if current price is above lower bound, we need some WETH
  token0Raw = Math.floor(liquidity * (1 / sqrtPriceUpper - 1 / sqrtPrice));

  return (token0Raw * currentPrice).toString();
}

/**
 * Converts a tick to a price
 * @param tick The tick to convert
 * @param decimalsToken0 Number of decimals for token0
 * @param decimalsToken1 Number of decimals for token1
 * @param invert If true, returns price of token1 in token0, otherwise returns price of token0 in token1
 * @returns The price corresponding to the tick
 */
export function tickToPrice(tick: number, decimalsToken0: number, decimalsToken1: number): any {
  const rawPrice = Math.pow(1.0001, tick);
  const decimalsAdjustment = Math.pow(10, decimalsToken0 - decimalsToken1);
  const adjustedPrice = rawPrice * decimalsAdjustment;
  
  return adjustedPrice;
}

/**
* Converts a price to the nearest tick
* @param price The price to convert
* @returns The nearest tick for the given price
*/
export function priceToTick(price: number, decimalsToken0: number, decimalsToken1: number): number {
  const adjustedPrice = price;
  const decimalsAdjustment = Math.pow(10, decimalsToken0 - decimalsToken1);
  const rawPrice = adjustedPrice / decimalsAdjustment;
  return Math.round(Math.log(rawPrice) / Math.log(1.0001));
}

/**
* Gets the tick spacing for a given fee tier
* @param fee The fee tier (500 = 0.05%, 3000 = 0.3%, 10000 = 1%)
* @returns The tick spacing for that fee tier
*/
export function getTickSpacing(fee: number | null): number {
  switch (fee) {
    case 100: // 0.01%
      return 1;
    case 500: // 0.05%
      return 10;
    case 3000: // 0.3%
      return 60;
    case 10000: // 1%
      return 200;
    default:
      return 10000;
  }
}

/**
* Ensures a tick is spaced correctly for the given fee tier
* @param tick The tick to check
* @param fee The fee tier
* @returns The nearest valid tick for that fee tier
*/
export function nearestValidTick(tick: number, fee: number | null): number {
  const tickSpacing = getTickSpacing(fee);
  return Math.round(tick / tickSpacing) * tickSpacing;
}

export const reArrangeTokensByContractAddress = (tokens: any[]) => {
  const token0Address = tokens[0].address;
  const token1Address = tokens[1].address;
  if (!token0Address || !token1Address || token0Address < token1Address)
    return tokens;
  else {
    const result = [tokens[1], tokens[0]];
    return result;
  }
}

export const visualizeFeeTier = (feeTier: number) => {
  switch(feeTier) {
    case 100: return "0.01 %";
    case 500: return "0.05 %";
    case 1000: return "0.1 %";
    case 3000: return "0.3 %";
    case 5000: return "0.5 %";
    case 10000: return "1 %";
  }
  return "0.00%"
}

export const formatNumber = (num: number): string => {
  if (num < 1_000) return num.toString(); // Below 1K, return as is
  const units = ["K", "M", "B", "T"]; // Thousand, Million, Billion, Trillion
  let unitIndex = -1;
  let formattedNum = num;

  while (formattedNum >= 1000 && unitIndex < units.length - 1) {
    formattedNum /= 1000;
    unitIndex++;
  }

  return `${formattedNum.toFixed(2)} ${units[unitIndex]}`;
};

export const multiplyBigIntWithFloat = (big: bigint, num: number): bigint => {
  if (num === 0) return BigInt(0); // If multiplying by zero, return zero

  // Convert float to a string to determine decimal places
  const numStr = num.toExponential(); // Scientific notation (e.g., "2.34234e-8" or "3.456e+8")
  const [coefficientStr, exponentStr] = numStr.split("e");
  
  const coefficient = parseFloat(coefficientStr);
  const exponent = parseInt(exponentStr, 10);

  // Scale factor based on exponent (avoid using BigInt exponentiation)
  const scaleFactor = Math.pow(10, Math.max(0, -exponent + 20)); // Ensures precision
  const scaledNum = BigInt(Math.round(coefficient * scaleFactor)); // Convert to BigInt

  return (big * scaledNum) / BigInt(scaleFactor); // Multiply and adjust back
}