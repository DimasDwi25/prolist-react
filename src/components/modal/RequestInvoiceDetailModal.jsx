import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Receipt,
  Building2,
  User,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import api from "../../api/api";
import { formatDate } from "../../utils/FormatDate";
import { getUser } from "../../utils/storage";
import ViewInvoicesModal from "./ViewInvoicesModal";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export default function RequestInvoiceDetailModal({
  open,
  onClose,
  invoiceId,
  refreshCallback,
}) {
  const user = getUser();
  const isFinanceRole =
    user?.role?.name === "acc_fin_manager" ||
    user?.role?.name === "acc_fin_supervisor" ||
    user?.role?.name === "finance_administration";

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
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
  const [openInvoicesModal, setOpenInvoicesModal] = useState(false);
  const [openPinModal, setOpenPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceDetails();
    }
  }, [open, invoiceId]);

  useEffect(() => {
    if (selectedDoc) {
      const fetchPdf = async () => {
        setPdfLoading(true);
        setPdfError(false);
        try {
          const res = await api.get(
            `/document-preparations/${selectedDoc.document_preparation_id}/attachment`,
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

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/request-invoices-list/${invoiceId}`);
      setInvoice(response.data?.data || null);
    } catch (error) {
      console.error("Failed to fetch request invoice details:", error);
      setSnackbar({
        open: true,
        message: "Failed to load request invoice details",
        severity: "error",
      });
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!pin.trim()) {
      setPinError("PIN is required");
      return;
    }
    setApproving(true);
    setPinError("");
    try {
      const response = await api.post(
        `/request-invoices-list/${invoiceId}/approve`,
        {
          pin: pin,
        }
      );
      setSnackbar({
        open: true,
        message:
          response.data.message || "Request invoice approved successfully",
        severity: "success",
      });
      setOpenPinModal(false);
      setPin("");
      // Update the invoice status locally first for immediate UI feedback
      setInvoice((prev) => (prev ? { ...prev, status: "approved" } : prev));
      // Call refresh callback to update the table status immediately
      if (refreshCallback) {
        refreshCallback();
      }
      // Refresh the invoice details to ensure consistency
      fetchInvoiceDetails();
    } catch (error) {
      console.error("Failed to approve request invoice:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to approve request invoice";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      if (errorMessage.includes("PIN")) {
        setPinError(errorMessage);
      }
    } finally {
      setApproving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
      default:
        return "warning";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} />;
      case "rejected":
        return <XCircle size={16} />;
      case "pending":
      default:
        return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Request Invoice Details</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Request invoice not found
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
            pb: 2,
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Receipt sx={{ fontSize: 28, color: "primary.main" }} />
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                Request Invoice Details
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                {invoice.request_number}
              </Typography>
            </Box>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
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
                  {invoice.request_number}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Request Invoice Details
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(invoice.status)}
                label={
                  invoice.status
                    ? invoice.status.charAt(0).toUpperCase() +
                      invoice.status.slice(1)
                    : "Unknown"
                }
                color={getStatusColor(invoice.status)}
                sx={{
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
                      {invoice.project?.pn_number || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Calendar sx={{ fontSize: 20, opacity: 0.8 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, display: "block" }}
                    >
                      Created Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatDate(invoice.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
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
                      {invoice.description || "No description provided"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Project Information Section */}
          <Paper
            elevation={1}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
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

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FileText sx={{ color: "text.secondary", fontSize: 16 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Project Number
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {invoice.project?.project_number || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                      {invoice.project?.quotation?.client?.name ||
                        invoice.project?.client?.name ||
                        "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FileText sx={{ color: "text.secondary", fontSize: 16 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      PO Number
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {invoice.project?.po_number || "N/A"}
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
                Documents ({invoice.documents?.length || 0})
              </Typography>
            </Box>

            {invoice.documents && invoice.documents.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {invoice.documents.map((doc, index) => (
                  <Paper
                    key={doc.id || index}
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
                      Document {index + 1}:{" "}
                      {doc.document_preparation?.name ||
                        `${doc.document_preparation.document.name}`}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          Attached File:
                        </Typography>
                        <Typography variant="body2">
                          {doc.document_preparation?.attachment_path
                            ? "Yes"
                            : "No"}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          Notes:
                        </Typography>
                        <Typography variant="body2">
                          {doc.notes || "Not specified"}
                        </Typography>
                      </Grid>
                    </Grid>
                    {doc.document_preparation?.attachment_path && (
                      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setOpenPdfModal(true);
                          }}
                          sx={{
                            textTransform: "none",
                            borderRadius: 2,
                          }}
                        >
                          👁️ View Document
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={async () => {
                            try {
                              const res = await api.get(
                                `/document-preparations/${doc.document_preparation_id}/attachment`,
                                {
                                  responseType: "blob",
                                }
                              );
                              const url = URL.createObjectURL(res.data);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `${
                                doc.document_preparation?.name ||
                                `Document Preparation ID: ${doc.document_preparation_id}`
                              }.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            } catch (err) {
                              console.error("Error downloading PDF:", err);
                            }
                          }}
                          sx={{
                            textTransform: "none",
                            borderRadius: 2,
                          }}
                        >
                          📥 Download Document
                        </Button>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No documents available for this request invoice.
                </Typography>
              </Box>
            )}
          </Paper>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            borderTop: 1,
            borderColor: "divider",
            gap: 2,
            bgcolor: "grey.50",
            justifyContent: isFinanceRole ? "space-between" : "flex-end",
          }}
        >
          {isFinanceRole && (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                sx={{
                  px: 3,
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                }}
                onClick={() => setOpenPinModal(true)}
                disabled={invoice.status !== "pending"}
              >
                Accept
              </Button>
              <Button
                variant="contained"
                color="primary"
                sx={{
                  px: 3,
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                }}
                onClick={() => {
                  setOpenInvoicesModal(true);
                }}
              >
                Create Invoice
              </Button>
            </Box>
          )}
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
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Invoices Modal */}
      <ViewInvoicesModal
        open={openInvoicesModal}
        onClose={() => setOpenInvoicesModal(false)}
        projectId={invoice?.project?.pn_number}
        year={new Date().getFullYear()}
      />

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

      {/* PIN Modal */}
      <Dialog
        open={openPinModal}
        onClose={() => {
          setOpenPinModal(false);
          setPin("");
          setPinError("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
            pb: 2,
          }}
        >
          Enter PIN to Approve
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please enter your PIN to approve this request invoice.
          </Typography>
          <TextField
            label="PIN"
            type="password"
            fullWidth
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            error={!!pinError}
            helperText={pinError}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            borderTop: 1,
            borderColor: "divider",
            gap: 2,
            bgcolor: "grey.50",
          }}
        >
          <Button
            onClick={() => {
              setOpenPinModal(false);
              setPin("");
              setPinError("");
            }}
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
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={approving}
            sx={{
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            {approving ? <CircularProgress size={20} /> : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>

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
          📄 View Document: {selectedDoc?.document_preparation?.name}
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
