// "use client";

// import { useState, useEffect } from "react";
// import {
//   LineChart,
//   Line,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// export default function Dashboard() {
//   const [factoryName, setFactoryName] = useState("");
//   const [medicineName, setMedicineName] = useState("");
//   const [factoryMedicineId, setFactoryMedicineId] = useState("");
//   const [data, setData] = useState([]);
//   const [lastPredictionTimestamp, setLastPredictionTimestamp] = useState(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const f = localStorage.getItem("factoryName") || "";
//     const m = localStorage.getItem("medicineName") || "";

//     setFactoryName(f);
//     setMedicineName(m);

//     if (f && m) {
//       setFactoryMedicineId(`${f}_${m}`);
//     }
//   }, []);

//   const handleStartPrediction = async () => {
//     if (!factoryMedicineId) {
//       alert("No Factory/Medicine ID found in localStorage.");
//       return;
//     }

//     setLoading(true);
//     setLastPredictionTimestamp(new Date());

//     try {
//       const payload = {
//         taste_sweet: 0,
//         taste_salty: 0,
//         taste_bitter: 0,
//         taste_sour: 0,
//         taste_umami: 0,
//         quality: 0,
//         dilution: 0,
//         status: 2,
//         factory: factoryName,
//       };

//       const res = await fetch(
//         `https://photontroppers.onrender.com/picron/${factoryMedicineId}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );

//       const result = await res.json();

//       if (res.ok) {
//         alert("Prediction process started. Waiting 15 seconds for results.");
//         setTimeout(fetchPredictionResults, 15000);
//       } else {
//         alert("Failed to start prediction process.");
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error("Error setting prediction status:", error);
//       alert("Error sending prediction request.");
//       setLoading(false);
//     }
//   };

//   const fetchPredictionResults = async () => {
//     try {
//       const res = await fetch(
//         `https://photontroppers.onrender.com/predict/${factoryMedicineId}`
//       );
//       const json = await res.json();

//       const filteredData = (json.data || []).filter(
//         (d) => new Date(d.timestamp) > lastPredictionTimestamp
//       );

//       const cleaned = filteredData.map((d, idx) => ({
//         id: idx,
//         timestamp: d.timestamp,
//         taste_sweet: d.taste_sweet ?? 0,
//         taste_salty: d.taste_salty ?? 0,
//         taste_bitter: d.taste_bitter ?? 0,
//         taste_sour: d.taste_sour ?? 0,
//         taste_umami: d.taste_umami ?? 0,
//         quality: d.quality ?? 0,
//         dilution: d.dilution ?? 0,
//       }));

//       setData(cleaned);
//       setLoading(false);

//       if (cleaned.length > 0) {
//         alert("Prediction results fetched successfully!");
//       } else {
//         alert("No new prediction data found.");
//       }
//     } catch (err) {
//       console.error("Error fetching predictions:", err);
//       alert("Error fetching prediction results.");
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-green-50 py-8 px-4">
//       <div className="max-w-4xl mx-auto space-y-8">
//         <header className="text-center">
//           <h1 className="text-3xl font-bold text-green-900">
//             Prediction Dashboard
//           </h1>
//           <p className="text-sm text-gray-700 mt-2">
//             factory_medicine_id detected:{" "}
//             <span className="font-medium">
//               {factoryMedicineId || "not set"}
//             </span>
//           </p>
//         </header>

//         <section className="bg-white rounded-xl shadow p-6">
//           <h2 className="text-xl font-semibold mb-3">
//             Start Prediction Process
//           </h2>

//           {factoryMedicineId ? (
//             <p className="mb-4 text-gray-700">
//               Factory-Medicine ID:{" "}
//               <span className="font-semibold">{factoryMedicineId}</span>
//             </p>
//           ) : (
//             <p className="mb-4 text-red-600">
//               No Factory/Medicine ID set. Please go to the landing page first.
//             </p>
//           )}

//           <div className="flex flex-wrap gap-4 mb-4">
//             <button
//               onClick={handleStartPrediction}
//               className={`px-4 py-2 rounded-lg font-medium ${
//                 factoryMedicineId && !loading
//                   ? "bg-green-700 text-white hover:bg-green-800"
//                   : "bg-gray-200 text-gray-500 cursor-not-allowed"
//               }`}
//               disabled={loading || !factoryMedicineId}
//             >
//               {loading ? "Please Wait..." : "Start Prediction"}
//             </button>
//           </div>
//         </section>

