/**
 * Converts a tick to a price
 * @param tick The tick to convert
 * @param decimalsToken0 Number of decimals for token0
 * @param decimalsToken1 Number of decimals for token1
 * @param invert If true, returns price of token1 in token0, otherwise returns price of token0 in token1
 * @returns The price corresponding to the tick
 */
export function tickToPrice(tick: number, decimalsToken0: number = 6, decimalsToken1: number = 18, invert: boolean = true): number {
    // Calculate raw price: 1.0001^tick
    const rawPrice = Math.pow(1.0001, tick);
    
    // Adjust for decimals: divide by (10^decimalsToken1 / 10^decimalsToken0)
    const decimalAdjustment = Math.pow(10, decimalsToken1 - decimalsToken0);
    const adjustedPrice = rawPrice / decimalAdjustment;
    
    // If invert is true, return 1/price to get token1 price in token0
    return invert ? 1 / adjustedPrice : adjustedPrice;
}

/**
 * Converts a price to the nearest tick
 * @param price The price to convert
 * @returns The nearest tick for the given price
 */
export function priceToTick(price: number): number {
    // In Uniswap V3, the price to tick formula is:
    // tick = log(price) / log(1.0001)
    // We round to the nearest integer since ticks must be whole numbers
    return Math.round(Math.log(price) / Math.log(1.0001));
}

/**
 * Gets the tick spacing for a given fee tier
 * @param fee The fee tier (500 = 0.05%, 3000 = 0.3%, 10000 = 1%)
 * @returns The tick spacing for that fee tier
 */
export function getTickSpacing(fee: number): number {
    switch (fee) {
        case 500: // 0.05%
            return 10;
        case 3000: // 0.3%
            return 60;
        case 10000: // 1%
            return 200;
        default:
            throw new Error('Unsupported fee tier');
    }
}

/**
 * Ensures a tick is spaced correctly for the given fee tier
 * @param tick The tick to check
 * @param fee The fee tier
 * @returns The nearest valid tick for that fee tier
 */
export function nearestValidTick(tick: number, fee: number): number {
    const tickSpacing = getTickSpacing(fee);
    return Math.round(tick / tickSpacing) * tickSpacing;
}