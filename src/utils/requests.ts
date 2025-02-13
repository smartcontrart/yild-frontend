import { BACKEND_API_URL } from "./constants"

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