//         <section className="bg-white rounded-xl shadow p-6">
//           <h2 className="text-xl font-semibold mb-3">Prediction Results</h2>

//           {data.length > 0 ? (
//             <div className="mt-6">
//               <ResponsiveContainer width="100%" height={400}>
//                 <LineChart data={data}>
//                   <CartesianGrid stroke="#ccc" />
//                   <XAxis dataKey="timestamp" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Line
//                     type="monotone"
//                     dataKey="taste_sweet"
//                     stroke="#8884d8"
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="taste_salty"
//                     stroke="#82ca9d"
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="taste_bitter"
//                     stroke="#ff7300"
//                   />
//                   <Line type="monotone" dataKey="taste_sour" stroke="#ff0000" />
//                   <Line
//                     type="monotone"
//                     dataKey="taste_umami"
//                     stroke="#00bfff"
//                   />
//                   <Line type="monotone" dataKey="quality" stroke="#000" />
//                   <Line type="monotone" dataKey="dilution" stroke="#808080" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           ) : (
//             <p className="text-gray-500 mt-4">
//               No prediction results loaded yet. Click Start Prediction to begin.
//             </p>
//           )}

//           <pre className="mt-4 bg-gray-100 p-2 rounded text-sm overflow-x-auto">
//             {JSON.stringify(data, null, 2)}
//           </pre>
//         </section>
//       </div>
//     </div>
//   );
// }
// "use client";
// import { useState, useEffect } from "react";
// import {
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import html2canvas from "html2canvas";
// import { jsPDF } from "jspdf";
// import TelegramSubscribe from "@/components/TelegramSubscribe";
// const DUMMY_DATA = [
//   {
//     timestamp: "15:19:05",
//     taste_sweet: 3.49,
//     taste_salty: 2.16,
//     taste_bitter: 2.43,
//     taste_sour: 0.85,
//     taste_umami: 0.88,
//     quality: 1.28,
//     dilution: 0.49,
//   },
//   {
//     timestamp: "15:21:58",
//     taste_sweet: 2.32,
//     taste_salty: 1.12,
//     taste_bitter: 1.6,
//     taste_sour: 0.85,
//     taste_umami: 0.88,
//     quality: 1.12,
//     dilution: 0.45,
//   },
//   {
//     timestamp: "15:22:22",
//     taste_sweet: 2.39,
//     taste_salty: 2.16,
//     taste_bitter: 1.63,
//     taste_sour: 0.85,
//     taste_umami: 0.88,
//     quality: 1.12,
//     dilution: 0.45,
//   },
//   {
//     timestamp: "15:23:57",
//     taste_sweet: 2.32,
//     taste_salty: 1.1,
//     taste_bitter: 0.81,
//     taste_sour: 0.85,
//     taste_umami: 0.88,
//     quality: 1.12,
//     dilution: 0.5,
//   },
//   {
//     timestamp: "15:24:35",
//     taste_sweet: 2.55,
//     taste_salty: 2.16,
//     taste_bitter: 1.63,
//     taste_sour: 0.85,
//     taste_umami: 0.88,
//     quality: 2.24,
//     dilution: 0.47,
//   },
//   {
//     timestamp: "15:26:00",
//     taste_sweet: 3.49,
//     taste_salty: 2.16,
//     taste_bitter: 1.99,
//     taste_sour: 0.85,
//     taste_umami: 0.88,
//     quality: 1.12,
//     dilution: 0.44,
//   },
//   {
//     timestamp: "15:26:13",
//     taste_sweet: 3.66,
//     taste_salty: 2.16,
//     taste_bitter: 1.63,
//     taste_sour: 0.85,
//     taste_umami: 0.88,
//     quality: 1.12,
//     dilution: 0.44,
//   },
//   {
//     timestamp: "15:26:28",
//     taste_sweet: 3.49,
//     taste_salty: 2.16,
//     taste_bitter: 1.63,
//     taste_sour: 0.85,
//     taste_umami: 0.88,
//     quality: 1.57,
//     dilution: 0.46,
//   },
//   {
//     timestamp: "15:26:42",
//     taste_sweet: 3.49,
//     taste_salty: 2.16,
//     taste_bitter: 1.63,
//     taste_sour: 0.85,
//     taste_umami: 0.88,
//     quality: 2.24,
//     dilution: 0.45,
//   },
//   {
//     timestamp: "15:27:04",
//     taste_sweet: 3.89,
//     taste_salty: 2.16,
//     taste_bitter: 1.63,
//     taste_sour: 0.85,
//     taste_umami: 0.88,
//     quality: 2.24,
//     dilution: 0.47,
//   },
// ];

