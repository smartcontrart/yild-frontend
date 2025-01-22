/**
 * Converts a tick to a price
 * @param tick The tick to convert
 * @returns The price corresponding to the tick
 */
export function tickToPrice(tick: number): number {
    // In Uniswap V3, the tick to price formula is:
    // price = 1.0001^tick
    return Math.pow(1.0001, tick);
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