import React, { useState, useEffect } from "react";
import api from "../../api/api";
import ViewMrOutstandingModal from "../../components/modal/ViewMrOutstandingModal";
import ViewMrOverdueModal from "../../components/modal/ViewMrOverdueModal";
import ViewPlOutstandingModal from "../../components/modal/ViewPlOutstandingModal";

export default function SucDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMrOutstandingModal, setOpenMrOutstandingModal] = useState(false);
  const [openMrOverdueModal, setOpenMrOverdueModal] = useState(false);
  const [openPlOutstandingModal, setOpenPlOutstandingModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/suc/dashboard`);
      setData(response.data.data);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SUC Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of Material Requests and Packing Lists
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* MR Outstanding */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  MR Outstanding
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.mr_outstanding?.count || 0}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpenMrOutstandingModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View
            </button>
          </div>
        </div>

        {/* MR Overdue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">MR Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.mr_overdue?.count || 0}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpenMrOverdueModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              View
            </button>
          </div>
        </div>

        {/* PL Outstanding */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  PL Outstanding
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.pl_outstanding?.count || 0}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpenPlOutstandingModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              View
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewMrOutstandingModal
        open={openMrOutstandingModal}
        onClose={() => setOpenMrOutstandingModal(false)}
        data={data?.mr_outstanding?.list || []}
      />
      <ViewMrOverdueModal
        open={openMrOverdueModal}
        onClose={() => setOpenMrOverdueModal(false)}
        data={data?.mr_overdue?.list || []}
      />
      <ViewPlOutstandingModal
        open={openPlOutstandingModal}
        onClose={() => setOpenPlOutstandingModal(false)}
        data={data?.pl_outstanding?.list || []}
        availableTypes={data?.pl_outstanding?.available_types || []}
      />
    </div>
  );
}
