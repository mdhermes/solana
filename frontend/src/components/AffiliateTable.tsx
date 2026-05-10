import React from "react";

interface Affiliate {
  id: string;
  name: string;
  pendingAmount: number;
  totalPaid: number;
}

export const AffiliateTable: React.FC<{ affiliates: Affiliate[] }> = ({
  affiliates,
}) => {
  return (
    <div className="bg-gray-900 rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Affiliates</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-left">
            <th className="pb-3">Name</th>
            <th className="pb-3">Pending</th>
            <th className="pb-3">Total Paid</th>
          </tr>
        </thead>
        <tbody>
          {affiliates.map((a) => (
            <tr key={a.id} className="border-t border-gray-800">
              <td className="py-3">{a.name}</td>
              <td className="py-3 text-yellow-400">
                ${a.pendingAmount.toFixed(2)}
              </td>
              <td className="py-3 text-green-400">${a.totalPaid.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
