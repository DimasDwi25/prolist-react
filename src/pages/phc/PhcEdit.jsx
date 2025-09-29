import { useState, useEffect } from "react";
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Button,
} from "@mui/material";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BoqModal from "../../components/modal/BoqModal";

export default function PhcEdit() {
  const { projectId } = useParams();

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phc, setPhc] = useState(null);
  const [marketingUsers, setMarketingUsers] = useState([]);
  const [engineeringUsers, setEngineeringUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [openBoq, setOpenBoq] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [documents, setDocuments] = useState([]);

  // 🔹 Form state
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
    retention_detail: "",
    warranty: "NA",
    warranty_detail: "",
    penalty: "NA",
    penalty_detail: "",
  });

  // 🔹 Fetch users
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

  // 🔹 Fetch existing PHC untuk edit
  useEffect(() => {
    const fetchPhc = async () => {
      try {
        const res = await api.get(`/phc/${projectId}`);
        console.log("🔍 Fetch PHC:", res.data);

        if (res.data.success && res.data.data) {
          const phc = res.data.data;
          setPhc(phc);

          setFormData((prev) => ({
            ...prev,
            handover_date: normalizeApiDate(phc.handover_date),
            start_date: normalizeApiDate(phc.start_date),
            target_finish_date: normalizeApiDate(phc.target_finish_date),
            client_pic_name: phc.client_pic_name || "",
            client_mobile: phc.client_mobile || "",
            client_reps_office_address: phc.client_reps_office_address || "",
            client_site_address: phc.client_site_address || "",
            client_site_representatives: phc.client_site_representatives || "",
            site_phone_number: phc.site_phone_number || "",
            ho_marketings_id: phc.ho_marketing?.id || "",
            pic_marketing_id: phc.pic_marketing?.id || "",
            ho_engineering_id: phc.ho_engineering?.id || "",
            pic_engineering_id: phc.pic_engineering?.id || "",
            notes: phc.notes || "",
            costing_by_marketing: normalizeValue(phc.costing_by_marketing),
            boq: normalizeValue(phc.boq),
            retention: normalizeValue(phc.retention),
            warranty: normalizeValue(phc.warranty),
            penalty: normalizeValue(phc.penalty),
          }));
        }
      } catch (err) {
        console.error("❌ Error fetch PHC:", err);
      }
    };
    if (projectId) fetchPhc();
  }, [projectId]);

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
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  // 🔹 Submit Update
  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      console.log("📤 Update PHC:", formData);

      const res = await api.put(`/phc/${projectId}`, formData);

      if (res.data.success) {
        await Swal.fire({
          icon: "success",
          title: "PHC Updated",
          text: "Data PHC berhasil diperbarui",
          confirmButtonText: "OK",
        });

        navigate(`/projects/${phc?.project?.pn_number}`);
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Update PHC",
          text: res.data.message || "Terjadi kesalahan saat update",
        });
      }
    } catch (err) {
      console.error("❌ Error update PHC:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message || "Terjadi error jaringan atau server",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "";

    // kalau sudah "YYYY-MM-DD" → langsung kembalikan
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const normalizeValue = (val) => {
    if (val === "0") return "NA";
    if (val === "1") return "A"; // kalau backend nanti pakai 1
    return val; // biarin kalau sudah "A" / "NA"
  };

  const normalizeApiDate = (value) => {
    if (!value) return "";
    return value.toString().substring(0, 10); // hasil: YYYY-MM-DD
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate(`/projects/${phc?.project?.pn_number}`)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
        >
          ⬅️ Back to Project
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-8 text-center">
        ✏️ Edit Project Handover Checklist (PHC)
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
          className={`px-4 py-2 rounded-md w-full md:w-40 text-sm md:text-base ${
            step === 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setStep(1)}
        >
          1️⃣ Information
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-md w-full md:w-40 text-sm md:text-base ${
            step === 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setStep(2)}
        >
          2️⃣ Checklist
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-md w-full md:w-40 text-sm md:text-base ${
            step === 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setStep(3)}
        >
          3️⃣ Documents
        </button>
      </div>

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
                  value={phc?.project?.project_name || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="PN Number"
                  value={phc?.project?.project_number || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Quotation Number"
                  value={phc?.project?.quotation?.no_quotation || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Quotation Date"
                  value={formatDate(
                    phc?.project?.quotation?.quotation_date || ""
                  )}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="PO Number"
                  value={phc?.project?.po_number || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="PO Date"
                  value={formatDate(phc?.project?.po_date || "")}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                {/* 🔹 Dates (editable) */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {/* 🔹 Client info (editable) */}
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

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {/* 🔹 HO Marketing */}
                <Autocomplete
                  options={marketingUsers}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    marketingUsers.find(
                      (u) => u.id === formData.ho_marketings_id
                    ) || null
                  }
                  onChange={(e, newValue) =>
                    handleChange("ho_marketings_id", newValue?.id || "")
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="HO Marketing" fullWidth />
                  )}
                />

                {/* 🔹 PIC Marketing */}
                <Autocomplete
                  options={marketingUsers}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    marketingUsers.find(
                      (u) => u.id === formData.pic_marketing_id
                    ) || null
                  }
                  onChange={(e, newValue) =>
                    handleChange("pic_marketing_id", newValue?.id || "")
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="PIC Marketing" fullWidth />
                  )}
                />

                {/* 🔹 HO Engineering */}
                <Autocomplete
                  options={engineeringUsers}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    engineeringUsers.find(
                      (u) => u.id === formData.ho_engineering_id
                    ) || null
                  }
                  onChange={(e, newValue) =>
                    handleChange("ho_engineering_id", newValue?.id || "")
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="HO Engineering" fullWidth />
                  )}
                />

                {/* 🔹 PIC Engineering */}
                <Autocomplete
                  options={engineeringUsers}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    engineeringUsers.find(
                      (u) => u.id === formData.pic_engineering_id
                    ) || null
                  }
                  onChange={(e, newValue) =>
                    handleChange("pic_engineering_id", newValue?.id || "")
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="PIC Engineering" fullWidth />
                  )}
                />

                {/* 🔹 Notes */}
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

              {/* 🔹 Navigation */}
              <div className="flex justify-between mt-8">
                <Button variant="outlined" onClick={() => navigate(-1)}>
                  Back
                </Button>
                <Button variant="contained" onClick={() => setStep(2)}>
                  Next: Checklist
                </Button>
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
                  {
                    key: "boq",
                    label: "Bill of Quantity (BOQ)",
                    hasDetail: true,
                  },
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

                    {/* Radio A / NA */}
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

                    {/* Kalau applicable → detail field */}
                    {hasDetail && formData[key] === "A" && key !== "boq" && (
                      <TextField
                        placeholder={`${label} Detail`}
                        value={formData[`${key}_detail`] || ""}
                        onChange={(e) =>
                          handleChange(`${key}_detail`, e.target.value)
                        }
                        fullWidth
                      />
                    )}

                    {/* Kalau BOQ applicable → tombol modal */}
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
                  </div>
                ))}
              </div>

              {/* Navigasi */}
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
                  disabled={submitting}
                  className={`bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded ${
                    submitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {submitting ? "💾 Updating..." : "💾 Update PHC"}
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

      {/* 🔹 Modal BOQ */}
      <BoqModal
        open={openBoq}
        handleClose={() => setOpenBoq(false)}
        projectId={phc?.project?.pn_number}
        projectValue={phc?.project?.po_value}
      />
    </div>
  );
}
