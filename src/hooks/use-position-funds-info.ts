import { useQuery } from '@tanstack/react-query';

import { POSITION_INFO_FETCH_INTERVAL } from '@/utils/constants';
import { getPositionFundsInfo } from '@/utils/position-manage';

export const usePositionFundsInfo = (positionId: number, chainId: number) => {
  return useQuery<any, Error>({
    queryKey: ['positionFundsInfo', positionId, chainId],
    queryFn: () => getPositionFundsInfo(positionId, chainId),
    refetchInterval: POSITION_INFO_FETCH_INTERVAL
  });
};