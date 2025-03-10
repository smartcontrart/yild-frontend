import { useQuery } from '@tanstack/react-query';

import { POOL_DATA_FETCH_INTERVAL } from '@/utils/constants';
import { getPoolInfoDetail } from '@/utils/pools';

export const usePoolData = (tokenAddress: string, chainId: number) => {
  return useQuery<any, Error>({
    queryKey: ['poolData', tokenAddress, chainId],
    queryFn: () => getPoolInfoDetail(tokenAddress, chainId),
    refetchInterval: POOL_DATA_FETCH_INTERVAL
  });
};