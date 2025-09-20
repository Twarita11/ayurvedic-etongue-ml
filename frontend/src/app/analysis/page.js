"use client";

import { useEffect, useRef, useState } from "react";
import TelegramSubscribe from "@/components/TelegramSubscribe";

export default function AnalysisPage() {
  const [factoryName, setFactoryName] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [factoryMedicineId, setFactoryMedicineId] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [isFetchingScript, setIsFetchingScript] = useState(false);
  const [collectionForm, setCollectionForm] = useState({
    taste_sweet: 0,
    taste_salty: 0,
    taste_bitter: 0,
    taste_sour: 0,
    taste_umami: 0,
    quality: 0,
    dilution: 0,
  });
  const [isSubmittingCollection, setIsSubmittingCollection] = useState(false);
  const [collectionStartTs, setCollectionStartTs] = useState(null);
  const [collectedEntries, setCollectedEntries] = useState([]);
  const pollingRef = useRef(null);
  const [csvFile, setCsvFile] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState(null);
  const [trainMessage, setTrainMessage] = useState("");
  const [isRequestingPrediction, setIsRequestingPrediction] = useState(false);
  const [predictionStartTs, setPredictionStartTs] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [predictionMessage, setPredictionMessage] = useState("");

  const BASE_URL = "https://photontroppers.onrender.com";
  const TRAIN_URL_TEMPLATE = `${BASE_URL}/train/train/`;
  useEffect(() => {
    const f = localStorage.getItem("factoryName") || "";
    const m = localStorage.getItem("medicineName") || "";
    setFactoryName(f);
    setMedicineName(m);

    if (f && m) {
      const id = `${f}_${m}`;
      setFactoryMedicineId(id);
    }
  }, []);

  useEffect(() => {
    if (factoryName && medicineName) {
      setFactoryMedicineId(`${factoryName}_${medicineName}`);
    }
  }, [factoryName, medicineName]);

  const fetchShellScript = async () => {
    if (!factoryMedicineId) {
      alert("Please set factory and medicine name on Home page first.");
      return;
    }
    setIsFetchingScript(true);
    setScriptText("");
    try {
      const res = await fetch(`${BASE_URL}/shell/${factoryMedicineId}`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to fetch script (${res.status}): ${text}`);
      }
      const txt = await res.text();
      setScriptText(txt || "# (empty script returned)");
    } catch (err) {
      console.error(err);
      setScriptText(`# Error fetching script: ${err.message || err}`);
    } finally {
      setIsFetchingScript(false);
    }
  };

  const downloadScript = () => {
    if (!scriptText) return;
    const filename = `${factoryMedicineId || "script"}.sh`;
    const blob = new Blob([scriptText], { type: "text/x-sh;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCollectionChange = (e) => {
    const { name, value } = e.target;
    setCollectionForm((s) => ({ ...s, [name]: Number(value) }));
  };

  const submitCollection = async () => {
    if (!factoryMedicineId) {
      alert("Please set factory and medicine name on Home page first.");
      return;
    }

    setIsSubmittingCollection(true);
    setCollectedEntries([]);
    setCollectionStartTs(Date.now());
    setCollectionForm((s) => ({ ...s }));

    const payload = {
      ...collectionForm,
      status: 1,
      factory: factoryName || "",
    };

    try {
      const res = await fetch(`${BASE_URL}/picron/${factoryMedicineId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Failed to submit: ${res.status} ${t}`);
      }

      pollForDataAndStatus();
    } catch (err) {
      console.error(err);
      alert("Error submitting data collection. See console for details.");
    } finally {
      setIsSubmittingCollection(false);
    }
  };

  const pollForDataAndStatus = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    const singleIteration = async () => {
      try {
        const gdRes = await fetch(`${BASE_URL}/getdata/${factoryMedicineId}`);
        if (gdRes.ok) {
          const gd = await gdRes.json();
          const responseEntries =
            gd.data && Array.isArray(gd.data)
              ? gd.data
              : Array.isArray(gd)
              ? gd
              : [];

          const sortedEntries = responseEntries.sort((a, b) => b.id - a.id);

          setCollectedEntries((prevEntries) => {
            const highestPrevId =
              prevEntries.length > 0
                ? Math.max(...prevEntries.map((e) => e.id))
                : -1;

            const newEntries = sortedEntries.filter(
              (entry) => entry.id > highestPrevId
            );

            if (newEntries.length > 0) {
              return [...newEntries, ...prevEntries].slice(0, 2);
            }
            return prevEntries;
          });
        }
      } catch (e) {
        console.warn("getdata fetch failed", e);
      }

      try {
        const pRes = await fetch(`${BASE_URL}/picron/${factoryMedicineId}`);
        if (pRes.ok) {
          const pdata = await pRes.json();
          const status = pdata && (pdata.status ?? pdata.status_code ?? null);
          setCollectionStatus(status);

          if (status !== null && Number(status) === 0) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            return;
          }
        }
      } catch (e) {
        console.warn("picron status fetch failed", e);
      }
    };

    singleIteration();

    pollingRef.current = setInterval(singleIteration, 15 * 1000);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const [trainingSuccess, setTrainingSuccess] = useState(false);

  const startModelTraining = async () => {
    if (!factoryName && !factoryMedicineId) {
      alert("Factory/medicine not set. Please set them on Home page.");
      return;
    }

    setIsTraining(true);
    setTrainMessage("");
    setTrainingSuccess(false);

    try {
      const trainUrl = `${TRAIN_URL_TEMPLATE}${
        factoryMedicineId || factoryName
      }`;
      const res = await fetch(
        `https://photontroppers.onrender.com/train/${factoryMedicineId}`,
        {
          method: "POST",
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Training request failed: ${res.status} ${text}`);
      }
      const data = await res.json().catch(() => null);
      if (res.status === 200) {
        setTrainingSuccess(true);
        setTrainMessage(
          "Model training completed successfully! You can now analyze your sample in the dashboard."
        );
      } else {
        setTrainMessage("Model training started successfully.");
      }
    } catch (err) {
      console.error(err);
      setTrainMessage(`Error starting training: ${err.message || err}`);
      setTrainingSuccess(false);
    } finally {
      setIsTraining(false);
    }
  };

  const requestPredictionMode = async () => {
    if (!factoryMedicineId) {
      alert("Please set factory and medicine name on Home page first.");
      return;
    }
    setIsRequestingPrediction(true);
    setPredictions([]);
    setPredictionMessage("");
    const startTs = Date.now();
    setPredictionStartTs(startTs);

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
        factory: factoryName || "",
      };
      const res = await fetch(`${BASE_URL}/picron/${factoryMedicineId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(
          `Failed to request prediction mode: ${res.status} ${t}`
        );
      }

      setTimeout(async () => {
        try {
          const pRes = await fetch(`${BASE_URL}/predict/${factoryMedicineId}`);
          if (!pRes.ok) {
            const t = await pRes.text().catch(() => "");
            throw new Error(`Failed to fetch prediction: ${pRes.status} ${t}`);
          }
          const pred = await pRes.json();
          const arr = Array.isArray(pred) ? pred : [pred];
          const filtered = arr.filter((e) => {
            if (!startTs) return true;
            const ts =
              e.timestamp || e.time || e.created_at || e.createdAt || null;
            if (!ts) return true;
            const parsed = Date.parse(ts) || Number(ts) || null;
            return parsed && parsed >= startTs;
          });
          setPredictions(filtered);
          setPredictionMessage("Prediction fetched.");
        } catch (e) {
          console.error(e);
          setPredictionMessage(`Error fetching prediction: ${e.message || e}`);
        } finally {
          setIsRequestingPrediction(false);
        }
      }, 15 * 1000);
    } catch (err) {
      console.error(err);
      setPredictionMessage(
        `Error requesting prediction mode: ${err.message || err}`
      );
      setIsRequestingPrediction(false);
    }
  };

  const renderCollectionInputs = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { name: "taste_sweet", label: "Sweet (0-100)" },
          { name: "taste_salty", label: "Salty (0-100)" },
          { name: "taste_bitter", label: "Bitter (0-100)" },
          { name: "taste_sour", label: "Sour (0-100)" },
          { name: "taste_umami", label: "Umami (0-100)" },
          { name: "quality", label: "Quality (0-100)" },
          { name: "dilution", label: "Dilution (%)" },
        ].map((f) => (
          <div key={f.name} className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">{f.label}</label>
            <input
              type="string"
              name={f.name}
              value={collectionForm[f.name]}
              onChange={handleCollectionChange}
              className="px-3 py-2 border rounded"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-green-900">Analysis Wizard</h1>
          <p className="text-sm text-gray-700 mt-2">
            factory_medicine_id detected:{" "}
            <span className="font-medium">
              {factoryMedicineId || "not set"}
            </span>
          </p>
        </header>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-3">
            Step 1: Initialization (Shell)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Fetch a shell script for{" "}
            <span className="font-medium">
              {factoryMedicineId || "(set names on Home)"}
            </span>
            . Download it, make it executable and run.
          </p>

          <div className="flex gap-3 items-center mb-4">
            <button
              onClick={fetchShellScript}
              disabled={!factoryMedicineId || isFetchingScript}
              className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${
                factoryMedicineId && !isFetchingScript
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isFetchingScript ? "Fetching..." : "Get Init Script"}
            </button>

            {scriptText && (
              <button
                onClick={downloadScript}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                Download Script
              </button>
            )}
          </div>

          {scriptText && (
            <div className="mt-3">
              <div className="relative">
                <pre className="bg-gray-900 text-green-200 p-4 rounded-lg text-sm overflow-x-auto max-h-64 overflow-y-auto">
                  {scriptText}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(scriptText);
                    alert("Script copied to clipboard!");
                  }}
                  className="absolute top-2 right-2 text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 cursor-pointer"
                >
                  Copy
                </button>
              </div>

              <div className="mt-3 text-sm text-gray-700">
                <p>Run on your machine:</p>
                <pre className="bg-gray-100 p-3 rounded text-sm">
                  {`chmod +x ${factoryMedicineId}.sh\n./${factoryMedicineId}.sh`}
                </pre>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-3">
            Step 2: Data Collection
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Enter measurement values and submit. After submitting we will poll
            for new entries (every 15s) until the service sets status = 0.
          </p>

          <div className="mb-4">{renderCollectionInputs()}</div>

          <div className="flex items-center gap-3">
            <button
              onClick={submitCollection}
              disabled={isSubmittingCollection || !factoryMedicineId}
              className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${
                !isSubmittingCollection && factoryMedicineId
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmittingCollection
                ? "Submitting..."
                : "Submit Collection (status=1)"}
            </button>

            <span className="text-sm text-gray-600">
              {collectionStartTs
                ? `Started: ${new Date(collectionStartTs).toLocaleString()}`
                : ""}
            </span>
          </div>

          {collectionStatus === 0 && (
            <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Readings complete, no sample in enclosure. You can now
                    proceed with model training.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-medium mb-2">Latest 2 Entries</h3>
            <p className="text-xs text-gray-500 mb-2">
              Auto-updating with newest data every 15 seconds
            </p>
            <div className="bg-gray-50 p-3 rounded">
              {collectedEntries.length ? (
                <div className="space-y-4">
                  {collectedEntries.slice(0, 2).map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`${
                        index === 0
                          ? "border-l-4 border-green-500"
                          : "border-l-4 border-gray-300"
                      } pl-3 pb-2 ${index === 0 ? "bg-green-50" : ""}`}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {index === 0 ? "Newest Entry" : "Previous Entry"} (ID:{" "}
                          {entry.id})
                        </span>
                        <span className="text-gray-600">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <h4 className="text-sm font-medium">Taste Values:</h4>
                          <div className="text-sm">
                            <div>Sweet: {entry.taste_sweet}</div>
                            <div>Salty: {entry.taste_salty}</div>
                            <div>Bitter: {entry.taste_bitter}</div>
                            <div>Sour: {entry.taste_sour}</div>
                            <div>Umami: {entry.taste_umami}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Sensor Data:</h4>
                          <div className="text-sm">
                            <div>Quality: {entry.quality}</div>
                            <div>Dilution: {entry.dilution}</div>
                            <div>Temperature: {entry.temperature}°C</div>
                            <div>MQ3: {entry.mq3_ppm} ppm</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No new data yet. Waiting for entries...
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-3">Step 3: Model Training</h2>
          <p className="text-sm text-gray-600 mb-3">
            View collected data and start model training.
          </p>

          <div className="flex items-center gap-3 mb-4 flex-wrap-nowrap">
            <button
              onClick={async () => {
                try {
                  const res = await fetch(
                    `${BASE_URL}/getdata/${factoryMedicineId}`
                  );
                  if (!res.ok) {
                    throw new Error("Failed to fetch dataset");
                  }
                  const data = await res.json();
                  const allData = data.data || data;
                  setCollectedEntries(Array.isArray(allData) ? allData : []);
                } catch (error) {
                  console.error("Error fetching dataset:", error);
                  alert("Failed to fetch dataset");
                }
              }}
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            >
              Show Dataset
            </button>

            <button
              onClick={startModelTraining}
              disabled={isTraining}
              className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${
                !isTraining
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isTraining ? "Starting training..." : "Start Model Training"}
            </button>

            {trainingSuccess && (
              <a
                href="/dashboard"
                className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
            )}

            {/* <span className="text-sm text-gray-600">{trainMessage}</span> */}
            {console.log(trainMessage)}
          </div>

          {collectedEntries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sweet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bitter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Umami
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dilution
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {collectedEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.taste_sweet}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.taste_salty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.taste_bitter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.taste_sour}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.taste_umami}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.quality}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.dilution}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
