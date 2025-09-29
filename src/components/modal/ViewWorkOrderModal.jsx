import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import api from "../../api/api";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, "0")}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${date.getFullYear()}`;
};

const display = (value) =>
  value !== undefined && value !== null && value !== "" ? value : "—";

export default function ViewWorkOrderModal({ open, onClose, workOrderId }) {
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch work order detail ketika modal dibuka
  useEffect(() => {
    if (!open || !workOrderId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/work-order/detail/${workOrderId}`);
        console.log(res.data.data);
        setWorkOrder(res.data.data); // pastikan sesuai struktur API kamu
      } catch (err) {
        console.error("Error fetching work order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, workOrderId]);

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/work-orders/${workOrder.id}/pdf`, {
        responseType: "blob",
      });

      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", `Work-Order-${workOrder.wo_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className="font-bold text-gray-800 text-xl">
        📄 Work Order Detail
      </DialogTitle>

      <DialogContent dividers>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Work Order No */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Work Order No
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {display(workOrder?.wo_kode_no)}
            </p>
          </div>

          {/* Project No */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project Number
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {display(workOrder?.project?.project_number)}
            </p>
          </div>

          {/* Client */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {display(
                workOrder?.project?.client?.name ||
                  workOrder?.project?.quotation?.client?.name
              )}
            </p>
          </div>

          {/* Project Name */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project Name
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {display(workOrder?.project?.project_name)}
            </p>
          </div>

          {/* Purpose */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Start Working
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDate(workOrder?.start_working_date)}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              End Working
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDate(workOrder?.end_working_date)}
            </p>
          </div>

          {/* PICs */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm lg:col-span-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              PICs
            </h3>
            {workOrder?.pics?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrder.pics.map((pic, idx) => (
                      <tr
                        key={pic.id}
                        className={`${
                          idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-indigo-50 transition-colors`}
                      >
                        <td className="px-4 py-2">{pic.user.name}</td>
                        <td className="px-4 py-2">{pic.role.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-500">—</p>
            )}
          </div>

          {/* Descriptions */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm lg:col-span-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              Descriptions
            </h3>
            {workOrder?.descriptions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="px-4 py-2 text-left font-medium">
                        Description
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrder.descriptions.map((desc, idx) => (
                      <tr
                        key={desc.id}
                        className={`${
                          idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-indigo-50 transition-colors`}
                      >
                        <td className="px-4 py-2">
                          {display(desc.description)}
                        </td>
                        <td className="px-4 py-2">{display(desc.result)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-500">—</p>
            )}
          </div>
        </div>
        {/* Approval */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm w-full lg:col-span-2 mt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-6">Approval</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center w-full">
            {/* Requested by */}
            <div className="flex flex-col items-center w-full">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-16">
                Requested by
              </p>
              <div className="w-full border-t border-gray-300 pt-2">
                <p className="text-sm font-medium text-gray-900">
                  {display(workOrder?.creator?.name)}
                </p>
              </div>
            </div>

            {/* Approved by */}
            <div className="flex flex-col items-center w-full">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-16">
                Approved by
              </p>
              <div className="w-full border-t border-gray-300 pt-2">
                <p className="text-sm font-medium text-gray-900">
                  {display(workOrder?.approved_by?.name)}
                </p>
              </div>
            </div>

            {/* Accepted by */}
            <div className="flex flex-col items-center w-full">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-16">
                Accepted by
              </p>
              <div className="w-full border-t border-gray-300 pt-2">
                <p className="text-sm font-medium text-gray-900">
                  {display(workOrder?.accepted_by?.name)}
                </p>
              </div>
            </div>

            {/* Client Approve */}
            <div className="flex flex-col items-center w-full">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-16">
                Client Approve
              </p>
              <div className="w-full border-t border-gray-300 pt-2">
                <p className="text-sm font-medium text-gray-900">
                  {display(workOrder?.client_approve?.name)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close
        </Button>
        <Button onClick={handleDownloadPdf} variant="contained" color="primary">
          Print / Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
