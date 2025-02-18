import { Card } from "@/components/ui/card";
import { formatNumber, visualizeFeeTier } from "@/utils/functions";
import { gql, useQuery } from "@apollo/client";
import { getClientFromChainId } from "@/lib/apolloClient";
import { useMemo } from "react";

interface FeeTierProps {
  pair: string;
  address: string;
  feeTier: number;
  balance0: number;
  balance1: number;
  price0: number;
  price1: number;
  chainId: number;
  onClickPool?: () => void;
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

export function FeeTier({ pair, address, feeTier, balance0, balance1, price0, price1, chainId, onClickPool }: FeeTierProps) {

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
  `, [address, timestamp]); // Only change when `address` changes

  const { loading, error, data } = useQuery(GET_DATA, { client: getClientFromChainId(chainId) });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <Card className="p-6" key={`feeTier_${feeTier}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div>
              {pair} ( {visualizeFeeTier(feeTier)} )
            </div>
            <div>
              TVL: $ {formatNumber(balance0 * price0 + balance1 * price1)}
            </div>
            <div>
              1 Month Volume: $ {getMonthlyVolume(data?.poolDayDatas || [], price0, price1)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
