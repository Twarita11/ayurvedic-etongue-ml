"use client";

import { useState } from "react";
import RadarChartTaste from "@/components/RadarChartTaste";
import BarChartCompounds from "@/components/BarChartCompounds";

export default function Analysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fetchResult = async () => {
    setLoading(true);
    try {
      // Replace with actual ML API endpoint in future
      const res = await fetch("/api/mock-result");
      const data = await res.json();
      setResult(data);

      // Save to localStorage
      const history = JSON.parse(localStorage.getItem("history") || "[]");
      localStorage.setItem("history", JSON.stringify([data, ...history]));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50">
      <div className="max-w-7xl mx-auto w-full py-5 px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-semibold mb-6 text-green-800 text-center">
          Analyze Herbal Sample
        </h2>
        <div className="flex justify-center">
          <button
            onClick={fetchResult}
            className="px-8 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 font-medium transition"
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Fetch from API"}
          </button>
        </div>

        {result && (
          <div className="mt-8 space-y-8 bg-white rounded-xl shadow-lg p-6">
            <div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">
                {result.herbName}
              </h3>
              <p className="text-lg">
                Status: <span className="font-semibold">{result.status}</span>
              </p>
              <p className="text-lg">Confidence: {result.confidence}%</p>
            </div>

            <RadarChartTaste data={result.tasteProfile} />
            <BarChartCompounds data={result.compounds} />
          </div>
        )}
      </div>
    </div>
  );
}
