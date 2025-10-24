import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Grid,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";
import { Receipt, Building2, User, DollarSign, FileText } from "lucide-react";
import api from "../../api/api";
import { formatValue } from "../../utils/formatValue";
import { formatDate } from "../../utils/FormatDate";

export default function FormInvoicesModal({
  open,
  onClose,
  projectId,
  invoiceData = null,
  onSave,
}) {
  const [formData, setFormData] = useState({
    invoice_type_id: null,
    invoice_sequence: "",
    no_faktur: "",
    invoice_date: "",
    invoice_description: "",
    invoice_value: "",
    invoice_due_date: "",
    remarks: "",
    currency: "IDR",
  });

  const [nextSequence, setNextSequence] = useState("");
  const [sequenceError, setSequenceError] = useState("");
  const [validatingSequence, setValidatingSequence] = useState(false);

  const [projectInfo, setProjectInfo] = useState(null);
  const [invoiceTypes, setInvoiceTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState(null);

  const [originalInvoiceTypeId, setOriginalInvoiceTypeId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [warningModal, setWarningModal] = useState({
    open: false,
    message: "",
    onConfirm: null,
  });

  const [fullInvoiceData, setFullInvoiceData] = useState(null);

  const isEditMode = Boolean(invoiceData);

  // Fetch invoice types, project info, and next sequence
  useEffect(() => {
    if (!open) return;

    const fetchInvoiceTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await api.get("/finance/invoice-types");
        setInvoiceTypes(response.data || []);
      } catch (error) {
        console.error("Failed to fetch invoice types:", error);
        setInvoiceTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    };

    const fetchProjectInfo = async () => {
      if (!projectId) return;
      setLoadingProject(true);
      try {
        const response = await api.get(`/projects/${projectId}`);
        setProjectInfo(response.data?.data?.project || null);
      } catch (error) {
        console.error("Failed to fetch project info:", error);
        setProjectInfo(null);
      } finally {
        setLoadingProject(false);
      }
    };

    const fetchNextSequence = async () => {
      if (!projectId) return;
      try {
        const response = await api.get("/finance/invoices/next-id", {
          params: { project_id: projectId },
        });
        const nextInvoiceId = response.data?.next_invoice_id;
        if (nextInvoiceId) {
          // Extract the last 3 digits as sequence
          const nextSeq = parseInt(nextInvoiceId.slice(-3));
          setNextSequence(nextSeq.toString().padStart(3, "0"));
          // Set default sequence to next available
          if (!isEditMode) {
            setFormData((prev) => ({
              ...prev,
              invoice_sequence: nextSeq.toString().padStart(3, "0"),
            }));
          }
        } else {
          setNextSequence("001");
          if (!isEditMode) {
            setFormData((prev) => ({ ...prev, invoice_sequence: "001" }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch next sequence:", error);
        setNextSequence("001");
        if (!isEditMode) {
          setFormData((prev) => ({ ...prev, invoice_sequence: "001" }));
        }
      }
    };

    fetchInvoiceTypes();
    fetchProjectInfo();
    fetchNextSequence();
  }, [open, projectId, isEditMode]);

  // Fetch full invoice data for edit mode
  useEffect(() => {
    if (isEditMode && invoiceData?.invoice_id && open) {
      const fetchFullInvoiceData = async () => {
        try {
          const response = await api.get(
            `/finance/invoices/${invoiceData.invoice_id}`
          );
          console.log("Fetched full invoice data:", response.data);
          setFullInvoiceData(response.data);
        } catch (error) {
          console.error("Failed to fetch full invoice data:", error);
          setFullInvoiceData(null);
        }
      };
      fetchFullInvoiceData();
    } else {
      setFullInvoiceData(null);
    }
  }, [isEditMode, invoiceData?.invoice_id, open]);

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (isEditMode && (fullInvoiceData || invoiceData)) {
        const data = fullInvoiceData || invoiceData;
        console.log("Initializing form with data:", data);
        console.log("invoice_type_id:", data.invoice_type_id);
        const invoiceTypeId = data.invoice_type_id
          ? parseInt(data.invoice_type_id)
          : null;
        // Extract sequence from invoice_id (last 3 characters)
        const sequence = data.invoice_id ? data.invoice_id.slice(-3) : "";
        setFormData({
          invoice_type_id: invoiceTypeId,
          invoice_sequence: sequence,
          no_faktur: data.no_faktur || "",
          invoice_date: data.invoice_date ? data.invoice_date.slice(0, 10) : "",
          invoice_description: data.invoice_description || "",
          invoice_value: data.invoice_value || "",
          invoice_due_date: data.invoice_due_date
            ? data.invoice_due_date.slice(0, 10)
            : "",
          remarks: data.remarks || "",
          currency: data.currency || "IDR",
        });
        setOriginalInvoiceTypeId(invoiceTypeId);
      } else {
        setFormData({
          invoice_type_id: null,
          invoice_sequence: "",
          no_faktur: "",
          invoice_date: "",
          invoice_description: "",
          invoice_value: "",
          invoice_due_date: "",
          remarks: "",
          currency: "IDR",
        });
        setOriginalInvoiceTypeId(null);
      }
      setShowPreview(false);
      setPreviewData(null);
      setPreviewInvoiceId(null);
    }
  }, [open, isEditMode, invoiceData, fullInvoiceData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSequenceChange = async (value) => {
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 3);
    setFormData((prev) => ({ ...prev, invoice_sequence: numericValue }));

    // Clear previous error
    setSequenceError("");

    // Clear error if sequence is empty
    if (!numericValue) {
      return;
    }

    // Validate sequence uniqueness only if sequence has value
    if (numericValue && formData.invoice_type_id && projectId) {
      setValidatingSequence(true);
      try {
        const response = await api.get("/finance/invoices/validate-sequence", {
          params: {
            project_id: projectId,
            invoice_type_id: formData.invoice_type_id,
            invoice_sequence: parseInt(numericValue),
            ...(isEditMode &&
              invoiceData?.invoice_id && {
                exclude_invoice_id: invoiceData.invoice_id,
              }),
          },
        });

        if (response.data && !response.data.available) {
          // Sequence already exists - provide specific error message
          const selectedType = invoiceTypes.find(
            (type) => type.id === formData.invoice_type_id
          );
          const typeName = selectedType
            ? selectedType.code_type
            : "selected type";
          const paddedSequence = numericValue.padStart(3, "0");

          setSequenceError(
            `Sequence ${paddedSequence} already exists for ${typeName} invoices in this project. Please choose a different sequence number.`
          );
        } else {
          setSequenceError("");
        }
      } catch (error) {
        console.error("Failed to validate sequence:", error);

        // Provide more specific error messages based on error type
        if (error.response) {
          // Server responded with error status
          if (error.response.status === 400) {
            setSequenceError(
              "Invalid sequence format. Please enter a valid number."
            );
          } else if (error.response.status === 500) {
            setSequenceError("Server error occurred. Please try again later.");
          }
        } else if (error.request) {
          // Network error
          setSequenceError(
            "Network error. Please check your internet connection."
          );
        } else {
          // Other error
          setSequenceError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setValidatingSequence(false);
      }
    } else {
      setSequenceError("");
    }
  };

  const generateInvoiceId = useCallback(async () => {
    if (!formData.invoice_type_id) return null;

    try {
      const params = {
        project_id: projectId,
        invoice_type_id: formData.invoice_type_id,
      };

      // Add invoice_sequence if provided
      if (formData.invoice_sequence) {
        params.invoice_sequence = parseInt(formData.invoice_sequence);
      }

      // For edit mode with type change
      if (
        isEditMode &&
        originalInvoiceTypeId &&
        originalInvoiceTypeId !== formData.invoice_type_id
      ) {
        params.original_invoice_type_id = originalInvoiceTypeId;
      }

      // Add project_id for backend to use full pn_number
      params.project_id = projectId;

      const response = await api.get("/finance/invoices/next-id", { params });
      console.log("Generated invoice ID:", response.data.next_invoice_id);
      return response.data.next_invoice_id;
    } catch (error) {
      console.error("Failed to generate invoice ID:", error);
      return null;
    }
  }, [
    formData.invoice_type_id,
    formData.invoice_sequence,
    projectId,
    isEditMode,
    originalInvoiceTypeId,
  ]);

  // Generate preview invoice ID when invoice type or sequence is changed
  useEffect(() => {
    if (formData.invoice_type_id && formData.invoice_sequence && projectId) {
      (async () => {
        try {
          const id = await generateInvoiceId();
          setPreviewInvoiceId(id);
        } catch (error) {
          console.error("Failed to generate preview invoice ID:", error);
          setPreviewInvoiceId(null);
        }
      })();
    } else {
      setPreviewInvoiceId(null);
    }
  }, [
    formData.invoice_type_id,
    formData.invoice_sequence,
    projectId,
    originalInvoiceTypeId,
    generateInvoiceId,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check if invoice value exceeds project value using API
    if (formData.invoice_value) {
      try {
        const params = {
          project_id: projectId,
          invoice_value: parseFloat(formData.invoice_value),
          ...(isEditMode &&
            invoiceData?.invoice_id && { invoice_id: invoiceData.invoice_id }),
        };

        const response = await api.get("/finance/invoices/validate", {
          params,
        });

        if (!response.data.valid) {
          const details = response.data;
          const currency = formData.currency || "IDR";
          const detailedMessage = `${
            response.data.message
          }\n\nDetails:\n- Current total invoices: ${
            formatValue(details.current_total || 0, currency).formatted
          }\n- New total after this invoice: ${
            formatValue(details.new_total || 0, currency).formatted
          }\n- Project value: ${
            formatValue(details.project_value || 0, currency).formatted
          }\n- Exceeds by: ${
            formatValue(details.exceeds_by || 0, currency).formatted
          }`;
          setWarningModal({
            open: true,
            message: detailedMessage,
            onConfirm: () => {
              setWarningModal({ open: false, message: "", onConfirm: null });
              proceedWithSubmit();
            },
          });
          return;
        }
      } catch (error) {
        console.error("Validation failed:", error);
        setSnackbar({
          open: true,
          message: "Failed to validate invoice. Please try again.",
          severity: "error",
        });
        return;
      }
    }

    proceedWithSubmit();
  };

  const proceedWithSubmit = async () => {
    // Generate preview data
    const generatedId = await generateInvoiceId();
    console.log("Preview generated ID:", generatedId);
    const selectedType = invoiceTypes.find(
      (type) => type.id === formData.invoice_type_id
    );

    const preview = {
      invoice_id: isEditMode
        ? generatedId || invoiceData?.invoice_id || "N/A"
        : generatedId || previewInvoiceId || "IP0000000",
      project_id: projectId,
      invoice_type: selectedType
        ? `${selectedType.code_type} - ${selectedType.description}`
        : "Not selected",
      no_faktur: formData.no_faktur || "Not specified",
      invoice_date: formData.invoice_date
        ? formatDate(formData.invoice_date)
        : "Not specified",
      invoice_description: formData.invoice_description || "Not specified",
      invoice_value: formData.invoice_value
        ? formatValue(formData.invoice_value).formatted
        : "Not specified",
      invoice_due_date: formData.invoice_due_date
        ? formatDate(formData.invoice_due_date)
        : "Not specified",
      currency: formData.currency,
      remarks: formData.remarks || "Not specified",
    };

    setPreviewData(preview);
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        project_id: projectId,
        invoice_type_id: formData.invoice_type_id,
        invoice_sequence: formData.invoice_sequence
          ? parseInt(formData.invoice_sequence)
          : null,
        no_faktur: formData.no_faktur || null,
        invoice_date: formData.invoice_date || null,
        invoice_description: formData.invoice_description || null,
        invoice_value: formData.invoice_value
          ? parseFloat(formData.invoice_value)
          : null,
        invoice_due_date: formData.invoice_due_date || null,
        currency: formData.currency,
        remarks: formData.remarks || null,
      };

      if (isEditMode) {
        await api.put(`/finance/invoices/${invoiceData.invoice_id}`, payload);
      } else {
        await api.post("/finance/invoices", payload);
      }

      setSnackbar({
        open: true,
        message: `Invoice ${isEditMode ? "updated" : "created"} successfully!`,
        severity: "success",
      });

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save invoice:", error);
      setSnackbar({
        open: true,
        message: "Failed to save invoice. Please try again.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
      setShowPreview(false);
    }
  };

  const handleCurrencyChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, invoice_value: numericValue }));
  };

  if (showPreview && previewData) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
            pb: 2,
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Receipt sx={{ fontSize: 28, color: "primary.main" }} />
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                Invoice Preview
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                Review your invoice details before{" "}
                {isEditMode ? "updating" : "creating"}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 4, px: 4 }}>
          {/* Invoice Header Card */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: "rgba(255,255,255,0.1)",
                borderRadius: "50%",
                transform: "translate(30px, -30px)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, mb: 1, fontFamily: "monospace" }}
                >
                  {previewData.invoice_id}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Invoice {isEditMode ? "Update" : "Creation"}
                </Typography>
              </Box>
              <Chip
                label={isEditMode ? "Update" : "New"}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              />
            </Box>
            <Divider sx={{ bgcolor: "rgba(255,255,255,0.3)", my: 2 }} />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Building2 sx={{ fontSize: 20, opacity: 0.8 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, display: "block" }}
                    >
                      Project ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {previewData.project_id}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Receipt sx={{ fontSize: 20, opacity: 0.8 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, display: "block" }}
                    >
                      Invoice Type
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {previewData.invoice_type}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            {/* Basic Information Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <FileText
                    sx={{ mr: 1.5, color: "primary.main", fontSize: 22 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "primary.main" }}
                  >
                    Basic Information
                  </Typography>
                </Box>

                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      No Faktur
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {previewData.no_faktur}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Description
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 500, lineHeight: 1.4 }}
                    >
                      {previewData.invoice_description}
                    </Typography>
                  </Box>

                  {previewData.remarks !== "Not specified" && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        Remarks
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 500, lineHeight: 1.4 }}
                      >
                        {previewData.remarks}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Financial Details Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <DollarSign
                    sx={{ mr: 1.5, color: "warning.main", fontSize: 22 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "warning.main" }}
                  >
                    Financial Details
                  </Typography>
                </Box>

                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Invoice Value
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: "success.main",
                        fontFamily: "monospace",
                      }}
                    >
                      {previewData.invoice_value}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Currency
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 18,
                          fontWeight: 700,
                          color:
                            previewData.currency === "IDR"
                              ? "#1976d2"
                              : "#2e7d32",
                          minWidth: 24,
                          textAlign: "center",
                        }}
                      >
                        {previewData.currency === "IDR" ? "Rp" : "$"}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {previewData.currency === "IDR"
                          ? "Indonesian Rupiah"
                          : "US Dollar"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Dates Card */}
            <Grid size={{ xs: 12 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <User sx={{ mr: 1.5, color: "info.main", fontSize: 22 }} />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "info.main" }}
                  >
                    Important Dates
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "background.paper",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                          mb: 1,
                        }}
                      >
                        Invoice Date
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        {previewData.invoice_date}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "background.paper",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                          mb: 1,
                        }}
                      >
                        Due Date
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "error.main" }}
                      >
                        {previewData.invoice_due_date}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            borderTop: 1,
            borderColor: "divider",
            gap: 2,
            bgcolor: "grey.50",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={() => setShowPreview(false)}
            color="inherit"
            variant="outlined"
            disabled={submitting}
            sx={{
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": {
                bgcolor: "grey.100",
              },
            }}
          >
            ← Back to Edit
          </Button>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={onClose}
              color="inherit"
              variant="text"
              disabled={submitting}
              sx={{
                px: 3,
                fontWeight: 500,
                textTransform: "none",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              variant="contained"
              disabled={submitting}
              sx={{
                bgcolor: "success.main",
                px: 4,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                "&:hover": {
                  bgcolor: "success.dark",
                  boxShadow: "0 6px 16px rgba(34, 197, 94, 0.4)",
                },
              }}
            >
              {submitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: "white" }} />
                  Saving...
                </Box>
              ) : (
                `✓ Confirm ${isEditMode ? "Update" : "Create"}`
              )}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "text.primary",
              borderBottom: 1,
              borderColor: "divider",
              pb: 1.5,
            }}
          >
            <Receipt style={{ marginRight: 8 }} />
            {isEditMode ? "Edit Invoice" : "Create New Invoice"}
          </DialogTitle>

          <DialogContent dividers sx={{ py: 3 }}>
            <Box sx={{ p: 2 }}>
              {/* Project Information Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <Building2 sx={{ mr: 1.5, fontSize: 22 }} />
                  Project Information
                </Typography>

                {loadingProject ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 2 }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : projectInfo ? (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <FileText
                          sx={{ color: "text.secondary", fontSize: 16 }}
                        />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Project Number
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "primary.main" }}
                          >
                            {projectInfo.project_number || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <User sx={{ color: "text.secondary", fontSize: 16 }} />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Client
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {projectInfo.quotation?.client?.name ||
                              projectInfo.client?.name ||
                              "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <DollarSign
                          sx={{ color: "text.secondary", fontSize: 16 }}
                        />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Project Value
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "success.main" }}
                          >
                            {projectInfo.po_value
                              ? formatValue(projectInfo.po_value).formatted
                              : "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <FileText
                          sx={{ color: "text.secondary", fontSize: 16 }}
                        />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            PO Number
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {projectInfo.po_number || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    Project information not available
                  </Typography>
                )}
              </Paper>

              {/* Invoice Details Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <Receipt sx={{ mr: 1.5, fontSize: 22 }} />
                  Invoice Details
                </Typography>
                <Grid container spacing={3}>
                  {/* Invoice Configuration Section */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 3,
                          fontWeight: 700,
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "1.1rem",
                        }}
                      >
                        <Receipt sx={{ mr: 1.5, fontSize: 22 }} />
                        Invoice Configuration
                      </Typography>

                      {/* Invoice Type Selection */}
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: "text.primary",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Receipt
                            sx={{ fontSize: 18, color: "primary.main" }}
                          />
                          Invoice Type *
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: "error.main", fontWeight: 500 }}
                          >
                            (Required)
                          </Typography>
                        </Typography>

                        <Autocomplete
                          fullWidth
                          options={invoiceTypes}
                          getOptionLabel={(option) =>
                            `${option.code_type} - ${option.description}`
                          }
                          value={
                            invoiceTypes.find(
                              (type) => type.id === formData.invoice_type_id
                            ) || null
                          }
                          onChange={(e, newValue) => {
                            console.log("Selected invoice type:", newValue);
                            handleChange(
                              "invoice_type_id",
                              newValue ? newValue.id : null
                            );
                          }}
                          loading={loadingTypes}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select invoice type..."
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <Receipt
                                    sx={{
                                      mr: 1,
                                      color: "action.active",
                                      fontSize: 20,
                                    }}
                                  />
                                ),
                                endAdornment: (
                                  <>
                                    {loadingTypes ? (
                                      <CircularProgress
                                        color="inherit"
                                        size={20}
                                      />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  backgroundColor: "background.paper",
                                  "&:hover": {
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      borderColor: "primary.main",
                                      borderWidth: 2,
                                    },
                                  },
                                  "&.Mui-focused": {
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      borderColor: "primary.main",
                                      borderWidth: 2,
                                    },
                                    boxShadow:
                                      "0 0 0 3px rgba(37, 99, 235, 0.1)",
                                  },
                                },
                              }}
                            />
                          )}
                          renderOption={(props, option) => {
                            const { key, ...otherProps } = props;
                            return (
                              <Box
                                component="li"
                                key={key}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  py: 1.5,
                                  px: 2,
                                  borderRadius: 1,
                                  backgroundColor: "background.paper",
                                }}
                                {...otherProps}
                              >
                                <Receipt
                                  sx={{ fontSize: 18, color: "primary.main" }}
                                />
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      fontFamily: "monospace",
                                      color: "text.primary",
                                    }}
                                  >
                                    {option.code_type}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    {option.description}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          }}
                        />
                      </Box>

                      {/* Invoice Sequence Configuration */}
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: "text.primary",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <FileText
                            sx={{ fontSize: 16, color: "primary.main" }}
                          />
                          Invoice Sequence *
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: "error.main", fontWeight: 500 }}
                          >
                            (Required - Auto-generated)
                          </Typography>
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "grey.50",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 600,
                                  display: "block",
                                  mb: 1,
                                }}
                              >
                                Auto-Generated Sequence
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 700,
                                    color: "primary.main",
                                    fontFamily: "monospace",
                                    minWidth: 60,
                                    textAlign: "center",
                                  }}
                                >
                                  {nextSequence || "001"}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Next available
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>

                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label="Custom Sequence (Optional)"
                              placeholder="Enter custom sequence or leave empty for auto"
                              value={formData.invoice_sequence}
                              onChange={(e) =>
                                handleSequenceChange(e.target.value)
                              }
                              error={!!sequenceError}
                              helperText={sequenceError}
                              InputProps={{
                                startAdornment: (
                                  <FileText
                                    sx={{
                                      mr: 1,
                                      color: "action.active",
                                      fontSize: 18,
                                    }}
                                  />
                                ),
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  backgroundColor: "background.paper",
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "primary.main",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: "primary.main",
                                      borderWidth: 2,
                                    },
                                },
                              }}
                              inputProps={{
                                maxLength: 3,
                                pattern: "\\d{1,3}",
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Invoice ID Preview */}
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: "text.primary",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <FileText
                            sx={{ fontSize: 16, color: "primary.main" }}
                          />
                          Invoice ID Preview
                        </Typography>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            background:
                              "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                            border: "2px solid",
                            borderColor:
                              formData.invoice_type_id &&
                              formData.invoice_sequence
                                ? "success.light"
                                : "grey.200",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 2,
                            }}
                          >
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 700,
                                fontFamily: "monospace",
                                color:
                                  formData.invoice_type_id &&
                                  formData.invoice_sequence
                                    ? "success.main"
                                    : "text.secondary",
                                letterSpacing: 1,
                              }}
                            >
                              {(() => {
                                const selectedType = invoiceTypes.find(
                                  (type) => type.id === formData.invoice_type_id
                                );
                                if (
                                  selectedType &&
                                  formData.invoice_sequence &&
                                  projectInfo?.pn_number
                                ) {
                                  return (
                                    selectedType.code_type +
                                    projectInfo.pn_number +
                                    formData.invoice_sequence.padStart(3, "0")
                                  );
                                }
                                return "IP25020001";
                              })()}
                            </Typography>
                            {formData.invoice_type_id &&
                              formData.invoice_sequence && (
                                <Chip
                                  label={
                                    validatingSequence
                                      ? "Validating..."
                                      : sequenceError
                                      ? "Invalid"
                                      : "Valid"
                                  }
                                  color={
                                    validatingSequence
                                      ? "default"
                                      : sequenceError
                                      ? "error"
                                      : "success"
                                  }
                                  size="small"
                                  sx={{ fontWeight: 600 }}
                                />
                              )}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              display: "block",
                              textAlign: "center",
                              mt: 1,
                            }}
                          >
                            {formData.invoice_type_id &&
                            formData.invoice_sequence
                              ? "This will be your invoice ID"
                              : "Select type and enter sequence to see preview"}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Edit Invoice ID */}
                      {isEditMode && (
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "success.light",
                            border: "1px solid",
                            borderColor: "success.main",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: "success.contrastText",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <FileText sx={{ fontSize: 16 }} />
                            Current Invoice ID:
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color: "success.contrastText",
                              fontFamily: "monospace",
                              fontSize: "1.1rem",
                            }}
                          >
                            {invoiceData?.invoice_id || "N/A"}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Row 2: No Faktur and Invoice Date */}
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              color: "text.primary",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <FileText
                              sx={{ fontSize: 16, color: "primary.main" }}
                            />
                            No Faktur
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ color: "text.secondary", fontWeight: 400 }}
                            >
                              (Optional)
                            </Typography>
                          </Typography>
                          <TextField
                            fullWidth
                            placeholder="Enter invoice tax number (e.g., 001.001-23.12345678)"
                            value={formData.no_faktur}
                            onChange={(e) =>
                              handleChange("no_faktur", e.target.value)
                            }
                            InputProps={{
                              startAdornment: (
                                <FileText
                                  sx={{
                                    mr: 1,
                                    color: "action.active",
                                    fontSize: 18,
                                  }}
                                />
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "background.paper",
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "primary.main",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "primary.main",
                                    borderWidth: 2,
                                  },
                              },
                            }}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              color: "text.primary",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Receipt
                              sx={{ fontSize: 16, color: "primary.main" }}
                            />
                            Invoice Date *
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ color: "error.main", fontWeight: 500 }}
                            >
                              (Required)
                            </Typography>
                          </Typography>
                          <TextField
                            fullWidth
                            type="date"
                            placeholder="Select invoice creation date"
                            InputLabelProps={{ shrink: true }}
                            value={formData.invoice_date}
                            onChange={(e) =>
                              handleChange("invoice_date", e.target.value)
                            }
                            InputProps={{
                              startAdornment: (
                                <Receipt
                                  sx={{
                                    mr: 1,
                                    color: "action.active",
                                    fontSize: 18,
                                  }}
                                />
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "background.paper",
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "primary.main",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "primary.main",
                                    borderWidth: 2,
                                  },
                              },
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Row 3: Due Date */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DollarSign
                          sx={{ fontSize: 16, color: "primary.main" }}
                        />
                        Due Date *
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "error.main", fontWeight: 500 }}
                        >
                          (Required)
                        </Typography>
                      </Typography>
                      <TextField
                        fullWidth
                        type="date"
                        placeholder="Select payment due date"
                        InputLabelProps={{ shrink: true }}
                        value={formData.invoice_due_date}
                        onChange={(e) =>
                          handleChange("invoice_due_date", e.target.value)
                        }
                        InputProps={{
                          startAdornment: (
                            <DollarSign
                              sx={{
                                mr: 1,
                                color: "action.active",
                                fontSize: 18,
                              }}
                            />
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "background.paper",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Financial Details Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    color: "warning.main",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <DollarSign sx={{ mr: 1.5, fontSize: 22 }} />
                  Financial Details
                </Typography>

                <Grid container spacing={3}>
                  {/* Currency Selection */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1.5,
                          fontWeight: 600,
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DollarSign
                          sx={{ fontSize: 16, color: "primary.main" }}
                        />
                        Currency *
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "error.main", fontWeight: 500 }}
                        >
                          (Required)
                        </Typography>
                      </Typography>

                      <Autocomplete
                        fullWidth
                        options={["IDR", "USD"]}
                        value={formData.currency}
                        onChange={(e, newValue) =>
                          handleChange("currency", newValue || "IDR")
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select currency"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <Typography
                                  sx={{
                                    mr: 1,
                                    fontWeight: 600,
                                    color:
                                      formData.currency === "IDR"
                                        ? "#1976d2"
                                        : "#2e7d32",
                                    fontSize: 16,
                                    minWidth: 20,
                                    textAlign: "center",
                                  }}
                                >
                                  {formData.currency === "IDR" ? "Rp" : "$"}
                                </Typography>
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "background.paper",
                                "&:hover": {
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "primary.main",
                                    borderWidth: 2,
                                  },
                                },
                                "&.Mui-focused": {
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "primary.main",
                                    borderWidth: 2,
                                  },
                                  boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
                                },
                              },
                            }}
                          />
                        )}
                        renderOption={(props, option) => {
                          const { key, ...otherProps } = props;
                          return (
                            <Box
                              component="li"
                              key={key}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                py: 1.5,
                                px: 2,
                                borderRadius: 1,
                              }}
                              {...otherProps}
                            >
                              <Typography
                                sx={{
                                  fontSize: 18,
                                  fontWeight: 600,
                                  color:
                                    option === "IDR" ? "#1976d2" : "#2e7d32",
                                  minWidth: 32,
                                  textAlign: "center",
                                }}
                              >
                                {option === "IDR" ? "Rp" : "$"}
                              </Typography>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {option === "IDR"
                                    ? "Indonesian Rupiah"
                                    : "US Dollar"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {option === "IDR"
                                    ? "Local Currency"
                                    : "International Currency"}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }}
                        PaperComponent={({ children, ...props }) => (
                          <Paper
                            {...props}
                            sx={{
                              mt: 1,
                              borderRadius: 2,
                              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            {children}
                          </Paper>
                        )}
                      />
                    </Box>
                  </Grid>

                  {/* Invoice Value */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1.5,
                          fontWeight: 600,
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DollarSign
                          sx={{ fontSize: 16, color: "primary.main" }}
                        />
                        Invoice Value *
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "error.main", fontWeight: 500 }}
                        >
                          (Required)
                        </Typography>
                      </Typography>

                      <TextField
                        fullWidth
                        placeholder="Enter invoice amount"
                        value={
                          formData.invoice_value
                            ? Number(formData.invoice_value).toLocaleString(
                                formData.currency === "USD" ? "en-US" : "id-ID"
                              )
                            : ""
                        }
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <Box
                              sx={{
                                width: 32,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mr: 1,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  color:
                                    formData.currency === "IDR"
                                      ? "#1976d2"
                                      : "#2e7d32",
                                  fontSize: 16,
                                }}
                              >
                                {formData.currency === "USD" ? "$" : "Rp"}
                              </Typography>
                            </Box>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "background.paper",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Additional Information Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #fafbfc 0%, #f1f3f4 100%)",
                  transition: "box-shadow 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "1.1rem",
                    }}
                  >
                    <FileText sx={{ mr: 1.5, fontSize: 22 }} />
                    Additional Information
                  </Typography>
                  <Chip
                    size="small"
                    label="Optional"
                    variant="outlined"
                    sx={{
                      borderColor: "primary.light",
                      color: "primary.main",
                      fontWeight: 500,
                      fontSize: "0.7rem",
                      height: 24,
                    }}
                  />
                </Box>

                {/* Description */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Invoice Description"
                  placeholder="Describe the invoice items or services"
                  value={formData.invoice_description}
                  onChange={(e) =>
                    handleChange("invoice_description", e.target.value)
                  }
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "background.paper",
                      transition: "all 0.2s ease",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "text.secondary",
                      "&.Mui-focused": {
                        color: "primary.main",
                      },
                    },
                  }}
                />

                {/* Remarks */}
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Remarks"
                  placeholder="Additional notes or remarks"
                  value={formData.remarks}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "background.paper",
                      transition: "all 0.2s ease",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "text.secondary",
                      "&.Mui-focused": {
                        color: "primary.main",
                      },
                    },
                  }}
                />
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{ p: 3, borderTop: 1, borderColor: "divider", gap: 2 }}
          >
            <Button
              onClick={onClose}
              color="inherit"
              variant="outlined"
              sx={{
                px: 3,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#2563eb",
                px: 4,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "#1d4ed8",
                },
              }}
            >
              Preview Invoice
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Warning Modal */}
      <Dialog
        open={warningModal.open}
        onClose={() =>
          setWarningModal({ open: false, message: "", onConfirm: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "warning.main",
            borderBottom: 1,
            borderColor: "divider",
            pb: 1.5,
          }}
        >
          ⚠️ Warning
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            {warningModal.message}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: 1, borderColor: "divider", gap: 2 }}
        >
          <Button
            onClick={() =>
              setWarningModal({ open: false, message: "", onConfirm: null })
            }
            color="inherit"
            variant="outlined"
            sx={{
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={warningModal.onConfirm}
            variant="contained"
            color="warning"
            sx={{
              px: 4,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
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
