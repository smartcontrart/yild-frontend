import { useQuery } from '@tanstack/react-query';

import { TOKEN_LIVE_PRICE_FETCH_INTERVAL } from '@/utils/constants';
import { fetchTokenPrice } from '@/utils/requests';

export const useTokenPrice = (tokenAddress: string, chainId: number) => {
  return useQuery<string, Error>({
    queryKey: ['tokenPrice', tokenAddress, chainId],
    queryFn: () => fetchTokenPrice(tokenAddress, chainId),
    refetchInterval: TOKEN_LIVE_PRICE_FETCH_INTERVAL
  });
};