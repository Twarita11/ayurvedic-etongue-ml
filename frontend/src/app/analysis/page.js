"use client";

import { useEffect, useRef, useState } from "react";

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
          const entries = Array.isArray(gd) ? gd : [gd];
          const filtered = entries.filter((e) => {
            if (!collectionStartTs) return true;
            const ts =
              e.timestamp || e.time || e.created_at || e.createdAt || null;
            if (!ts) return true;
            const parsed = Date.parse(ts) || Number(ts) || null;
            return parsed && parsed >= collectionStartTs;
          });
          if (filtered.length) {
            setCollectedEntries((prev) => [...prev, ...filtered]);
          }
        }
      } catch (e) {
        console.warn("getdata fetch failed", e);
      }

      try {
        const pRes = await fetch(`${BASE_URL}/picron/${factoryMedicineId}`);
        if (pRes.ok) {
          const pdata = await pRes.json();
          const status = pdata && (pdata.status ?? pdata.status_code ?? null);
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

  const handleCsvSelect = (e) => {
    const f = e.target.files[0];
    setCsvFile(f);
  };

  const startModelTraining = async () => {
    if (!factoryName && !factoryMedicineId) {
      alert("Factory/medicine not set. Please set them on Home page.");
      return;
    }
    if (!csvFile) {
      alert("Please upload a CSV file first.");
      return;
    }

    setIsTraining(true);
    setTrainMessage("");

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
      setTrainMessage("Model training started successfully.");
    } catch (err) {
      console.error(err);
      setTrainMessage(`Error starting training: ${err.message || err}`);
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
          { name: "taste_sweet", label: "Sweet" },
          { name: "taste_salty", label: "Salty" },
          { name: "taste_bitter", label: "Bitter" },
          { name: "taste_sour", label: "Sour" },
          { name: "taste_umami", label: "Umami" },
          { name: "quality", label: "Quality" },
          { name: "dilution", label: "Dilution" },
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
              className={`px-4 py-2 rounded-lg font-medium ${
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
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
                  className="absolute top-2 right-2 text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600"
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
              className={`px-4 py-2 rounded-lg font-medium ${
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

          <div className="mt-4">
            <h3 className="font-medium mb-2">Recent Data (since submit)</h3>
            <div className="bg-gray-50 p-3 rounded">
              {collectedEntries.length ? (
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(collectedEntries, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">No data yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-3">
            Step 3: Model Training (on CSV)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Upload CSV of collected data and start training.
          </p>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleCsvSelect(e)}
            className="mb-3 p-2 border border-gray-400 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={startModelTraining}
              disabled={!csvFile || isTraining}
              className={`px-4 py-2 rounded-lg font-medium ${
                csvFile && !isTraining
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isTraining ? "Starting training..." : "Start Model Training"}
            </button>

            <span className="text-sm text-gray-600">{trainMessage}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
