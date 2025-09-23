// src/pages/Dashboard.jsx
import React from "react";

export default function SucDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Halaman dashboard masih dalam progress</p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Placeholder 1 */}
        <div className="bg-white shadow rounded p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-2">Widget 1</h2>
          <p className="text-gray-500">On Progress</p>
        </div>

        {/* Card Placeholder 2 */}
        <div className="bg-white shadow rounded p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-2">Widget 2</h2>
          <p className="text-gray-500">On Progress</p>
        </div>

        {/* Card Placeholder 3 */}
        <div className="bg-white shadow rounded p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-2">Widget 3</h2>
          <p className="text-gray-500">On Progress</p>
        </div>
      </div>
    </div>
  );
}
