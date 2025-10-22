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
} from "@mui/material";
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
import api from "../../api/api";
import { formatDate } from "../../utils/FormatDate";

export default function ViewRequestInvoiceModal({
  open,
  onClose,
  invoiceId,
  invoiceData,
  onDataUpdated,
}) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceDetails();
    }
  }, [open, invoiceId]);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/request-invoices/${invoiceId}`);
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
                      {doc.document_preparation?.name || "Unknown"}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          Attached:
                        </Typography>
                        <Typography variant="body2">
                          {doc.is_attached ? "Yes" : "No"}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          Attachment Path:
                        </Typography>
                        <Typography variant="body2">
                          {doc.attachment_path || "Not specified"}
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
          }}
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
            Close
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
