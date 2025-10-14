import React, { useState, useEffect } from "react";
import api from "../../../api/api"; // Axios instance yang sudah include JWT
import { clearAuth } from "../../../utils/storage";

export default function CreateClientModal({ open, onClose, onClientCreated }) {
  const initialForm = {
    name: "",
    address: "",
    phone: "",
    client_representative: "",
    city: "",
    province: "",
    country: "",
    zip_code: "",
    web: "",
    notes: "",
  };

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
    // Simple validation
    const validationErrors = {};
    if (!formValues.name.trim()) validationErrors.name = "Name is required";
    if (!formValues.phone.trim()) validationErrors.phone = "Phone is required";
    if (!formValues.client_representative.trim())
      validationErrors.client_representative = "Representative is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/clients", formValues); // axios instance sudah include JWT
      if (onClientCreated) onClientCreated(res.data);
      handleClose();
    } catch (err) {
      console.error(err.response || err);
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else if (err.response?.status === 401) {
        alert(
          err.response.data?.message || "Session expired. Please login again."
        );
        clearAuth();
        window.location.href = "/login";
      } else {
        alert("Failed to create client. Please try again.");
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

  const fields = [
    { name: "name", label: "Client Name", placeholder: "Enter client name" },
    {
      name: "client_representative",
      label: "Representative",
      placeholder: "Contact person",
    },
    {
      name: "phone",
      label: "Phone Number",
      placeholder: "e.g. +62 812-3456-7890",
    },
    { name: "web", label: "Website", placeholder: "https://example.com" },
    {
      name: "address",
      label: "Street Address",
      placeholder: "Street name, No.",
    },
    { name: "city", label: "City", placeholder: "Enter city" },
    {
      name: "province",
      label: "Province",
      placeholder: "Enter province/state",
    },
    { name: "country", label: "Country", placeholder: "Enter country" },
    { name: "zip_code", label: "ZIP Code", placeholder: "Postal code" },
    {
      name: "notes",
      label: "Additional Notes",
      placeholder: "Optional details",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Add New Client
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <p className="text-gray-600 mb-4 text-sm">
            Fill out the following information to add a new client.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className="flex flex-col">
                <label
                  htmlFor={field.name}
                  className="mb-1 text-sm font-medium text-gray-700"
                >
                  {field.label}
                </label>
                {field.name === "notes" ? (
                  <textarea
                    id={field.name}
                    rows="3"
                    value={formValues[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`border rounded-lg p-2 text-sm focus:ring-2 focus:outline-none ${
                      errors[field.name]
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-blue-500"
                    }`}
                  />
                ) : (
                  <input
                    id={field.name}
                    type="text"
                    value={formValues[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`border rounded-lg p-2 text-sm focus:ring-2 focus:outline-none ${
                      errors[field.name]
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-blue-500"
                    }`}
                  />
                )}
                {errors[field.name] && (
                  <span className="text-xs text-red-500 mt-1">
                    {errors[field.name]}
                  </span>
                )}
              </div>
            ))}
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
            {loading ? "Saving..." : "Save Client"}
          </button>
        </div>
      </div>
    </div>
  );
}
