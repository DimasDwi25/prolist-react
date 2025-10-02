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
import BoqModal from "../../components/modal/BoqModal";
import Swal from "sweetalert2";

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

  const [openBoq, setOpenBoq] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phcCreated, setPhcCreated] = useState(false);

  const [documents, setDocuments] = useState([]);

  // State form
  const [formData, setFormData] = useState({
    handover_date: "",
    start_date: "",
    target_finish_date: "",
    client_pic_name: "",
    client_mobile: "",
    client_reps_office_address: "",
    client_site_address: "",
    client_site_representatives: "",
    site_phone_number: "",
    ho_marketings_id: "",
    pic_marketing_id: "",
    ho_engineering_id: "",
    pic_engineering_id: "",
    notes: "",
    costing_by_marketing: "NA",
    boq: "NA",
    retention: "NA",
    warranty: "NA",
    penalty: "NA",
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

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await api.get("/document-phc");
        console.log("Documents fetched:", res.data);

        setDocuments(
          res.data.map((doc) => ({
            id: doc.id,
            name: doc.name,
          }))
        );
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };
    fetchDocuments();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // const normalizeDate = (dateStr) => {
  //   if (!dateStr) return null;
  //   const d = new Date(dateStr);
  //   return d.toISOString().split("T")[0]; // ambil hanya tanggal (UTC)
  // };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting || phcCreated) return; // prevent double submit
    try {
      setSubmitting(true);
      console.log("📤 Data PHC dikirim:", formData);

      const res = await api.post("/phc", {
        ...formData,
        project_id: project?.pn_number,
        handover_date: formData.handover_date, // kirim langsung
        start_date: formData.start_date,
        target_finish_date: formData.target_finish_date,
      });

      if (res.data.status === "success") {
        setPhcCreated(true);

        // tampilkan success alert
        await Swal.fire({
          icon: "success",
          title: "PHC Berhasil Disimpan",
          text: "Data PHC telah berhasil dibuat.",
          confirmButtonText: "OK",
        });

        // close BOQ modal otomatis setelah PHC dibuat
        setOpenBoq(false);
        setSubmitting(false);

        // Redirect ke detail project
        navigate(`/projects/${project?.pn_number}`, {
          state: { project },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan PHC",
          text: res.data.message || "Terjadi kesalahan saat menyimpan PHC",
        });
        setSubmitting(false);
      }
    } catch (err) {
      console.error("❌ Error submit PHC:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message || "Terjadi error jaringan atau server",
      });
      setSubmitting(false);
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
      <div className="mb-4">
        <button
          type="button"
          onClick={() =>
            navigate(`/projects/${project?.pn_number}`, { state: { project } })
          }
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
        >
          ⬅️ Back to Project
        </button>
      </div>
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
          onClick={() => setStep(3)}
          className={`px-4 py-2 rounded-md font-medium transition w-full md:w-40 text-sm md:text-base ${
            step === 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
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
                {/* 🔹 Project info → read-only */}
                <TextField
                  label="Project"
                  value={project?.project_name || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="PN Number"
                  value={project?.project_number || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Quotation Number"
                  value={project?.quotation?.no_quotation || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Quotation Date"
                  value={formatDate(project?.quotation?.quotation_date || "")}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="PO Number"
                  value={project?.po_number || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="PO Date"
                  value={formatDate(project?.po_date || "")}
                  fullWidth
                  InputProps={{ readOnly: true }}
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
                      value={formData.client_site_representatives}
                      onChange={(e) =>
                        handleChange(
                          "client_site_representatives",
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
                    type: "radio",
                  },
                  {
                    key: "boq",
                    label: "Bill of Quantity (BOQ)",
                    type: "radio",
                  },
                  { key: "retention", label: "Retention", type: "text" },
                  { key: "warranty", label: "Warranty", type: "text" },
                  { key: "penalty", label: "Penalty", type: "text" },
                ].map(({ key, label, type }) => (
                  <div
                    key={key}
                    className="p-4 border rounded-md bg-gray-50 space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      {label}
                    </label>

                    {/* 🔹 Kalau type radio (boq & costing_by_marketing) */}
                    {type === "radio" ? (
                      <>
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

                        {/* 🔹 BOQ: tombol create/edit hanya kalau Applicable */}
                        {key === "boq" && formData[key] === "A" && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setOpenBoq(true)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
                            >
                              ➕ Create / Edit BOQ
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* 🔹 Retention, Warranty, Penalty pakai radio dulu */}
                        <div className="flex items-center gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={key}
                              value="A"
                              checked={formData[key] !== "NA"}
                              onChange={() => handleChange(key, "")} // kosongkan supaya bisa isi text
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

                        {/* Kalau Applicable, tampilkan input text */}
                        {formData[key] !== "NA" && (
                          <TextField
                            placeholder={`${label} Detail`}
                            value={formData[key] || ""}
                            onChange={(e) =>
                              handleChange(
                                key,
                                e.target.value.trim() === ""
                                  ? "NA"
                                  : e.target.value
                              )
                            }
                            fullWidth
                          />
                        )}
                      </>
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
                  disabled={submitting || phcCreated}
                  className={`bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded ${
                    submitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {submitting ? "💾 Saving..." : "💾 Save PHC"}
                </button>
              </div>
            </div>
          )}

          {/* ---------------- STEP 3 ---------------- */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                📄 Step 3: Document Preparation
              </h3>

              {documents.length === 0 ? (
                <div className="flex justify-center items-center h-40 text-gray-500">
                  Loading documents...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 border rounded-md bg-white space-y-2 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">
                          {doc.name}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            doc.status === "A"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {doc.status === "A" ? "Applicable" : "Not Applicable"}
                        </span>
                      </div>
                      {doc.date_prepared && (
                        <div className="text-sm text-gray-500">
                          Prepared Date: {doc.date_prepared}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-8">
                <Button variant="outlined" onClick={() => setStep(2)}>
                  Back: Checklist
                </Button>
              </div>
            </div>
          )}
        </form>
      )}
      {/* 🔹 Modal BOQ (inline edit dengan DataGrid) */}
      <BoqModal
        open={openBoq}
        handleClose={() => setOpenBoq(false)}
        projectId={project?.pn_number}
        projectValue={project?.po_value}
      />
    </div>
  );
}
