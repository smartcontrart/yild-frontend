"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button"; // Using ShadCN button
import { Wallet, LogOut } from "lucide-react"; // Icons

export default function CustomWalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, openChainModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

        if (!connected) {
          return (
            <Button variant="outline" className="" onClick={openConnectModal}>
              <Wallet className="w-5 h-5" />
              <span className="ml-1 hidden md:block">Sign In</span>
            </Button>
          );
        }

        return (
          <div className="flex flex-row gap-2">
            <Button variant="outline" onClick={openChainModal}>
              <span>
                {chain.hasIcon && (
                  <img src={chain.iconUrl} alt={chain.name} className="w-5 h-5 rounded-full" />
                )}
              </span>
              <span className="hidden md:block">
                {chain.name}
              </span>
            </Button>

            <Button variant="default" onClick={() => openAccountModal()}>
              <LogOut className="w-5 h-5" /> 
              <span className="hidden md:block">
                {account.displayName}
              </span>
            </Button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
