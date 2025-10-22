import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Autocomplete,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import api from "../../api/api";
import SowModal from "./SowModal";
import { formatDateForInput } from "../../utils/formatDateForInput";
import BoqModal from "./BoqModal";

export default function UpdateDocumentPhcModal({
  open,
  onClose,
  phcId,
  project,
}) {
  const [step, setStep] = useState(1);
  const [documents, setDocuments] = useState([]);
  const [openSowModal, setOpenSowModal] = useState(false);
  const [openBoq, setOpenBoq] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState({});

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
  const [loadingPhc, setLoadingPhc] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [engineeringUsers, setEngineeringUsers] = useState([]);
  const [phcDetail, setPhcDetail] = useState(null);

  const refreshDocuments = async () => {
    try {
      const phcRes = await api.get(`/phcs/show/${phcId}`);
      if (phcRes.data) {
        const { documents } = phcRes.data;

        setDocuments(
          documents.map((doc) => {
            const prep = doc.preparations?.[0];
            let datePrepared = "";

            if (prep?.date_prepared) {
              // Gunakan formatDateForInput supaya selalu jadi "YYYY-MM-DD"
              datePrepared = formatDateForInput(prep.date_prepared);
            }

            return {
              id: doc.id,
              name: doc.name,
              status: prep ? (prep.is_applicable ? "A" : "NA") : "NA",
              date_prepared: datePrepared,
              preparationId: prep?.id || null,
            };
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!open || !phcId) return;

    const fetchData = async () => {
      try {
        const [engineeringRes] = await Promise.all([
          api.get("/phc/users/engineering"),
        ]);

        setEngineeringUsers(engineeringRes.data.data);

        const phcRes = await api.get(`/phcs/show/${phcId}`);
        if (phcRes.data) {
          const { phc, documents } = phcRes.data;

          setPhcDetail(phc);

          console.log(phcRes.data);

          setFormData((prev) => ({
            ...prev,
            handover_date: phc.handover_date || "",
            start_date: phc.start_date || "",
            target_finish_date: phc.target_finish_date || "",
            client_pic_name: phc.client_pic_name || "",
            client_mobile: phc.client_mobile || "",
            client_reps_office_address: phc.client_reps_office_address || "",
            client_site_address: phc.client_site_address || "",
            client_site_representatives: phc.client_site_representatives || "",
            site_phone_number: phc.site_phone_number || "",
            ho_marketings_id: phc.ho_marketings_id || null,
            pic_marketing_id: phc.pic_marketing_id || null,
            ho_engineering_id: phc.ho_engineering_id || null,
            pic_engineering_id: phc.pic_engineering_id || null,
            notes: phc.notes || "",
            costing_by_marketing: normalizeValue(phc.costing_by_marketing),
            boq: normalizeValue(phc.boq),
            retention: phc.retention,
            warranty: phc.warranty,
            penalty: phc.penalty,
          }));

          setDocuments(
            documents.map((doc) => {
              const prep = doc.preparations?.[0];
              let datePrepared = "";

              if (prep?.date_prepared) {
                // Gunakan formatDateForInput supaya selalu jadi "YYYY-MM-DD"
                datePrepared = formatDateForInput(prep.date_prepared);
              }

              return {
                id: doc.id,
                name: doc.name,
                status: prep ? (prep.is_applicable ? "A" : "NA") : "NA",
                date_prepared: datePrepared,
                preparationId: prep?.id || null,
              };
            })
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPhc(false);
        setLoadingUsers(false);
      }
    };

    fetchData();
  }, [phcId, open]);

  const handleFileUpload = async (documentPreparationId, file) => {
    if (!file) return;

    setUploading((prev) => ({ ...prev, [documentPreparationId]: true }));

    const formDataUpload = new FormData();
    formDataUpload.append("document", file);

    try {
      const res = await api.post(
        `/document-preparations/${documentPreparationId}/upload`,
        formDataUpload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data) {
        setSnackbar({
          open: true,
          message: "Document uploaded successfully!",
          severity: "success",
        });
        // Refresh documents to reflect the uploaded file
        await refreshDocuments();
        // Clear selected file after successful upload
        setSelectedFiles((prev) => ({
          ...prev,
          [documentPreparationId]: null,
        }));
        // Close the modal after successful upload, like in other modal components
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to upload document.",
        severity: "error",
      });
    } finally {
      setUploading((prev) => ({ ...prev, [documentPreparationId]: false }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        documents: documents.map((doc) => ({
          document_id: doc.id,
          status: doc.status,
          date_prepared: doc.status === "A" ? doc.date_prepared : null,
        })),
      };

      const res = await api.put(`/phcs/${phcId}`, payload);
      if (res.data.success) {
        // Show snackbar immediately
        setSnackbar({
          open: true,
          message: "PHC updated successfully!",
          severity: "success",
        });
        // Notify parent component to refresh project list
        if (window.parentRefreshProjects) {
          window.parentRefreshProjects();
        }
        // Notify ViewProjectsModal to refresh
        if (window.handleRefreshProject) {
          window.handleRefreshProject();
        }
        // Close modal after a short delay to allow snackbar to appear
        setTimeout(() => {
          onClose();
        }, 100);
      } else {
        setSnackbar({
          open: true,
          message: "Failed to update PHC.",
          severity: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "An error occurred while updating PHC.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const normalizeValue = (val) => {
    if (val === "0") return "NA";
    if (val === "1") return "A"; // kalau backend nanti pakai 1
    return val; // biarin kalau sudah "A" / "NA"
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

  if (loadingUsers || loadingPhc) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        sx={{ "& .MuiDialog-paper": { height: "90vh" } }}
      >
        <DialogContent>
          <div className="flex justify-center items-center h-64">
            <CircularProgress />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        sx={{ "& .MuiDialog-paper": { height: "90vh" } }}
      >
        <DialogContent>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-center flex-1">
                📄 Update Project Handover Checklist (PHC)
              </h2>
              <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            </div>
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
                  step === 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setStep(1)}
              >
                1️⃣ Information
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md w-full md:w-40 text-sm md:text-base ${
                  step === 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setStep(2)}
              >
                2️⃣ Checklist
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md w-full md:w-40 text-sm md:text-base ${
                  step === 3
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setStep(3)}
              >
                3️⃣ Documents
              </button>
            </div>

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
                      value={formatDate(
                        project?.quotation?.quotation_date || ""
                      )}
                      fullWidth
                      disabled
                    />

                    <div className="md:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TextField
                          type="date"
                          label="Handover Date"
                          InputLabelProps={{ shrink: true }}
                          value={formatDateForInput(formData.handover_date)}
                          fullWidth
                          disabled
                        />

                        <TextField
                          type="date"
                          label="Start Date"
                          InputLabelProps={{ shrink: true }}
                          value={formatDateForInput(formData.start_date)}
                          fullWidth
                          disabled
                        />

                        <TextField
                          type="date"
                          label="Target Finish Date"
                          InputLabelProps={{ shrink: true }}
                          value={formatDateForInput(
                            formData.target_finish_date
                          )}
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

                    <div className="md:col-span-2">
                      <TextField
                        label="Client Office Address"
                        multiline
                        rows={2}
                        value={formData.client_reps_office_address}
                        fullWidth
                        disabled
                      />
                    </div>

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

                    <TextField
                      label="HO Marketing"
                      fullWidth
                      value={phcDetail?.ho_marketing?.name || "-"}
                      disabled
                    />

                    <TextField
                      label="PIC Marketing"
                      fullWidth
                      value={phcDetail?.pic_marketing?.name || "-"}
                      disabled
                    />

                    <TextField
                      label="HO Engineering"
                      fullWidth
                      value={phcDetail?.ho_engineering?.name || "-"}
                      disabled
                    />

                    {/* PIC Engineering - editable (misalnya pakai Autocomplete) */}
                    <Autocomplete
                      options={engineeringUsers}
                      getOptionLabel={(option) => option.name || ""}
                      value={
                        engineeringUsers.find(
                          (u) => u.id === formData.pic_engineering_id
                        ) ||
                        (phcDetail?.pic_engineering
                          ? phcDetail.pic_engineering
                          : null)
                      }
                      onChange={(e, newValue) =>
                        setFormData((prev) => ({
                          ...prev,
                          pic_engineering_id: newValue?.id || null,
                        }))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="PIC Engineering"
                          fullWidth
                        />
                      )}
                    />

                    <div className="md:col-span-2">
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

                  <div className="flex justify-between mt-8">
                    <Button variant="outlined" onClick={onClose}>
                      Close
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
                      { key: "boq", label: "Bill of Quantity (BOQ)" },
                      { key: "retention", label: "Retention" },
                      { key: "warranty", label: "Warranty" },
                      { key: "penalty", label: "Penalty" },
                    ].map(({ key, label }) => {
                      const value = formData[key]; // A / NA atau free text

                      return (
                        <div
                          key={key}
                          className="p-4 border rounded-md bg-gray-50 space-y-3"
                        >
                          <label className="block text-sm font-medium text-gray-700">
                            {label}
                          </label>

                          {/* Badge status */}
                          {key === "costing_by_marketing" || key === "boq" ? (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                value === "A"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {value === "A" ? "Applicable" : "Not Applicable"}
                            </span>
                          ) : (
                            <>
                              {value === "NA" ? (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  Not Applicable
                                </span>
                              ) : (
                                <TextField
                                  placeholder={`${label} Detail`}
                                  value={value}
                                  fullWidth
                                  disabled
                                />
                              )}
                            </>
                          )}

                          {/* Detail khusus BOQ */}
                          {key === "boq" && value === "A" && (
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
                      );
                    })}
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button variant="outlined" onClick={() => setStep(1)}>
                      Back: Information
                    </Button>
                    <Button variant="contained" onClick={() => setStep(3)}>
                      Next: Documents
                    </Button>
                  </div>
                </div>
              )}

              {/* ---------------- STEP 3 ---------------- */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                    📄 Step 3: Document Preparation
                  </h3>

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
                                      ? {
                                          ...d,
                                          status: "NA",
                                          date_prepared: "",
                                        }
                                      : d
                                  )
                                )
                              }
                            />
                            <span className="ml-2 text-sm">Not Applicable</span>
                          </label>
                        </div>

                        {doc.status === "A" && (
                          <>
                            <TextField
                              type="date"
                              label="Date Prepared"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              value={formatDateForInput(doc.date_prepared)}
                              onChange={(e) =>
                                setDocuments((prev) =>
                                  prev.map((d) =>
                                    d.id === doc.id
                                      ? { ...d, date_prepared: e.target.value }
                                      : d
                                  )
                                )
                              }
                            />

                            {/* File Upload Section */}
                            <div className="mt-2">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.png"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setSelectedFiles((prev) => ({
                                      ...prev,
                                      [doc.preparationId]: file,
                                    }));
                                  }
                                }}
                                style={{ display: "none" }}
                                id={`file-upload-${doc.id}`}
                              />
                              <label htmlFor={`file-upload-${doc.id}`}>
                                <Button
                                  variant="outlined"
                                  component="span"
                                  size="small"
                                  fullWidth
                                >
                                  Choose File
                                </Button>
                              </label>
                              {selectedFiles[doc.preparationId] && (
                                <Typography variant="body2" className="mt-1">
                                  Selected:{" "}
                                  {selectedFiles[doc.preparationId].name}
                                </Typography>
                              )}
                              <Button
                                variant="contained"
                                size="small"
                                fullWidth
                                className="mt-2"
                                disabled={
                                  !selectedFiles[doc.preparationId] ||
                                  uploading[doc.preparationId]
                                }
                                onClick={() =>
                                  handleFileUpload(
                                    doc.preparationId,
                                    selectedFiles[doc.preparationId]
                                  )
                                }
                              >
                                {uploading[doc.preparationId]
                                  ? "Uploading..."
                                  : "Upload Document"}
                              </Button>
                            </div>

                            {/* ✅ Tambahkan tombol Create SOW khusus kalau doc.name === "Scope of Work" */}
                            {doc.name
                              .toLowerCase()
                              .includes("scope_of_work_approval") && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenSowModal(true)}
                              >
                                Create SOW
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button variant="outlined" onClick={() => setStep(2)}>
                      Back: Checklist
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={submitting}
                    >
                      {submitting ? "Saving..." : "Save PHC"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
          <SowModal
            open={openSowModal}
            handleClose={() => setOpenSowModal(false)}
            projectId={project?.pn_number}
            token={localStorage.getItem("token")}
          />
          <BoqModal
            open={openBoq}
            handleClose={() => setOpenBoq(false)}
            projectId={project?.pn_number}
            projectValue={project?.po_value}
            role={phcDetail?.user?.role}
            token={localStorage.getItem("token")}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar for success messages - moved outside Dialog */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
