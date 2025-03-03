import { useState } from "react";
import { usePublicClient, useChainId } from "wagmi";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { TRENDING_TOKEN_LIST, ChainIdKey, SupportedChainId, getNetworkNameFromChainId } from "@/utils/constants";
import { getERC20TokenInfo } from "@/utils/erc20";
import ERC20Image from "./erc20-image";

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
}

interface TokenSelectorProps {
  chainId: number,
  onSelectionChange: (info: TokenInfo) => void;
}

export function TokenSelector({ chainId, onSelectionChange }: TokenSelectorProps) {
  const [customTokenAddressInput, setCustomTokenAddressInput] = useState("")
  const [customToken, setCustomToken] = useState<TokenInfo | null>(null);

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
      <Select onValueChange={(value) => {
        console.log(value)
        const tokens = TRENDING_TOKEN_LIST[getNetworkNameFromChainId(chainId)].filter((elem: any) => elem.ADDRESS === value)
        if (tokens && tokens.length > 0)
          onSelectionChange({
            name: tokens[0].NAME,
            symbol: tokens[0].NAME,
            decimals: tokens[0].DECIMALS,
            address: tokens[0].ADDRESS
          });
        else if (customToken)
          onSelectionChange(customToken);
      }} defaultValue={""}>
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
                  const tokens = TRENDING_TOKEN_LIST[getNetworkNameFromChainId(chainId)].filter((elem: any) => elem.ADDRESS === e.target.value)
                  if (!tokens || tokens.length === 0) {
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
              <div className="flex flex-row gap-4">
                <ERC20Image tokenAddress={customTokenAddressInput as `0x${string}`} chainId={chainId} />
                {customToken.symbol}
              </div>
            </SelectItem>
          )}

          <Separator />

          {TRENDING_TOKEN_LIST[getNetworkNameFromChainId(chainId)].map((elem: any) => (
            <SelectItem key={elem.NAME} value={elem.ADDRESS}>
              <div className="flex flex-row gap-4">
                <ERC20Image tokenAddress={elem.ADDRESS} chainId={chainId} />
                {elem.NAME}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
