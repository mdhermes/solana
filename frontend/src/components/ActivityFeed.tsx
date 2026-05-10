import React from "react";

interface Action {
  id: string;
  description: string;
  createdAt: string;
}

export const ActivityFeed: React.FC<{ actions: Action[] }> = ({ actions }) => {
  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Agent Activity</h2>
      <div className="space-y-3">
        {actions.map((a) => (
          <div key={a.id} className="border-l-2 border-purple-500 pl-4">
            <p className="text-sm">{a.description}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(a.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
