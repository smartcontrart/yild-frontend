import { useQuery } from '@tanstack/react-query';

import { getPositionStaticInfo } from '@/utils/requests';

export const usePositionStaticInfo = (address: string, positionId: number, chainId: number) => {
  return useQuery<any, Error>({
    queryKey: ['positionStaticInfo', positionId, chainId],
    queryFn: () => getPositionStaticInfo(address, positionId, chainId),
    staleTime: Infinity, // Prevents automatic refetching
    refetchOnMount: false, // Prevents refetching when the component mounts
    refetchOnWindowFocus: false, // Prevents refetching when the window gains focus
    refetchOnReconnect: false // Prevents refetching when the network reconnects
  });
};