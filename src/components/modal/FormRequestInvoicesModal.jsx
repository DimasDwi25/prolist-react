import React, { useState, useEffect } from "react";
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
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Receipt, Building2, User, FileText, Plus, Delete } from "lucide-react";
import api from "../../api/api";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export default function FormRequestInvoicesModal({
  open,
  onClose,
  projectId,
  invoiceData = null,
  onSave,
}) {
  const [formData, setFormData] = useState({
    description: "",
    documents: [],
  });

  const [projectInfo, setProjectInfo] = useState(null);
  const [phcDocuments, setPhcDocuments] = useState([]);
  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const isEditMode = Boolean(invoiceData);

  // Fetch project info and document preparations
  useEffect(() => {
    if (!open) return;

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

    fetchProjectInfo();
  }, [open, projectId]);

  // Fetch PHC documents when project info is loaded
  useEffect(() => {
    if (!projectInfo || !projectInfo.pn_number) return;

    const fetchPhcDocuments = async () => {
      setLoadingDocs(true);
      try {
        const response = await api.get(
          `/request-invoices/${projectInfo.pn_number}/phc-documents`
        );
        setPhcDocuments(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch PHC documents:", error);
        setPhcDocuments([]);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchPhcDocuments();
  }, [projectInfo]);

  // Fetch PDF when selectedDoc changes
  useEffect(() => {
    if (selectedDoc) {
      const fetchPdf = async () => {
        setPdfLoading(true);
        setPdfError(false);
        try {
          const res = await api.get(
            `/document-preparations/${selectedDoc.id}/attachment`,
            {
              responseType: "blob",
            }
          );
          const url = URL.createObjectURL(res.data);
          setPdfUrl(url);
        } catch (err) {
          console.error("Error fetching PDF:", err);
          setPdfError(true);
        } finally {
          setPdfLoading(false);
        }
      };
      fetchPdf();
    }
  }, [selectedDoc]);

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (isEditMode && invoiceData) {
        setFormData({
          description: invoiceData.description || "",
          documents: (invoiceData.documents || []).map((doc) => ({
            document_preparation_id: doc.document_preparation_id,
            notes: doc.notes || "",
          })),
        });
      } else {
        setFormData({
          description: "",
          documents: [],
        });
      }
      setShowPreview(false);
      setPreviewData(null);
    }
  }, [open, isEditMode, invoiceData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          document_preparation_id: null,
          notes: "",
        },
      ],
    }));
  };

  const handleRemoveDocument = (index) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleDocumentChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index ? { ...doc, [field]: value } : doc
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.documents.length) {
      setSnackbar({
        open: true,
        message: "At least one document is required",
        severity: "error",
      });
      return;
    }

    // Check if all documents have required fields
    const invalidDocs = formData.documents.filter(
      (doc) => !doc.document_preparation_id
    );
    if (invalidDocs.length > 0) {
      setSnackbar({
        open: true,
        message: "All documents must have a document preparation selected",
        severity: "error",
      });
      return;
    }

    // Generate preview data
    const preview = {
      request_number: isEditMode
        ? invoiceData?.request_number || "N/A"
        : "RI000000",
      project_id: projectId,
      description: formData.description || "Not specified",
      documents: formData.documents.map((doc) => {
        const phcDoc = phcDocuments.find(
          (pd) => pd.id === doc.document_preparation_id
        );
        return {
          document_preparation: phcDoc ? phcDoc.document_name : "Unknown",
          notes: doc.notes || "Not specified",
        };
      }),
    };

    setPreviewData(preview);
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        project_id: projectId,
        description: formData.description || null,
        documents: formData.documents.map((doc) => ({
          document_preparation_id: doc.document_preparation_id,
          notes: doc.notes || null,
        })),
      };

      if (isEditMode) {
        await api.put(`/request-invoices/${invoiceData.id}`, payload);
      } else {
        await api.post("/request-invoices", payload);
      }

      // Note: File uploads are handled separately after invoice creation

      setSnackbar({
        open: true,
        message: `Request Invoice ${
          isEditMode ? "updated" : "created"
        } successfully!`,
        severity: "success",
      });

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save request invoice:", error);
      setSnackbar({
        open: true,
        message: "Failed to save request invoice. Please try again.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
      setShowPreview(false);
    }
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
                Request Invoice Preview
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                Review your request invoice details before{" "}
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
                  {previewData.request_number}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Request Invoice {isEditMode ? "Update" : "Creation"}
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
                  <FileText sx={{ fontSize: 20, opacity: 0.8 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, display: "block" }}
                    >
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {previewData.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Documents Section */}
          <Paper
            elevation={1}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <FileText sx={{ mr: 1.5, color: "info.main", fontSize: 22 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "info.main" }}
              >
                Documents ({previewData.documents.length})
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {previewData.documents.map((doc, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "primary.main", mb: 1 }}
                  >
                    Document {index + 1}: {doc.document_preparation}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Document Preparation:
                      </Typography>
                      <Typography variant="body2">
                        {doc.document_preparation}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Notes:
                      </Typography>
                      <Typography variant="body2">{doc.notes}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          </Paper>
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
            {isEditMode ? "Edit Request Invoice" : "Create New Request Invoice"}
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
                    <Grid size={{ xs: 12, md: 4 }}>
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
                    <Grid size={{ xs: 12, md: 4 }}>
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
                    <Grid size={{ xs: 12, md: 4 }}>
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

              {/* Request Invoice Details Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
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
                  Request Invoice Details
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  placeholder="Describe the request invoice purpose"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  sx={{
                    mb: 3,
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

                {/* Documents Section */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
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
                      Documents
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Plus size={16} />}
                      onClick={handleAddDocument}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                      }}
                    >
                      Add Document
                    </Button>
                  </Box>

                  {formData.documents.map((doc, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          Document {index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveDocument(index)}
                        >
                          <Delete size={16} />
                        </IconButton>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Autocomplete
                            fullWidth
                            options={phcDocuments}
                            getOptionLabel={(option) =>
                              option.document_name || ""
                            }
                            value={
                              phcDocuments.find(
                                (pd) => pd.id === doc.document_preparation_id
                              ) || null
                            }
                            onChange={(e, newValue) =>
                              handleDocumentChange(
                                index,
                                "document_preparation_id",
                                newValue ? newValue.id : null
                              )
                            }
                            loading={loadingDocs}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="PHC Document *"
                                required
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {loadingDocs ? (
                                        <CircularProgress
                                          color="inherit"
                                          size={20}
                                        />
                                      ) : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
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
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    py: 1.5,
                                    px: 2,
                                    borderRadius: 1,
                                    backgroundColor: "background.paper",
                                    "&:hover": {
                                      backgroundColor: "action.hover",
                                    },
                                  }}
                                  {...otherProps}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                    }}
                                  >
                                    {option.document_name}
                                  </Typography>
                                  <Box
                                    sx={{ display: "flex", gap: 2, mt: 0.5 }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary" }}
                                    >
                                      Date Prepared:{" "}
                                      {option.date_prepared || "N/A"}
                                    </Typography>
                                    {option.attachment_path && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "primary.main",
                                          fontWeight: 500,
                                        }}
                                      >
                                        📎 Has Attachment
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              );
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Notes"
                            placeholder="Additional notes"
                            value={doc.notes}
                            onChange={(e) =>
                              handleDocumentChange(
                                index,
                                "notes",
                                e.target.value
                              )
                            }
                          />
                        </Grid>
                      </Grid>

                      {/* Document Preview Section */}
                      {doc.document_preparation_id && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                          }}
                        >
                          {(() => {
                            const selectedDoc = phcDocuments.find(
                              (pd) => pd.id === doc.document_preparation_id
                            );
                            return selectedDoc ? (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 600,
                                    mb: 1,
                                    color: "primary.main",
                                  }}
                                >
                                  📄 Document Information
                                </Typography>
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Date Prepared:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      {selectedDoc.date_prepared ||
                                        "Not specified"}
                                    </Typography>
                                  </Grid>
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Status:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      {selectedDoc.attachment_path
                                        ? "Document Available"
                                        : "No document uploaded"}
                                    </Typography>
                                  </Grid>
                                </Grid>
                                {selectedDoc.attachment_path ? (
                                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={async () => {
                                        try {
                                          const res = await api.get(
                                            `/document-preparations/${selectedDoc.id}/attachment`,
                                            {
                                              responseType: "blob",
                                            }
                                          );
                                          const url = URL.createObjectURL(
                                            res.data
                                          );
                                          const link =
                                            document.createElement("a");
                                          link.href = url;
                                          link.download = `${selectedDoc.document_name}.pdf`;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                          URL.revokeObjectURL(url);
                                        } catch (err) {
                                          console.error(
                                            "Error downloading PDF:",
                                            err
                                          );
                                        }
                                      }}
                                      sx={{
                                        textTransform: "none",
                                        borderRadius: 2,
                                      }}
                                    >
                                      📥 Download Document
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => {
                                        // Open document in modal for viewing (same as ViewPhcModal)
                                        setSelectedDoc(selectedDoc);
                                        setOpenPdfModal(true);
                                      }}
                                      sx={{
                                        textTransform: "none",
                                        borderRadius: 2,
                                      }}
                                    >
                                      👁️ View Document
                                    </Button>
                                  </Box>
                                ) : (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      No document available for download
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            ) : null;
                          })()}
                        </Box>
                      )}
                    </Paper>
                  ))}

                  {formData.documents.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No documents added yet. Click "Add Document" to get
                        started.
                      </Typography>
                    </Box>
                  )}
                </Box>
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
              Preview Request Invoice
            </Button>
          </DialogActions>
        </form>
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

      {/* PDF Modal */}
      <Dialog
        open={openPdfModal}
        onClose={() => {
          setOpenPdfModal(false);
          setSelectedDoc(null);
          setPdfUrl("");
          setPdfError(false);
        }}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          📄 View Document: {selectedDoc?.document_name}
          <IconButton
            aria-label="close"
            onClick={() => {
              setOpenPdfModal(false);
              setSelectedDoc(null);
              setPdfUrl("");
              setPdfError(false);
            }}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {pdfLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 400,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {pdfError && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: 400,
              }}
            >
              <Typography variant="h6" color="error">
                Error loading PDF
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unable to load the document. Please try again later.
              </Typography>
            </Box>
          )}
          {!pdfLoading && !pdfError && pdfUrl && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={() => setPdfLoading(false)}
                onLoadError={() => setPdfError(true)}
                loading={<CircularProgress />}
              >
                <Page pageNumber={1} />
              </Document>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenPdfModal(false);
              setSelectedDoc(null);
              setPdfUrl("");
              setPdfError(false);
            }}
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
