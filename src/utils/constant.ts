export const POSITION_MANAGER_CONTRACT_ADDRESS = {
    BASE: "0xf410fb8d5862060182495ba5d23705cdc3f5af91" as `0x${string}`,
    ETHEREUM: '',
    ARBITRUM: ''
}

export const TOKEN_LIST = [
    { 
        NAME: "WETH", 
        ADDRESS: {
            BASE: "0x4200000000000000000000000000000000000006" as `0x${string}`, 
        },
        DECIMAL: 18 
    },
    { 
        NAME: "USDC", 
        ADDRESS: {
            BASE: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`
        }, 
        DECIMAL: 6 
    }
]

export const SLIPPAGE = 5 // 5%
export const BPS = 5 // 5%
export const API_URL = "http://ec2-3-134-221-156.us-east-2.compute.amazonaws.com:3000"