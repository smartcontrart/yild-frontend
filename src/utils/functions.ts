import { ethers } from "ethers";
import {
    arbitrum,
    base,
    mainnet,
    optimism,
    polygon,
    sepolia,
} from 'wagmi/chains';
import { POSITION_MANAGER_CONTRACT_ADDRESS } from "./constants";
import Abi from "@/abi/PositionManager.json";
import { erc20Abi } from "viem"; 

export const getDeployedContract = (chainId: number) => {
    if (chainId == 8453) { //base
        const rpcUrl = base.rpcUrls.default.http[0]
        const provider = new ethers.JsonRpcProvider(rpcUrl)
        const contract = new ethers.Contract(POSITION_MANAGER_CONTRACT_ADDRESS["BASE"], Abi.abi, provider)
        return contract
    }
}

export const getTokenContract = (address: string, chainId: number) => {
    if (chainId == 8453) { //base
        const rpcUrl = base.rpcUrls.default.http[0]
        const provider = new ethers.JsonRpcProvider(rpcUrl)
        const contract = new ethers.Contract(address, erc20Abi, provider)
        return contract
    }
}

export const getSymbolsAndDecimals = async (tokenId: number, chainId: number, contract: any) => {
    try {
        const info = await contract.getSwapInfo(tokenId)
        const token0Contract = getTokenContract(info[0], chainId)
        const token1Contract = getTokenContract(info[1], chainId)

        if (token0Contract && token1Contract) {
            const symbol0 = await token0Contract.symbol()
            const symbol1 = await token1Contract.symbol()

            const decimals0 = parseInt(await token0Contract.decimals())
            const decimals1 = parseInt(await token1Contract.decimals())

            return { symbol0, symbol1, decimals0, decimals1 }
        }
    } catch (err) {
        console.log('getSwapInfo error: ', err)
    }
    return { symbol0: "", symbol1: "", decimals0: 0, decimals1: 0 }
}