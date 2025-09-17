"use client";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from "recharts";

export default function RadarChartTaste({ data }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h4 className="font-bold mb-2">Taste Profile</h4>
      <RadarChart width={400} height={300} data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="taste" />
        <Radar
          dataKey="value"
          stroke="#2f855a"
          fill="#38a169"
          fillOpacity={0.6}
        />
        <Tooltip />
      </RadarChart>
    </div>
  );
}
