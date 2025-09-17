"use client";
import { BarChart, Bar, XAxis, YAxis } from "recharts";

const testData = [
  { compound: "Test A", value: 30 },
  { compound: "Test B", value: 50 },
];

export default function BarChartCompounds() {
  return (
    <BarChart width={400} height={300} data={testData}>
      <XAxis dataKey="compound" />
      <YAxis />
      <Bar dataKey="value" fill="#2b6cb0" />
    </BarChart>
  );
}
