import { useQuery } from '@tanstack/react-query';

import { ERC20TokenInfo } from '@/utils/constants';
import { getAccountingUnitFromAddress } from '@/utils/position-manage';

export const useAccountingUnit = (address: string, chainId: number) => {
  return useQuery<ERC20TokenInfo, Error>({
    queryKey: ['getAccountingUnit', address, chainId],
    queryFn: () => getAccountingUnitFromAddress(address, chainId),
    staleTime: Infinity, // Prevents automatic refetching
    refetchOnMount: false, // Prevents refetching when the component mounts
    refetchOnWindowFocus: false, // Prevents refetching when the window gains focus
    refetchOnReconnect: false // Prevents refetching when the network reconnects
  });
};