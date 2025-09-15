import React, { useState } from "react";

export default function DashboardCard({ title, value, color, mask = false }) {
  const [show, setShow] = useState(!mask);

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 p-3 rounded-full bg-${color}-100`}>
          {/* Bisa diganti icon SVG sesuai kebutuhan */}
          <svg
            className={`w-6 h-6 text-${color}-600`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <h2 className="text-lg font-semibold text-gray-800">
            {mask ? (show ? `Rp ${value}` : "••••") : value}
          </h2>
        </div>
      </div>

      {mask && (
        <button
          onClick={() => setShow(!show)}
          className={`mt-3 text-xs font-medium text-gray-400 hover:text-${color}-600 focus:outline-none`}
        >
          Toggle
        </button>
      )}
    </div>
  );
}
