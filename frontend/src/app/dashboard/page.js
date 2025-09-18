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
} from "recharts";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const DUMMY_DATA = [
  {
    timestamp: "15:19:05",
    taste_sweet: 3.49,
    taste_salty: 2.16,
    taste_bitter: 2.43,
    taste_sour: 0.85,
    taste_umami: 0.88,
    quality: 1.28,
    dilution: 0.49,
  },
  {
    timestamp: "15:21:58",
    taste_sweet: 2.32,
    taste_salty: 1.12,
    taste_bitter: 1.6,
    taste_sour: 0.85,
    taste_umami: 0.88,
    quality: 1.12,
    dilution: 0.45,
  },
  {
    timestamp: "15:22:22",
    taste_sweet: 2.39,
    taste_salty: 2.16,
    taste_bitter: 1.63,
    taste_sour: 0.85,
    taste_umami: 0.88,
    quality: 1.12,
    dilution: 0.45,
  },
  {
    timestamp: "15:23:57",
    taste_sweet: 2.32,
    taste_salty: 1.1,
    taste_bitter: 0.81,
    taste_sour: 0.85,
    taste_umami: 0.88,
    quality: 1.12,
    dilution: 0.5,
  },
  {
    timestamp: "15:24:35",
    taste_sweet: 2.55,
    taste_salty: 2.16,
    taste_bitter: 1.63,
    taste_sour: 0.85,
    taste_umami: 0.88,
    quality: 2.24,
    dilution: 0.47,
  },
  {
    timestamp: "15:26:00",
    taste_sweet: 3.49,
    taste_salty: 2.16,
    taste_bitter: 1.99,
    taste_sour: 0.85,
    taste_umami: 0.88,
    quality: 1.12,
    dilution: 0.44,
  },
  {
    timestamp: "15:26:13",
    taste_sweet: 3.66,
    taste_salty: 2.16,
    taste_bitter: 1.63,
    taste_sour: 0.85,
    taste_umami: 0.88,
    quality: 1.12,
    dilution: 0.44,
  },
  {
    timestamp: "15:26:28",
    taste_sweet: 3.49,
    taste_salty: 2.16,
    taste_bitter: 1.63,
    taste_sour: 0.85,
    taste_umami: 0.88,
    quality: 1.57,
    dilution: 0.46,
  },
  {
    timestamp: "15:26:42",
    taste_sweet: 3.49,
    taste_salty: 2.16,
    taste_bitter: 1.63,
    taste_sour: 0.85,
    taste_umami: 0.88,
    quality: 2.24,
    dilution: 0.45,
  },
  {
    timestamp: "15:27:04",
    taste_sweet: 3.89,
    taste_salty: 2.16,
    taste_bitter: 1.63,
    taste_sour: 0.85,
    taste_umami: 0.88,
    quality: 2.24,
    dilution: 0.47,
  },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

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
    }));

    const finalEffectivenessScore =
      dilutionEffectivenessData.reduce(
        (sum, item) => sum + item.effectiveness,
        0
      ) / dilutionEffectivenessData.length;

    const finalVerdict = finalEffectivenessScore > 0.5 ? "Good" : "Bad";

    setProcessedData({
      tasteAverages,
      dilutionEffectivenessData,
      prominentTaste,
      finalEffectivenessScore,
      finalVerdict,
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
        alert("Prediction process started. Waiting 15 seconds for results.");
        setTimeout(() => {
          setData(DUMMY_DATA);
          processDataForGraphs(DUMMY_DATA);
          setLoading(false);
          alert("Prediction results fetched successfully!");
        }, 1000);
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

    // Override unsupported color functions
    const allElements = reportElement.querySelectorAll("*");
    allElements.forEach((el) => {
      const computedStyle = getComputedStyle(el);
      if (computedStyle.color.includes("lab")) {
        el.style.color = "#000"; // fallback to black
      }
      if (computedStyle.backgroundColor.includes("lab")) {
        el.style.backgroundColor = "#fff"; // fallback to white
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
                <p>
                  The overall effectiveness score is{" "}
                  {processedData.finalEffectivenessScore.toFixed(2)}, and the
                  quality is considered {processedData.finalVerdict}.
                </p>
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

              <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
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
              </div>

              <h3 className="text-lg font-semibold mb-2 text-green-800 mt-6">
                3. Raw Data
              </h3>
              <pre className="mt-4 bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
            <button
              onClick={generatePDFReport}
              className="mt-4 px-4 py-2 rounded-lg font-medium bg-green-700 text-white hover:bg-green-800"
            >
              Download Report as PDF
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
