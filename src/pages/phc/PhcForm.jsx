import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import api from "../../api/api";
import { useLocation, useNavigate } from "react-router-dom";

export default function CreatePhcPage() {
  const navigate = useNavigate();
  // 🔹 Mulai default Step 1
  const [step, setStep] = useState(1);

  // State users
  const [marketingUsers, setMarketingUsers] = useState([]);
  const [engineeringUsers, setEngineeringUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const { state } = useLocation();
  const project = state?.project;

  // State form
  const [formData, setFormData] = useState({
    handover_date: "",
    start_date: "",
    target_finish_date: "",
    client_pic_name: "",
    client_mobile: "",
    client_reps_office_address: "",
    client_site_address: "",
    client_site_representative: "",
    site_phone_number: "",
    ho_marketings_id: "",
    pic_marketing_id: "",
    ho_engineering_id: "",
    pic_engineering_id: "",
    notes: "",
    costing_by_marketing: "NA",
    boq: "NA",
    retention: "NA",
    retention_detail: "",
    warranty: "NA",
    warranty_detail: "",
    penalty: "NA",
    penalty_detail: "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const [marketingRes, engineeringRes] = await Promise.all([
          api.get("/phc/users/marketing"),
          api.get("/phc/users/engineering"),
        ]);
        if (marketingRes.data.success)
          setMarketingUsers(marketingRes.data.data);
        if (engineeringRes.data.success)
          setEngineeringUsers(engineeringRes.data.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log("Project dari state:", project);
  }, [project]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("📤 Data PHC dikirim:", formData);

      const res = await api.post("/phc", {
        ...formData,
        project_id: project?.pn_number, // pakai PN number sebagai PK
      });

      if (res.data.status === "success") {
        alert("✅ PHC berhasil disimpan");
        console.log("PHC data:", res.data.phc);
        console.log("Approvers:", res.data.approvers);

        // ⬅️ redirect ke detail project setelah sukses
        navigate(`/projects/${project?.pn_number}`, {
          state: { project }, // kalau mau bawa state project sekalian
        });
      } else {
        alert("⚠️ Gagal menyimpan PHC");
        console.log("Respon gagal:", res.data);
      }
    } catch (err) {
      console.error("❌ Error submit PHC:", err);

      if (err.response) {
        console.error("📩 Response error:", err.response.data);
        alert(
          `Error ${err.response.status}: ${
            err.response.data.message || "Gagal menyimpan PHC"
          }`
        );
      } else {
        alert("Terjadi error jaringan atau server");
      }
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "-"; // cek valid date

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-8 text-center">
        ➕ Create Project Handover Checklist (PHC)
      </h2>

      {/* Step Indicator */}
      <div className="mb-6 text-center text-gray-600 font-medium text-sm md:text-base">
        {step === 1 && (
          <span>
            🔹 <strong>Step 1 of 3:</strong> General Information
          </span>
        )}
        {step === 2 && (
          <span>
            📋 <strong>Step 2 of 3:</strong> Handover Checklist
          </span>
        )}
        {step === 3 && (
          <span>
            📄 <strong>Step 3 of 3:</strong> Document Preparation
          </span>
        )}
      </div>

      {/* Step Tabs */}
      <div className="flex flex-col md:flex-row justify-center mb-6 gap-3 md:space-x-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`px-4 py-2 rounded-md font-medium transition w-full md:w-40 text-sm md:text-base ${
            step === 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          1️⃣ Information
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`px-4 py-2 rounded-md font-medium transition w-full md:w-40 text-sm md:text-base ${
            step === 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          2️⃣ Checklist
        </button>
        <button
          type="button"
          disabled
          className="px-4 py-2 rounded-md w-full md:w-40 text-sm md:text-base 
                       bg-gray-100 text-gray-400 cursor-not-allowed"
        >
          3️⃣ Documents
        </button>
      </div>

      {/* ---------------- LOADING ---------------- */}
      {loadingUsers ? (
        <div className="flex justify-center items-center h-40">
          <CircularProgress />
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          {/* ---------------- STEP 1 ---------------- */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Info */}
                <TextField
                  label="Project"
                  value={project?.project_name || ""}
                  fullWidth
                  disabled
                />
                <TextField
                  label="PN Number"
                  value={project?.project_number || ""}
                  fullWidth
                  disabled
                />
                <TextField
                  label="Quotation Number"
                  value={project?.quotation?.no_quotation || ""}
                  fullWidth
                  disabled
                />
                <TextField
                  label="PN Number"
                  value={formatDate(project?.quotation?.quotation_date || "")}
                  fullWidth
                  disabled
                />

                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Dates */}
                    <TextField
                      type="date"
                      label="Handover Date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.handover_date}
                      onChange={(e) =>
                        handleChange("handover_date", e.target.value)
                      }
                      fullWidth
                    />
                    <TextField
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.start_date}
                      onChange={(e) =>
                        handleChange("start_date", e.target.value)
                      }
                      fullWidth
                    />
                    <TextField
                      type="date"
                      label="Target Finish Date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.target_finish_date}
                      onChange={(e) =>
                        handleChange("target_finish_date", e.target.value)
                      }
                      fullWidth
                    />
                  </div>
                </div>

                {/* Client Info */}
                <TextField
                  label="Client PIC Name"
                  value={formData.client_pic_name}
                  onChange={(e) =>
                    handleChange("client_pic_name", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Client Mobile"
                  value={formData.client_mobile}
                  onChange={(e) =>
                    handleChange("client_mobile", e.target.value)
                  }
                  fullWidth
                />

                <div className="md:col-span-2">
                  <TextField
                    label="Client Office Address"
                    multiline
                    rows={2}
                    value={formData.client_reps_office_address}
                    onChange={(e) =>
                      handleChange("client_reps_office_address", e.target.value)
                    }
                    fullWidth
                  />
                </div>

                {/* Client Site Info - 3 columns */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      label="Client Site Address"
                      value={formData.client_site_address}
                      onChange={(e) =>
                        handleChange("client_site_address", e.target.value)
                      }
                      fullWidth
                    />
                    <TextField
                      label="Client Representative"
                      value={formData.client_site_representative}
                      onChange={(e) =>
                        handleChange(
                          "client_site_representative",
                          e.target.value
                        )
                      }
                      fullWidth
                    />
                    <TextField
                      label="Site Phone Number"
                      value={formData.site_phone_number}
                      onChange={(e) =>
                        handleChange("site_phone_number", e.target.value)
                      }
                      fullWidth
                    />
                  </div>
                </div>

                {/* Marketing */}
                <Autocomplete
                  options={marketingUsers}
                  getOptionLabel={(option) => option.name || ""}
                  onChange={(e, value) =>
                    handleChange("ho_marketings_id", value?.id || "")
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="HO Marketing" fullWidth />
                  )}
                />
                <Autocomplete
                  options={marketingUsers}
                  getOptionLabel={(option) => option.name || ""}
                  onChange={(e, value) =>
                    handleChange("pic_marketing_id", value?.id || "")
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="PIC Marketing" fullWidth />
                  )}
                />

                {/* Engineering */}
                <Autocomplete
                  options={engineeringUsers}
                  getOptionLabel={(option) => option.name || ""}
                  onChange={(e, value) =>
                    handleChange("ho_engineering_id", value?.id || "")
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="HO Engineering" fullWidth />
                  )}
                />
                <Autocomplete
                  options={engineeringUsers}
                  getOptionLabel={(option) => option.name || ""}
                  onChange={(e, value) =>
                    handleChange("pic_engineering_id", value?.id || "")
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="PIC Engineering" fullWidth />
                  )}
                />

                {/* Notes */}
                <div className="md:col-span-2">
                  <TextField
                    label="Notes"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    fullWidth
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
                >
                  ⏭️ Next: Checklist
                </button>
              </div>
            </div>
          )}

          {/* ---------------- STEP 2 ---------------- */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                📋 Step 2: Handover Checklist
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: "costing_by_marketing",
                    label: "Costing by Marketing",
                  },
                  { key: "boq", label: "Bill of Quantity (BOQ)" },
                  { key: "retention", label: "Retention", hasDetail: true },
                  { key: "warranty", label: "Warranty", hasDetail: true },
                  { key: "penalty", label: "Penalty", hasDetail: true },
                ].map(({ key, label, hasDetail }) => (
                  <div
                    key={key}
                    className="p-4 border rounded-md bg-gray-50 space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      {label}
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={key}
                          value="A"
                          checked={formData[key] === "A"}
                          onChange={() => handleChange(key, "A")}
                          className="text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">Applicable</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={key}
                          value="NA"
                          checked={formData[key] === "NA"}
                          onChange={() => handleChange(key, "NA")}
                          className="text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">Not Applicable</span>
                      </label>
                    </div>
                    {hasDetail && formData[key] === "A" && (
                      <TextField
                        placeholder={`${label} Detail`}
                        value={formData[`${key}_detail`]}
                        onChange={(e) =>
                          handleChange(`${key}_detail`, e.target.value)
                        }
                        fullWidth
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2 border rounded text-sm md:text-base"
                >
                  ⬅️ Back
                </button>

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
                >
                  💾 Save PHC
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
