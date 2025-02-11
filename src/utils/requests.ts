import { BACKEND_API_URL } from "./constants"

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
        const response = await fetch(`${BACKEND_API_URL}/api/chain/${chainId}/positions/${address}`)
        const { data } = await response.json()
        return data || []
    } catch(err) {
        console.log('Get positions error: ', err)
    }

    return []
}