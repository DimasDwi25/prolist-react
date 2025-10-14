import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { clearAuth } from "../../utils/storage";

export default function CreateStatusProjectModal({
  open,
  onClose,
  onStatusCreated,
}) {
  const initialForm = { name: "" };

  const [formValues, setFormValues] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormValues(initialForm);
      setErrors({});
      setLoading(false);
    }
  }, [open]);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSave = async () => {
    const validationErrors = {};
    if (!formValues.name.trim()) validationErrors.name = "Name is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/status-projects", formValues);

      if (onStatusCreated) {
        onStatusCreated(res.data.data);
      }
      handleClose();
    } catch (err) {
      console.error(err.response || err);
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        clearAuth();
        window.location.href = "/login";
      } else {
        alert("Failed to create status. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormValues(initialForm);
    setErrors({});
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Add New Status
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-600 mb-4 text-sm">
            Fill out the following information to add a new project status.
          </p>
          <div className="grid gap-4">
            {/* Name */}
            <div className="flex flex-col">
              <label
                htmlFor="name"
                className="mb-1 text-sm font-medium text-gray-700"
              >
                Status Name
              </label>
              <input
                id="name"
                type="text"
                value={formValues.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter status name"
                className={`border rounded-lg p-2 text-sm focus:ring-2 focus:outline-none ${
                  errors.name
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
              />
              {errors.name && (
                <span className="text-xs text-red-500 mt-1">{errors.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            {loading ? "Saving..." : "Save Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
