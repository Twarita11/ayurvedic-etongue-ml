"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [factoryName, setFactoryName] = useState("");
  const [medicineName, setMedicineName] = useState("");

  useEffect(() => {
    const savedFactoryName = localStorage.getItem("factoryName");
    if (savedFactoryName) setFactoryName(savedFactoryName);

    const savedMedicineName = localStorage.getItem("medicineName");
    if (savedMedicineName) setMedicineName(savedMedicineName);
  }, []);

  useEffect(() => {
    if (factoryName) localStorage.setItem("factoryName", factoryName);
  }, [factoryName]);

  useEffect(() => {
    if (medicineName) localStorage.setItem("medicineName", medicineName);
  }, [medicineName]);

  return (
    <div className="min-h-screen pt-16 px-6 bg-green-50 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-extrabold leading-tight text-green-900 mb-6 font-playfair">
            Herbal Quality Analyzer
          </h1>
          <p className="text-lg md:text-xl text-green-800 leading-relaxed mb-6 font-montserrat">
            Use AI-powered e-tongue sensors to analyze taste, dilution and
            quality of herbal products with confidence and precision.
          </p>

          <div className="mb-6 space-y-4">
            <input
              type="text"
              placeholder="Enter Factory Name"
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />

            <input
              type="text"
              placeholder="Enter Medicine Name"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <Link
            href="/analysis"
            className={`inline-block px-8 py-4 rounded-full font-normal text-lg shadow-lg transition-all duration-300 ${
              factoryName && medicineName
                ? "bg-green-700 hover:bg-green-800 text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            onClick={(e) => {
              if (!factoryName || !medicineName) e.preventDefault();
            }}
          >
            Start Your Analysis
          </Link>
        </div>

        <div className="flex justify-center">
          <Image
            src="/herb-illustration2.png"
            alt="Herbal Leaf Illustration"
            width={500}
            height={500}
            className="max-w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
