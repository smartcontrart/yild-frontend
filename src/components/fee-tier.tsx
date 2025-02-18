import { Card } from "@/components/ui/card";
import { formatNumber, visualizeFeeTier } from "@/utils/functions";
import { useEffect, useState } from "react";

interface FeeTierProps {
  pair: string;
  address: string;
  feeTier: number;
  balance0: number;
  balance1: number;
  price0: number;
  price1: number;
  onClickPool?: () => void;
}

export function FeeTier({ pair, address, feeTier, balance0, balance1, price0, price1, onClickPool }: FeeTierProps) {
  const UNISWAP_V3_SUBGRAPH_URL = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";




  const [volumeLoading, setVolumeLoading] = useState(true)
  const [volume, setVolume] = useState()

  useEffect(() => {
    if (address) {
      const func = async () => {
        try {
          const query = {
            query: `
              {
                pool(id: "${address.toLowerCase()}") {
                  volumeUSD30D
                }
              }
            `,
          };
          const result = await fetch(UNISWAP_V3_SUBGRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query)
          })
          console.log(result)
          setVolumeLoading(false)          
        } catch (error) {
          console.log(error)
        }
      }
      func()
    }
  }, [address])
  return (
    <Card className="p-6" key={`feeTier_${feeTier}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div>
              {pair} ( {visualizeFeeTier(feeTier)} )
            </div>
            {/* <div>
              {address}
            </div> */}
            <div>
              TVL: $ {formatNumber(balance0 * price0 + balance1 * price1)}
            </div>
            <div>
              1 Month Volume: $ {formatNumber(balance0 * price0 + balance1 * price1)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
