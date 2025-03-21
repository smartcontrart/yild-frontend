import { useEffect, useState } from "react";

import { getDefaultTokensFromChainId, ERC20TokenInfo } from "@/utils/constants";
import { getERC20TokenInfo } from "@/utils/erc20";

import ERC20Image from "@/components/common/erc20-image";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface TokenSelectorProps {
  chainId: number,
  onSelectionChange: (info: ERC20TokenInfo) => void;
}

export function TokenSelector({ chainId, onSelectionChange }: TokenSelectorProps) {
  const [customTokenAddressInput, setCustomTokenAddressInput] = useState("")
  const [customToken, setCustomToken] = useState<ERC20TokenInfo | null>(null);

  useEffect(() => {
    setCustomToken(null)
  }, [chainId])

  const fetchTokenInfo = async (tokenAddress: string) => {
    if (!chainId) {
      console.error("Chain ID not available");
      return null;
    }
    const result = await getERC20TokenInfo(tokenAddress, chainId)
    return result
  };

  return (
    <>
      <Select 
        onValueChange={(value) => {
          const tokens = getDefaultTokensFromChainId(chainId)
          const filtered = tokens.filter((elem: any) => elem.address === value)
          if (filtered && filtered.length > 0)
            onSelectionChange(filtered[0]);
          else if (customToken)
            onSelectionChange(customToken);
        }} 
        defaultValue={""}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select token" />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <Input
              placeholder="Enter Token Address (0x...)"
              onChange={(e) => {
                setCustomToken(null)

                if (e.target.value.length === 42) {
                  const tokens = getDefaultTokensFromChainId(chainId)
                  const filtered = tokens.filter((elem: any) => elem.address === e.target.value)
                  if (!filtered || filtered.length === 0) {
                    setCustomTokenAddressInput(e.target.value)
                    fetchTokenInfo(e.target.value).then((info) => {
                      if (info) {
                        setCustomToken(info)
                      }
                    });
                  }
                }
              }}
            />
          </div>

          {(customTokenAddressInput && customToken) && (
            <SelectItem value={customTokenAddressInput}>
              <div className="flex flex-row gap-4 items-center">
                <ERC20Image tokenAddress={customTokenAddressInput as `0x${string}`} chainId={chainId} />
                <div className="flex flex-col gap-2">
                  <span>
                    {customToken.name}
                  </span>
                  {/* <span className="text-bold">
                    {customToken.symbol}
                  </span> */}
                </div>
              </div>
            </SelectItem>
          )}

          <Separator />

          {getDefaultTokensFromChainId(chainId).map((elem: any) => (
            <SelectItem key={elem.name} value={elem.address}>
              <div className="flex flex-row gap-4 items-center">
                <ERC20Image tokenAddress={elem.address} chainId={chainId} imageUri={elem.image} />
                <div className="flex flex-col gap-2">
                  <span>
                    {elem.name}
                  </span>
                  {/* <span className="text-bold">
                    {elem.symbol}
                  </span> */}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