// const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

// export default function Dashboard() {
//   const [factoryName, setFactoryName] = useState("");
//   const [medicineName, setMedicineName] = useState("");
//   const [factoryMedicineId, setFactoryMedicineId] = useState("");
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [processedData, setProcessedData] = useState(null);

//   useEffect(() => {
//     const f = localStorage.getItem("factoryName") || "";
//     const m = localStorage.getItem("medicineName") || "";
//     setFactoryName(f);
//     setMedicineName(m);
//     if (f && m) {
//       setFactoryMedicineId(`${f}_${m}`);
//     }
//   }, []);

//   const processDataForGraphs = (dataToProcess) => {
//     if (!dataToProcess || dataToProcess.length === 0) {
//       setProcessedData(null);
//       return;
//     }

//     const tasteProfiles = [
//       "taste_sweet",
//       "taste_salty",
//       "taste_bitter",
//       "taste_sour",
//       "taste_umami",
//     ];
//     const tasteAverages = tasteProfiles.map((key) => ({
//       name: key.replace("taste_", "").toUpperCase(),
//       value:
//         dataToProcess.reduce((sum, item) => sum + item[key], 0) /
//         dataToProcess.length,
//     }));

//     const prominentTaste = tasteAverages.reduce((prev, current) =>
//       prev.value > current.value ? prev : current
//     ).name;

//     const dilutionEffectivenessData = dataToProcess.map((item) => ({
//       ...item,
//       effectiveness: 1 - item.dilution,
//     }));

//     const finalEffectivenessScore =
//       dilutionEffectivenessData.reduce(
//         (sum, item) => sum + item.effectiveness,
//         0
//       ) / dilutionEffectivenessData.length;

//     const finalVerdict = finalEffectivenessScore > 0.5 ? "Good" : "Bad";

//     setProcessedData({
//       tasteAverages,
//       dilutionEffectivenessData,
//       prominentTaste,
//       finalEffectivenessScore,
//       finalVerdict,
//     });
//   };

//   const handleStartPrediction = async () => {
//     if (!factoryMedicineId) {
//       alert("No Factory/Medicine ID found in localStorage.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const payload = {
//         taste_sweet: 0,
//         taste_salty: 0,
//         taste_bitter: 0,
//         taste_sour: 0,
//         taste_umami: 0,
//         quality: 0,
//         dilution: 0,
//         status: 2,
//         factory: factoryName,
//       };

//       const res = await fetch(
//         `https://photontroppers.onrender.com/picron/${factoryMedicineId}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (res.ok) {
//         alert("Prediction process started. Waiting 15 seconds for results.");
//         setTimeout(() => {
//           setData(DUMMY_DATA);
//           processDataForGraphs(DUMMY_DATA);
//           setLoading(false);
//           alert("Prediction results fetched successfully!");
//         }, 1000);
//       } else {
//         alert("Failed to start prediction process.");
//         setLoading(false);
//       }
//     } catch (error) {
//       alert("Error sending prediction request.");
//       setLoading(false);
//     }
//   };

//   const generatePDFReport = async () => {
//     const reportElement = document.getElementById("report-section");
//     if (!reportElement) {
//       alert("Report section not found. Cannot generate PDF.");
//       return;
//     }

//     // Override unsupported color functions
//     const allElements = reportElement.querySelectorAll("*");
//     allElements.forEach((el) => {
//       const computedStyle = getComputedStyle(el);
//       if (computedStyle.color.includes("lab")) {
//         el.style.color = "#000"; // fallback to black
//       }
//       if (computedStyle.backgroundColor.includes("lab")) {
//         el.style.backgroundColor = "#fff"; // fallback to white
//       }
//     });

//     await new Promise((resolve) => setTimeout(resolve, 500));

//     const canvas = await html2canvas(reportElement, { scale: 2 });
//     const imgData = canvas.toDataURL("image/png");

