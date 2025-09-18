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
import api from "../../../api/api";
import { useLocation, useNavigate } from "react-router-dom";
// import BoqModal from "../../components/modal/BoqModal";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";

export default function UpdateDocumentPhc() {
  const navigate = useNavigate();
  // 🔹 Mulai default Step 1
  const [step, setStep] = useState(1);

  const { state } = useLocation();
  const project = state?.project;

  // const [openBoq, setOpenBoq] = useState(false);
  const [documents, setDocuments] = useState([]);

  const { phcId } = useParams();

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
    ho_marketings_id: null,
    pic_marketing_id: null,
    ho_engineering_id: null,
    pic_engineering_id: null,
    notes: "",
    costing_by_marketing: "",
    costing_by_marketing_detail: "",
    boq: "",
    retention: "",
    retention_detail: "",
    warranty: "",
    warranty_detail: "",
    penalty: "",
    penalty_detail: "",
  });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [marketingUsers, setMarketingUsers] = useState([]);
  const [engineeringUsers, setEngineeringUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [marketingRes, engineeringRes] = await Promise.all([
          api.get("/users?role=marketing"),
          api.get("/users?role=engineering"),
        ]);
        setMarketingUsers(marketingRes.data.data);
        setEngineeringUsers(engineeringRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchPhc = async () => {
      if (phcId) {
        try {
          const res = await api.get(`/phcs/${project.phc_id}`);
          if (res.data.success) {
            const phc = res.data.phc;
            setFormData({
              handover_date: phc.handover_date || "",
              start_date: phc.start_date || "",
              target_finish_date: phc.target_finish_date || "",
              client_pic_name: phc.client_pic_name || "",
              client_mobile: phc.client_mobile || "",
              client_reps_office_address: phc.client_reps_office_address || "",
              client_site_address: phc.client_site_address || "",
              client_site_representatives:
                phc.client_site_representatives || "",
              site_phone_number: phc.site_phone_number || "",
              ho_marketings_id: phc.ho_marketings_id,
              pic_marketing_id: phc.pic_marketing_id,
              ho_engineering_id: phc.ho_engineering_id,
              pic_engineering_id: phc.pic_engineering_id,
              notes: phc.notes || "",
              costing_by_marketing: phc.costing_by_marketing,
              costing_by_marketing_detail: phc.costing_by_marketing_detail,
              boq: phc.boq,
              retention: phc.retention,
              retention_detail: phc.retention_detail,
              warranty: phc.warranty,
              warranty_detail: phc.warranty_detail,
              penalty: phc.penalty,
              penalty_detail: phc.penalty_detail,
            });

            // Dokumen
            const docs = phc.documents.map((doc) => {
              const prep = doc.preparations[0] || {};
              return {
                id: doc.id,
                name: doc.name,
                status: prep.is_applicable ? "A" : "NA",
                date_prepared: prep.date_prepared || "",
              };
            });
            setDocuments(docs);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    fetchUsers();
    fetchPhc();
  }, [project]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        pic_engineering_id: formData.pic_engineering_id || null,
        documents: documents.reduce((acc, doc) => {
          acc[doc.id] = {
            status: doc.status,
            date_prepared: doc.status === "A" ? doc.date_prepared : null,
          };
          return acc;
        }, {}),
      };

      const res = await api.put(`/engineer/phc/${phcId}`, payload);
      if (res.data.success) {
        Swal.fire("Success", "PHC updated successfully!", "success");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update PHC", "error");
    } finally {
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
      <h2 className="text-2xl font-bold mb-8 text-center">
        📄 View Project Handover Checklist (PHC)
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
          className="px-4 py-2 rounded-md w-full md:w-40 text-sm md:text-base bg-gray-100 text-gray-400 cursor-not-allowed"
        >
          1️⃣ Information
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-md w-full md:w-40 text-sm md:text-base bg-gray-100 text-gray-400 cursor-not-allowed"
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
                  label="Quotation Date"
                  value={formatDate(project?.quotation?.quotation_date || "")}
                  fullWidth
                  disabled
                />

                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      type="date"
                      label="Handover Date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.handover_date}
                      fullWidth
                      disabled
                    />
                    <TextField
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.start_date}
                      fullWidth
                      disabled
                    />
                    <TextField
                      type="date"
                      label="Target Finish Date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.target_finish_date}
                      fullWidth
                      disabled
                    />
                  </div>
                </div>

                <TextField
                  label="Client PIC Name"
                  value={formData.client_pic_name}
                  fullWidth
                  disabled
                />
                <TextField
                  label="Client Mobile"
                  value={formData.client_mobile}
                  fullWidth
                  disabled
                />
                <TextField
                  label="Client Office Address"
                  multiline
                  rows={2}
                  value={formData.client_reps_office_address}
                  fullWidth
                  disabled
                />

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField
                    label="Client Site Address"
                    value={formData.client_site_address}
                    fullWidth
                    disabled
                  />
                  <TextField
                    label="Client Representative"
                    value={formData.client_site_representatives}
                    fullWidth
                    disabled
                  />
                  <TextField
                    label="Site Phone Number"
                    value={formData.site_phone_number}
                    fullWidth
                    disabled
                  />
                </div>

                <Autocomplete
                  options={marketingUsers}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    marketingUsers.find(
                      (u) => u.id === formData.ho_marketings_id
                    ) || null
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="HO Marketing"
                      fullWidth
                      disabled
                    />
                  )}
                />
                <Autocomplete
                  options={marketingUsers}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    marketingUsers.find(
                      (u) => u.id === formData.pic_marketing_id
                    ) || null
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="PIC Marketing"
                      fullWidth
                      disabled
                    />
                  )}
                />

                <Autocomplete
                  options={engineeringUsers}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    engineeringUsers.find(
                      (u) => u.id === formData.ho_engineering_id
                    ) || null
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="HO Engineering"
                      fullWidth
                      disabled
                    />
                  )}
                />
                <Autocomplete
                  options={engineeringUsers}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    engineeringUsers.find(
                      (u) => u.id === formData.pic_engineering_id
                    ) || null
                  }
                  onChange={(event, newValue) =>
                    setFormData({
                      ...formData,
                      pic_engineering_id: newValue?.id || null,
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="PIC Engineering" fullWidth />
                  )}
                />

                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  fullWidth
                  disabled
                />
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
                  { key: "retention", label: "Retention" },
                  { key: "warranty", label: "Warranty" },
                  { key: "penalty", label: "Penalty" },
                ].map(({ key, label }) => (
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
                          value="A"
                          checked={formData[key] === "A"}
                          disabled
                        />
                        <span className="ml-2 text-sm">Applicable</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="NA"
                          checked={formData[key] === "NA"}
                          disabled
                        />
                        <span className="ml-2 text-sm">Not Applicable</span>
                      </label>
                    </div>
                    {key !== "boq" && formData[`${key}_detail`] && (
                      <TextField
                        placeholder={`${label} Detail`}
                        value={formData[`${key}_detail`] || ""}
                        fullWidth
                        disabled
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- STEP 3 ---------------- */}
          {step === 3 && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setSubmitting(true);
                  const payload = {
                    documents: documents.reduce((acc, doc) => {
                      acc[doc.id] = {
                        status: doc.status,
                        date_prepared:
                          doc.status === "A" ? doc.date_prepared : null,
                      };
                      return acc;
                    }, {}),
                  };
                  const res = await api.put(`/phc/${project.phc_id}`, payload);
                  if (res.data.success) {
                    Swal.fire("Success", "Document status saved!", "success");
                  }
                } catch (err) {
                  console.error(err);
                  Swal.fire("Error", "Failed to save documents", "error");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 border rounded-md bg-white space-y-2 shadow-sm"
                    >
                      <label className="block text-sm font-medium text-gray-700">
                        {doc.name}
                      </label>
                      <div className="flex gap-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="A"
                            checked={doc.status === "A"}
                            onChange={() =>
                              setDocuments((prev) =>
                                prev.map((d) =>
                                  d.id === doc.id ? { ...d, status: "A" } : d
                                )
                              )
                            }
                            className="text-blue-600 border-gray-300"
                          />
                          <span className="ml-2 text-sm">Applicable</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="NA"
                            checked={doc.status === "NA"}
                            onChange={() =>
                              setDocuments((prev) =>
                                prev.map((d) =>
                                  d.id === doc.id
                                    ? { ...d, status: "NA", date_prepared: "" }
                                    : d
                                )
                              )
                            }
                            className="text-blue-600 border-gray-300"
                          />
                          <span className="ml-2 text-sm">Not Applicable</span>
                        </label>
                      </div>

                      {doc.status === "A" && (
                        <input
                          type="date"
                          value={doc.date_prepared || ""}
                          onChange={(e) =>
                            setDocuments((prev) =>
                              prev.map((d) =>
                                d.id === doc.id
                                  ? { ...d, date_prepared: e.target.value }
                                  : d
                              )
                            )
                          }
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${project?.pn_number}`)}
                    className="px-5 py-2 border rounded"
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
                    {submitting ? "💾 Saving..." : "💾 Save Document Status"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </form>
      )}
    </div>
  );
}
