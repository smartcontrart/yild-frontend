import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { usePublicClient } from "wagmi";
import { getContract, erc20Abi } from "viem";
import { Control } from "react-hook-form";

import { TOKEN_LIST } from "@/utils/constants";

interface TokenSelectorProps {
  control: Control<any>;
  name: string;
  label: string;
  addressFieldName: string;
}

export function TokenSelector({ control, name, label, addressFieldName }: TokenSelectorProps) {
  const publicClient = usePublicClient();
  const [customToken, setCustomToken] = useState<{ name: string; symbol: string; decimals: number } | null>(null);

  const fetchTokenInfo = async (address: string): Promise<{ name: string; symbol: string; decimals: number } | null> => {
    try {
      if (!publicClient) {
        console.error("Public client not initialized");
        return null;
      }

      const contract = getContract({
        address: address as `0x${string}`,
        abi: erc20Abi,
        client: publicClient,
      });

      const [name, symbol, decimals] = await Promise.all([
        contract.read.name(),
        contract.read.symbol(),
        contract.read.decimals(),
      ]);

      return { name, symbol, decimals };
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
            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                      setCustomToken(info);
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