//     const pdf = new jsPDF("p", "mm", "a4");
//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = pdf.internal.pageSize.getHeight();

//     const imgWidth = pdfWidth;
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     let heightLeft = imgHeight;
//     let position = 0;

//     pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
//     heightLeft -= pdfHeight;

//     while (heightLeft > 0) {
//       position = heightLeft - imgHeight;
//       pdf.addPage();
//       pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
//       heightLeft -= pdfHeight;
//     }

//     pdf.save("report.pdf");
//   };

//   return (
//     <div className="min-h-screen bg-green-50 py-8 px-4">
//       <div className="max-w-4xl mx-auto space-y-8">
//         <header className="text-center">
//           <h1 className="text-3xl font-bold text-green-900">
//             Prediction Dashboard
//           </h1>
//           <p className="text-sm text-gray-700 mt-2">
//             factory_medicine_id detected:{" "}
//             <span className="font-medium">
//               {factoryMedicineId || "not set"}
//             </span>
//           </p>
//         </header>

//         <section className="bg-white rounded-xl shadow p-6">
//           <h2 className="text-xl font-semibold mb-3">
//             Start Prediction Process
//           </h2>
//           {factoryMedicineId ? (
//             <p className="mb-4 text-gray-700">
//               Factory-Medicine ID:{" "}
//               <span className="font-semibold">{factoryMedicineId}</span>
//             </p>
//           ) : (
//             <p className="mb-4 text-red-600">
//               No Factory/Medicine ID set. Please go to the landing page first.
//             </p>
//           )}
//           <div className="flex flex-wrap gap-4 mb-4">
//             <button
//               onClick={handleStartPrediction}
//               className={`px-4 py-2 rounded-lg font-medium ${
//                 factoryMedicineId && !loading
//                   ? "bg-green-700 text-white hover:bg-green-800"
//                   : "bg-gray-200 text-gray-500 cursor-not-allowed"
//               }`}
//               disabled={loading || !factoryMedicineId}
//             >
//               {loading ? "Please Wait..." : "Start Prediction"}
//             </button>
//           </div>
//         </section>

//         {processedData && (
//           <section className="bg-white rounded-xl shadow p-6">
//             <h2 className="text-xl font-semibold mb-3">Prediction Results</h2>
//             <div id="report-section">
//               <h3 className="text-lg font-semibold mb-2 text-green-800">
//                 Final Verdict
//               </h3>
//               <div className="mb-6">
//                 <p>
//                   The most prominent taste of this medicine is{" "}
//                   {processedData.prominentTaste}.
//                 </p>
//                 <p>
//                   The overall effectiveness score is{" "}
//                   {processedData.finalEffectivenessScore.toFixed(2)}, and the
//                   quality is considered {processedData.finalVerdict}.
//                 </p>
//               </div>

//               <h3 className="text-lg font-semibold mb-2 text-green-800">
//                 1. Taste Profile Analysis
//               </h3>
//               <div className="mt-6">
//                 <ResponsiveContainer width="100%" height={300}>
//                   <PieChart>
//                     <Pie
//                       data={processedData.tasteAverages}
//                       dataKey="value"
//                       nameKey="name"
//                       cx="50%"
//                       cy="50%"
//                       outerRadius={100}
//                       label
//                     >
//                       {processedData.tasteAverages.map((entry, index) => (
//                         <Cell
//                           key={`cell-${index}`}
//                           fill={COLORS[index % COLORS.length]}
//                         />
//                       ))}
//                     </Pie>
//                     <Tooltip />
//                     <Legend />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>

//               <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
//                 2. Dilution Level vs. Effectiveness
//               </h3>
//               <div className="mt-6">
//                 <ResponsiveContainer width="100%" height={300}>
//                   <LineChart data={processedData.dilutionEffectivenessData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="timestamp" />
//                     <YAxis domain={[0, 1]} />
//                     <Tooltip />
//                     <Legend />
//                     <Line
//                       type="monotone"
//                       dataKey="dilution"
//                       stroke="#8884d8"
//                       name="Dilution"
//                     />
//                     <Line
//                       type="monotone"
//                       dataKey="effectiveness"
//                       stroke="#82ca9d"
//                       name="Effectiveness"
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>

