"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Analysis", href: "/analysis" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  return (
    <nav className=" top-0 left-0 w-full z-50 bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-wide select-none">
          E-Tongue Analyzer
        </h1>

        <div className="hidden md:flex space-x-10 text-md font-medium">
          {navItems.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="relative group py-1"
              onClick={() => setIsOpen(false)}
            >
              <span className="hover:text-green-200 transition-colors duration-300">
                {label}
              </span>
              <span
                className="absolute left-0 -bottom-1 w-0 h-0.5 bg-green-200 transition-all duration-300 group-hover:w-full"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 space-y-1.5 focus:outline-none"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          type="button"
        >
          <span className="block h-0.5 w-full bg-white rounded" />
          <span className="block h-0.5 w-full bg-white rounded" />
          <span className="block h-0.5 w-full bg-white rounded" />
        </button>
      </div>

      <div
        className={`md:hidden bg-gradient-to-r from-green-600 to-green-700 overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          isOpen ? "max-h-60" : "max-h-0"
        }`}
      >
        <div className="flex flex-col px-6 py-4 space-y-4 font-medium text-white">
          {navItems.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="hover:text-green-200"
              onClick={() => setIsOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
