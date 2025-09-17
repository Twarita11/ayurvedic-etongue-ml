"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("history") || "[]");
    setHistory(saved);
  }, []);

  return (
    <div className="min-h-screen bg-green-50">
      <div className="max-w-7xl mx-auto w-full py-5 px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl text-center font-semibold mb-6 text-green-800">
          Analysis History
        </h2>
        <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 bg-white">
          <table className="min-w-full border-collapse">
            <thead className="bg-green-600 text-white uppercase text-sm tracking-wide">
              <tr>
                <th className="py-3 px-3 sm:px-6 text-left">Date</th>
                <th className="py-3 px-3 sm:px-6 text-left">Herb</th>
                <th className="py-3 px-3 sm:px-6 text-left">Status</th>
                <th className="py-3 px-3 sm:px-6 text-left">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No analysis history found.
                  </td>
                </tr>
              ) : (
                history.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`text-gray-700 border-b border-gray-100 hover:bg-green-50 transition-colors ${
                      idx % 2 === 0 ? "bg-green-50/50" : "bg-white"
                    }`}
                  >
                    <td className="py-2 px-3 sm:px-6 text-sm sm:text-base">
                      {new Date(item.date || Date.now()).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 sm:px-6 font-medium text-sm sm:text-base">
                      {item.herbName}
                    </td>
                    <td className="py-2 px-3 sm:px-6 capitalize text-sm sm:text-base">
                      {item.status}
                    </td>
                    <td className="py-2 px-3 sm:px-6 text-sm sm:text-base">
                      {item.confidence}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
