import { create } from 'zustand'

interface Position {
  tokenId: number
  symbol: string
  token0Address: string
  token1Address: string
  symbol0: string
  symbol1: string
  decimals0: number
  decimals1: number
  tickLower: number
  tickUpper: number
  dbId: string
  chainId: number
  createdAt: string
  updatedAt: string
}

interface PositionsStore {
  positions: Position[]
  setPositions: (positions: Position[]) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const usePositionsStore = create<PositionsStore>((set) => ({
  positions: [],
  setPositions: (positions) => set({ positions }),
  loading: false,
  setLoading: (loading) => set({ loading })
}))