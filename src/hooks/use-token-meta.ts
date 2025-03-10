import { useQuery } from '@tanstack/react-query';

import { getERC20TokenInfo } from '@/utils/erc20';
import { ERC20TokenInfo } from '@/utils/constants';

export const useTokenMeta = (address: string, chainId: number) => {
  return useQuery<ERC20TokenInfo, Error>({
    queryKey: ['getTokenMeta', address, chainId],
    queryFn: () => getERC20TokenInfo(address, chainId),
    staleTime: Infinity, // Prevents automatic refetching
    refetchOnMount: false, // Prevents refetching when the component mounts
    refetchOnWindowFocus: false, // Prevents refetching when the window gains focus
    refetchOnReconnect: false // Prevents refetching when the network reconnects
  });
};