import axios from "axios"
import { API_URL } from "./constant"

export const getParaswapData = async (srcToken: string, destToken: string, amount: number, slippage: number) => {
    // const url = 'https://api.paraswap.io/transactions/8453';
    // const data = {
    //     srcToken,
    //     destToken,
    //     amount,
    //     slippage
    // };

    // try {
    //     const response = await axios.post(url, data);
    //     console.log('Response:', response.data);
    // } catch (error) {
    //     console.error('Error:', error);
    // }
    
    return null
}

export const getPositions = async (address: string, chainId: number) => {
    try {
        // const response = await axios.get(`${API_URL}/api/chain/${chainId}/positions/${address}`)
        const response = await axios.get(`${API_URL}/api/chain/${chainId}/positions/0x42DC5C87ee06B590d61b910FeA9cd6679f1e4929`)
        
        console.log(response?.data?.data)
        return response?.data?.data || []
    } catch(err) {
        console.log('Get positions error: ', err)
    }

    return []
}