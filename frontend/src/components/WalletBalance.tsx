import React from "react";

export interface WalletBalance {
  walletAddress: string;
  usdcBalance: number;
}

export const WalletBalance: React.FC<WalletBalance> = ({
  walletAddress,
  usdcBalance,
}) => {
  return (
    <div className="bg-gray-900 rounded-xl p-6 mb-6 flex justify-between items-center">
      <div>
        <p className="text-gray-400 text-sm">Agent Treasury Wallet</p>
        <p className="font-mono text-sm mt-1">{walletAddress}</p>
      </div>
      <div className="text-right">
        <p className="text-gray-400 text-sm">USDC Balance</p>
        <p className="text-3xl font-bold text-green-400">${usdcBalance}</p>
      </div>
    </div>
  );
};
