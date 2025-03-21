import { useMemo } from "react";

import { gql, useQuery } from "@apollo/client";
import { useTheme } from 'next-themes';

import { ERC20TokenInfo } from "@/utils/constants";
import { formatNumber, visualizeFeeTier } from "@/utils/functions";
import { getClientFromChainId } from "@/utils/apolloClient";

import { useTokenPrice } from "@/hooks/use-token-price";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PoolInfoProps {
  tokens: ERC20TokenInfo[],
  address: `0x${string}`;
  feeTier: number;
  token0BalanceInPool: number,
  token1BalanceInPool: number,
  chainId: number;
  selected: boolean;
  onClickPool?: (feeTier: number) => void;
}

function getOneMonthAgoTimestamp() {
  const oneMonthAgoTimestamp = Math.floor(new Date().getTime() / 1000) - 30 * 24 * 60 * 60
  return oneMonthAgoTimestamp
}

function getMonthlyVolume(data: any, price0: any, price1: any) {

  if (!data || data.length < 1 || !data.map)
    return 0
  let token0Volume = 0, token1Volume = 1
  data.map((elem: any) => {
    if (elem) {
      const { volumeToken0, volumeToken1 } = elem
      token0Volume += parseFloat(volumeToken0)
      token1Volume += parseFloat(volumeToken1)
    }
  })
  return formatNumber(token0Volume * price0 + token1Volume * price1)
}

export function PoolInfo({ tokens, address, feeTier, token0BalanceInPool, token1BalanceInPool, chainId, selected, onClickPool }: PoolInfoProps) {

  const { theme } = useTheme()

  const timestamp = useMemo(() => getOneMonthAgoTimestamp(), []);
  const GET_DATA = useMemo(() => gql`
    {
      poolDayDatas(first: 30, orderBy: date, where: {
        pool: "${address.toLowerCase()}",
        date_gt: ${timestamp.toString()}
      }) {
        date
        liquidity
        sqrtPrice
        token0Price
        token1Price
        volumeToken0
        volumeToken1
      }
    }
  `, [address, timestamp]);

  const { loading, error, data } = useQuery(GET_DATA, { client: getClientFromChainId(chainId) });
  const { data: token0Price } = useTokenPrice(tokens[0].address, chainId)
  const { data: token1Price } = useTokenPrice(tokens[1].address, chainId)
  

  if (loading) return <Skeleton className="h-[125px] rounded-xl"  />;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <Card className={`p-6 cursor-pointer ${selected ? (theme === "dark" ? "bg-blue-600" : "bg-sky-100") : ""}`} key={`feeTier_${feeTier}`} onClick={() => onClickPool && onClickPool(feeTier)}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 ">
            <div>
              {`${tokens[0].symbol} / ${tokens[1].symbol}`} ( {visualizeFeeTier(feeTier)} )
            </div>
            <div>
              TVL: $ {formatNumber(Number(token0BalanceInPool) * Number(token0Price) + Number(token1BalanceInPool) * Number(token1Price))}
            </div>
            <div>
              30D Volume: $ {getMonthlyVolume(data?.poolDayDatas || [], token0Price, token1Price)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
