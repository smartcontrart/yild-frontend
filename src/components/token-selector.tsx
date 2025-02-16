import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { usePublicClient, useChainId } from "wagmi";
import { Control } from "react-hook-form";

import { TOKEN_LIST } from "@/utils/constants";
import { getERC20TokenInfo } from "@/utils/contract";
import { ChainIdKey, SupportedChainId } from "@/utils/constants";

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
}

interface TokenSelectorProps {
  control: Control<any>;
  name: string;
  label: string;
  addressFieldName: string;
  onTokenInfoChange?: (info: TokenInfo) => void;
}

export function TokenSelector({ control, name, label, addressFieldName, onTokenInfoChange }: TokenSelectorProps) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [customToken, setCustomToken] = useState<{ name: string; symbol: string; decimals: number } | null>(null);
  const [customTokenAddress, setCustomTokenAddress] = useState<string | null>(null);

  const fetchTokenInfo = async (address: string) => {
    try {
      if (!publicClient) {
        console.error("Public client not initialized");
        return null;
      }

      if (!chainId) {
        console.error("Chain ID not available");
        return null;
      }

      const { name, symbol, decimals } = await getERC20TokenInfo(address, chainId)
      return { name, symbol, decimals }
    } catch (error) {
      console.error("Error fetching token info:", error);
      return null;
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select onValueChange={(value) => {
              field.onChange(value);
              if (value !== 'custom') {
                const token = TOKEN_LIST[Number(value)];
                const chainIdKey: ChainIdKey = `ChainId_${chainId as SupportedChainId}`;
                onTokenInfoChange?.({
                  name: token.NAME,
                  symbol: token.NAME,
                  decimals: token.DECIMALS,
                  address: token.ADDRESS[chainIdKey],
                });
              }
              else {
                onTokenInfoChange?.({
                  name: customToken?.name || '',
                  symbol: customToken?.symbol || '',
                  decimals: customToken?.decimals || 18,
                  address: customTokenAddress || ""
                });
              }
            }} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <div className="p-2">
                  <FormField
                    control={control}
                    name={addressFieldName}
                    render={({ field: addressField }) => (
                      <FormItem className="space-y-1">
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input
                              placeholder="Enter token address (0x...)"
                              {...addressField}
                              onChange={(e) => {
                                addressField.onChange(e);
                                if (e.target.value.length === 42) {
                                  fetchTokenInfo(e.target.value).then((info) => {
                                    if (info) {
                                      setCustomTokenAddress(e.target.value);
                                      setCustomToken(info);
                                      onTokenInfoChange?.({
                                        ...info,
                                        address: e.target.value
                                      });
                                      // Find the form context and update the token field
                                      const form = (control as any)._formState.form;
                                      if (form) {
                                        form.setValue(name, "custom");
                                      }
                                    }
                                  });
                                }
                              }}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="px-2 py-1 text-sm text-muted-foreground">Or select from list:</div>
                {customToken && (
                  <SelectItem value="custom">
                    {customToken.symbol} ({customToken.name})
                  </SelectItem>
                )}
                <Separator />

                {TOKEN_LIST.map((v, i) => (
                  <SelectItem key={v.NAME} value={i.toString()}>
                    {v.NAME}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
