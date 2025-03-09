import { useQuery } from '@tanstack/react-query';

import { USER_ERC_TOKEN_BALANCE_FETCH_INTERVAL } from '@/utils/constants';
import { getERC20TokenBalance } from '@/utils/erc20'

export const useTokenBalance = (userAddress: string, tokenAddress: string) => {
  return useQuery<bigint | 0, Error>({
    queryKey: ['tokenBalance', userAddress, tokenAddress],
    queryFn: () => getERC20TokenBalance(tokenAddress, userAddress),
    refetchInterval: USER_ERC_TOKEN_BALANCE_FETCH_INTERVAL
  });
};