//               <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
//                 3. Raw Data
//               </h3>
//               <pre className="mt-4 bg-gray-100 p-2 rounded text-sm overflow-x-auto">
//                 {JSON.stringify(data, null, 2)}
//               </pre>
//             </div>
//             <button
//               onClick={generatePDFReport}
//               className="mt-4 px-4 py-2 rounded-lg font-medium bg-green-700 text-white hover:bg-green-800 cursor-pointer"
//             >
//               Download Report as PDF
//             </button>
//           </section>
//         )}
//       </div>
//       <div
//         style={{
//           position: "fixed",
//           bottom: "20px",
//           right: "20px",
//           zIndex: 1000,
//         }}
//       >
//         <TelegramSubscribe />
//       </div>
//     </div>
//   );
// }
"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
} from "recharts";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import TelegramSubscribe from "@/components/TelegramSubscribe";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];
const QUALITY_COLORS = ["#ff4444", "#ffaa44", "#ffff44", "#aaff44", "#44ff44"];

export default function Dashboard() {
  const [factoryName, setFactoryName] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [factoryMedicineId, setFactoryMedicineId] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    const f = localStorage.getItem("factoryName") || "";
    const m = localStorage.getItem("medicineName") || "";
    setFactoryName(f);
    setMedicineName(m);
    if (f && m) {
      setFactoryMedicineId(`${f}_${m}`);
    }
  }, []);

  const processDataForGraphs = (dataToProcess) => {
    if (!dataToProcess || dataToProcess.length === 0) {
      setProcessedData(null);
      return;
    }

    const tasteProfiles = [
      "taste_sweet",
      "taste_salty",
      "taste_bitter",
      "taste_sour",
      "taste_umami",
    ];

    const tasteAverages = tasteProfiles.map((key) => ({
      name: key.replace("taste_", "").toUpperCase(),
      value:
        dataToProcess.reduce((sum, item) => sum + item[key], 0) /
        dataToProcess.length,
    }));

    const prominentTaste = tasteAverages.reduce((prev, current) =>
      prev.value > current.value ? prev : current
    ).name;

    const dilutionEffectivenessData = dataToProcess.map((item) => ({
      ...item,
      effectiveness: 1 - item.dilution,
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
    }));

    // Enhanced processing for new visualizations
    const spectralData = dataToProcess.map((item, index) => ({
      sample: `S${index + 1}`,
      R: item.as7263_r,
      S: item.as7263_s,
      T: item.as7263_t,
      U: item.as7263_u,
      V: item.as7263_v,
      W: item.as7263_w,
      quality: item.quality,
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
    }));

    const radarData = dataToProcess.map((item, index) => ({
      sample: `Sample ${index + 1}`,
      Sweet: item.taste_sweet,
      Salty: item.taste_salty,
      Bitter: item.taste_bitter,
      Sour: item.taste_sour,
      Umami: item.taste_umami,
    }));

    const qualityScatterData = dataToProcess.map((item, index) => ({
      x:
        item.taste_sweet +
        item.taste_salty +
        item.taste_bitter +
        item.taste_sour +
        item.taste_umami,
      y: item.quality,
      z: item.dilution * 100,
      mq3: item.mq3_ppm,
      sample: `S${index + 1}`,
    }));

    const chemicalIndicators = dataToProcess.map((item, index) => ({
      sample: `S${index + 1}`,
      MQ3_PPM: item.mq3_ppm,
      Dilution: item.dilution * 100,
      Quality: item.quality,
      Temperature: item.temperature,
    }));

    const tasteBalanceData = dataToProcess.map((item, index) => {
      const tastes = [
        item.taste_sweet,
        item.taste_salty,
        item.taste_bitter,
        item.taste_sour,
        item.taste_umami,
      ];
      const mean = tastes.reduce((a, b) => a + b) / tastes.length;
      const variance =
        tastes.reduce((sum, taste) => sum + Math.pow(taste - mean, 2), 0) /
        tastes.length;
      const balance = Math.sqrt(variance);

      return {
        sample: `S${index + 1}`,
        quality: item.quality,
        balance: balance,
        dominantTaste: Math.max(...tastes),
        timestamp: new Date(item.timestamp).toLocaleTimeString(),
      };
    });

    const finalEffectivenessScore =
      dilutionEffectivenessData.reduce(
        (sum, item) => sum + item.effectiveness,
        0
      ) / dilutionEffectivenessData.length;

    const finalVerdict = finalEffectivenessScore > 0.5 ? "GOOD" : "BAD";

    setProcessedData({
      tasteAverages,
      dilutionEffectivenessData,
      prominentTaste,
      finalEffectivenessScore,
      finalVerdict,
      spectralData,
      radarData,
      qualityScatterData,
      chemicalIndicators,
      tasteBalanceData,
    });
  };

  const handleStartPrediction = async () => {
    if (!factoryMedicineId) {
      alert("No Factory/Medicine ID found in localStorage.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        taste_sweet: 0,
        taste_salty: 0,
        taste_bitter: 0,
        taste_sour: 0,
        taste_umami: 0,
        quality: 0,
        dilution: 0,
        status: 2,
        factory: factoryName,
      };

      const res = await fetch(
        `https://photontroppers.onrender.com/picron/${factoryMedicineId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        alert("Prediction process started. Waiting 10 seconds for results.");
        setTimeout(async () => {
          const resultRes = await fetch(
            `https://photontroppers.onrender.com/predict/${factoryMedicineId}`
          );
          if (!resultRes.ok) {
            alert("Failed to fetch prediction results.");
            setLoading(false);
            return;
          }
          const json = await resultRes.json();
          if (json.status === "success" && Array.isArray(json.data)) {
            setData(json.data);
            processDataForGraphs(json.data);
            alert("Prediction results fetched successfully!");
          } else {
            alert("Unexpected response format from prediction API.");
          }
          setLoading(false);
        }, 10000);
      } else {
        alert("Failed to start prediction process.");
        setLoading(false);
      }
    } catch (error) {
      alert("Error sending prediction request.");
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    const reportElement = document.getElementById("report-section");
    if (!reportElement) {
      alert("Report section not found. Cannot generate PDF.");
      return;
    }

    const allElements = reportElement.querySelectorAll("*");
    allElements.forEach((el) => {
      const computedStyle = getComputedStyle(el);
      if (computedStyle.color.includes("lab")) {
        el.style.color = "#000";
      }
      if (computedStyle.backgroundColor.includes("lab")) {
        el.style.backgroundColor = "#fff";
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    const canvas = await html2canvas(reportElement, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save("report.pdf");
  };

  return (
    <div className="min-h-screen bg-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-green-900">
            Prediction Dashboard
          </h1>
          <p className="text-sm text-gray-700 mt-2">
            factory_medicine_id detected:{" "}
            <span className="font-medium">
              {factoryMedicineId || "not set"}
            </span>
          </p>
        </header>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-3">
            Start Prediction Process
          </h2>
          {factoryMedicineId ? (
            <p className="mb-4 text-gray-700">
              Factory-Medicine ID:{" "}
              <span className="font-semibold">{factoryMedicineId}</span>
            </p>
          ) : (
            <p className="mb-4 text-red-600">
              No Factory/Medicine ID set. Please go to the landing page first.
            </p>
          )}
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={handleStartPrediction}
              className={`px-4 py-2 rounded-lg font-medium ${
                factoryMedicineId && !loading
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              disabled={loading || !factoryMedicineId}
            >
              {loading ? "Please Wait..." : "Start Prediction"}
            </button>
          </div>
        </section>

        {processedData && (
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-3">Prediction Results</h2>
            <div id="report-section">
              <h3 className="text-lg font-semibold mb-2 text-green-800">
                Final Verdict
              </h3>
              <div className="mb-6">
                <p>
                  The most prominent taste of this medicine is{" "}
                  {processedData.prominentTaste}.
                </p>
                <p>The quality is {processedData.finalVerdict}.</p>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-800">
                1. Taste Profile Analysis
              </h3>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={processedData.tasteAverages}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {processedData.tasteAverages.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* 2. Multi-dimensional Radar Chart */}
              {/* <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
                2. Taste Profile Radar Chart
              </h3>
              <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
                3. Taste Radar Chart
              </h3>
              <div className="mt-6" style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={processedData.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis domain={[0, "dataMax"]} />
                    <Radar
                      name="Taste Intensity"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div> */}
              {/* 3. Spectral Analysis Line Chart */}

              <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
                2. Spectral Signature Analysis (AS7263 Readings)
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={processedData.spectralData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="sample"
                    axisLine={true}
                    tickLine={true}
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Sample ID",
                      position: "insideBottom",
                      offset: -10,
                      style: {
                        textAnchor: "middle",
                        fontSize: "14px",
                        fontWeight: "bold",
                      },
                    }}
                  />
                  <YAxis
                    axisLine={true}
                    tickLine={true}
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Spectral Intensity",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fontSize: "14px",
                        fontWeight: "bold",
                      },
                    }}
                    domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #dee2e6",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => [value.toFixed(3), name]}
                    labelFormatter={(label) => `Sample: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="R"
                    stroke="#ff0000"
                    name="R Channel"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="S"
                    stroke="#00ff00"
                    name="S Channel"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="T"
                    stroke="#0000ff"
                    name="T Channel"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="U"
                    stroke="#ffaa00"
                    name="U Channel"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="V"
                    stroke="#ff00ff"
                    name="V Channel"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="W"
                    stroke="#00ffff"
                    name="W Channel"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 text-sm text-gray-600 text-center">
                <p>
                  <strong>X-axis:</strong> Sample ID (S1, S2, S3, ...) |{" "}
                  <strong>Y-axis:</strong> Spectral Intensity Values
                </p>
                <p className="text-xs mt-1">
                  AS7263 sensor channels represent different wavelength
                  responses for spectral analysis
                </p>
              </div>
              {/* 4. Quality vs Taste Intensity Scatter Plot */}
              {/* <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
                4. Quality vs Total Taste Intensity
              </h3>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={processedData.qualityScatterData}>
                    <CartesianGrid />
                    <XAxis dataKey="x" name="Total Taste Intensity" />
                    <YAxis dataKey="y" name="Quality Score" />
                    <Tooltip
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p>Sample: {data.sample}</p>
                              <p>Taste Intensity: {data.x.toFixed(2)}</p>
                              <p>Quality: {data.y.toFixed(2)}</p>
                              <p>Dilution: {data.z.toFixed(2)}%</p>
                              <p>MQ3: {data.mq3.toFixed(3)} ppm</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Samples" dataKey="y" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div> */}
              {/* 5. Chemical Indicators Bar Chart */}
              {/* <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
                5. Chemical Indicators Analysis
              </h3>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedData.chemicalIndicators}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sample" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="MQ3_PPM" fill="#ff7300" name="MQ3 (ppm)" />
                    <Bar dataKey="Dilution" fill="#387908" name="Dilution %" />
                    <Bar
                      dataKey="Quality"
                      fill="#0088fe"
                      name="Quality Score"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>{" "} */}
              {/* 6. Taste Balance vs Quality */}
              {/* <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
                6. Taste Balance vs Quality Analysis
              </h3>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={processedData.tasteBalanceData}>
                    <CartesianGrid />
                    <XAxis dataKey="balance" name="Taste Balance" />
                    <YAxis dataKey="quality" name="Quality Score" />
                    <Tooltip
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p>Sample: {data.sample}</p>
                              <p>Balance: {data.balance.toFixed(2)}</p>
                              <p>Quality: {data.quality.toFixed(2)}</p>
                              <p>
                                Dominant Taste: {data.dominantTaste.toFixed(2)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      name="Balance vs Quality"
                      dataKey="quality"
                      fill="#82ca9d"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div> */}
              {/* 7. Time Series Quality Trend */}
              {/* <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
                7. Quality Trend Over Time
              </h3>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={processedData.dilutionEffectivenessData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="quality"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Quality Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div> */}
              {/* 8. Original Dilution Level vs. Effectiveness */}
              {/* <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
                2. Dilution Level vs. Effectiveness
              </h3>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={processedData.dilutionEffectivenessData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="dilution"
                      stroke="#8884d8"
                      name="Dilution"
                    />
                    <Line
                      type="monotone"
                      dataKey="effectiveness"
                      stroke="#82ca9d"
                      name="Effectiveness"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div> */}
              {/* Raw Data Section - Commented Out */}
              {/* <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
                3. Raw Data
              </h3>
              <pre className="mt-4 bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre> */}
            </div>
            <button
              onClick={generatePDFReport}
              className="mt-4 px-4 py-2 rounded-lg font-medium bg-green-700 text-white hover:bg-green-800 cursor-pointer"
            >
              Download Report as PDF
            </button>
          </section>
        )}
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
        }}
      >
        <TelegramSubscribe />
      </div>
    </div>
  );
}
