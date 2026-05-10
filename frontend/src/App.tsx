import { useEffect, useState } from "react";
import { apiClient } from "./api/client";
import { WalletBalance } from "./components/WalletBalance";
import { AffiliateTable } from "./components/AffiliateTable";
import { ActivityFeed } from "./components/ActivityFeed";
import "./index.css";

export default function App() {
  const [data, setData] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const fetchData = () =>
    apiClient.get("/api/dashboard").then((r) => setData(r.data));

  useEffect(() => {
    fetchData();
  }, []);

  const triggerAgent = async () => {
    setRunning(true);
    try {
      await apiClient.post("/api/agent/run");
      await fetchData();
    } catch (error) {
      console.error("Agent run failed:", error);
    }
    setRunning(false);
  };

  if (!data) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">RevShare Agent</h1>
        <p className="text-gray-400 mb-8">
          Autonomous AI CFO for Indian SaaS founders
        </p>

        {/* Wallet */}
        <WalletBalance
          walletAddress={data.walletAddress}
          usdcBalance={data.usdcBalance}
        />

        {/* Trigger Button */}
        <button
          onClick={triggerAgent}
          disabled={running}
          className="mb-8 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold"
        >
          {running ? "Agent Running..." : "Run Agent Now"}
        </button>

        {/* Affiliates */}
        <AffiliateTable affiliates={data.affiliates} />

        {/* Activity Feed */}
        <ActivityFeed actions={data.actions} />
      </div>
    </div>
  );
}
