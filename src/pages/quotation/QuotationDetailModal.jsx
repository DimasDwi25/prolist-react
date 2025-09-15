import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Paper,
  Divider,
  Fade,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import BusinessIcon from "@mui/icons-material/Business";
import HistoryIcon from "@mui/icons-material/History";
import NotesIcon from "@mui/icons-material/Notes";
import api from "../../api/api";

export default function QuotationDetailModal({ open, onClose, quotationId }) {
  const [tabIndex, setTabIndex] = useState(0);
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statusConfig = {
    A: { label: "Completed", color: "success", icon: "✓" },
    D: { label: "No PO Yet", color: "warning", icon: "⏳" },
    E: { label: "Cancelled", color: "error", icon: "❌" },
    F: { label: "Project Lost", color: "default", icon: "⚠️" },
    O: { label: "On Going", color: "info", icon: "🕒" },
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    if (open && quotationId) {
      setLoading(true);
      setError(null);
      setQuotation(null);

      api
        .get(`/quotations/${quotationId}`)
        .then((res) => {
          if (res.data) setQuotation(res.data);
          else setError("No quotation data found");
        })
        .catch(() => setError("Failed to load quotation"))
        .finally(() => setLoading(false));
    }
  }, [open, quotationId]);

  if (!open) return null;

  const InfoBox = ({ label, value, color }) => (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: "grey.50",
        transition: "0.2s",
        "&:hover": { bgcolor: "grey.100" },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.5, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        color={color || "text.primary"}
        fontWeight={500}
        noWrap
      >
        {value ?? "-"}
      </Typography>
    </Paper>
  );

  const renderDetailsTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <InfoBox label="Quotation Number" value={quotation?.no_quotation} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <InfoBox label="Title" value={quotation?.title_quotation} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <InfoBox
          label="Quotation Value"
          value={
            <Typography variant="body1" color="success.main" fontWeight={700}>
              {formatCurrency(quotation?.quotation_value)}
            </Typography>
          }
        />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <InfoBox
          label="Inquiry Date"
          value={formatDate(quotation?.inquiry_date)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <InfoBox
          label="Quotation Date"
          value={formatDate(quotation?.quotation_date)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <InfoBox
          label="Revision Date"
          value={formatDate(quotation?.revision_quotation_date)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <InfoBox
          label="Status"
          value={
            <Chip
              label={`${statusConfig[quotation?.status]?.icon || ""} ${
                statusConfig[quotation?.status]?.label ||
                quotation?.status ||
                "-"
              }`}
              color={statusConfig[quotation?.status]?.color || "default"}
              size="small"
              sx={{ fontWeight: 500 }}
            />
          }
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <InfoBox
          label="Duration"
          value={`${quotation?.quotation_weeks ?? "-"} weeks`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <InfoBox label="Client PIC" value={quotation?.client_pic} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <InfoBox label="Created By" value={quotation?.user?.name || "-"} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <InfoBox label="Revision Count" value={quotation?.revisi} />
      </Grid>
    </Grid>
  );

  const renderClientTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <InfoBox label="Client Name" value={quotation?.client?.name} />
      </Grid>
      <Grid item xs={12} md={6}>
        <InfoBox
          label="Client PIC"
          value={quotation?.client_pic || "Not specified"}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <InfoBox label="Phone" value={quotation?.client?.phone} />
      </Grid>
      <Grid item xs={12} md={6}>
        <InfoBox label="Email" value={quotation?.client?.email} />
      </Grid>
    </Grid>
  );

  const renderHistoryTab = () => (
    <Box>
      {quotation?.history?.length ? (
        quotation.history.map((h, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 1.5,
              mb: 1,
              bgcolor: "grey.50",
              borderRadius: 2,
              "&:hover": { bgcolor: "grey.100" },
            }}
          >
            <Typography variant="body2">{h}</Typography>
          </Paper>
        ))
      ) : (
        <Typography variant="body2" color="text.secondary">
          No history available
        </Typography>
      )}
    </Box>
  );

  const renderNotesTab = () => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: "grey.50",
        borderRadius: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {quotation?.notes || "No notes available"}
      </Typography>
    </Paper>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      TransitionComponent={Fade}
      transitionDuration={400}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: "500px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle sx={{ position: "relative", pb: 1.5 }}>
        <Typography variant="h6" fontWeight={600}>
          Quotation Details
        </Typography>
        {quotation && (
          <Typography variant="body2" color="text.secondary">
            Reference: {quotation.no_quotation || "-"}
          </Typography>
        )}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            bgcolor: "grey.100",
            "&:hover": { bgcolor: "grey.200" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          p: 2,
        }}
      >
        {loading ? (
          <Box
            textAlign="center"
            flex={1}
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <CircularProgress size={40} />
            <Typography mt={2} variant="body2">
              Loading quotation...
            </Typography>
          </Box>
        ) : error ? (
          <Box
            textAlign="center"
            flex={1}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Typography color="error">{error}</Typography>
          </Box>
        ) : quotation ? (
          <Box flex={1} display="flex" flexDirection="column">
            <Tabs
              value={tabIndex}
              onChange={(e, newValue) => setTabIndex(newValue)}
              sx={{
                mb: 2,
                "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
                "& .Mui-selected": { fontWeight: 600 },
              }}
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab icon={<InfoIcon />} iconPosition="start" label="Details" />
              <Tab
                icon={<BusinessIcon />}
                iconPosition="start"
                label="Client"
              />
              <Tab
                icon={<HistoryIcon />}
                iconPosition="start"
                label="History"
              />
              {quotation.notes && (
                <Tab icon={<NotesIcon />} iconPosition="start" label="Notes" />
              )}
            </Tabs>

            <Divider sx={{ mb: 2 }} />

            <Box flex={1}>
              {tabIndex === 0 && renderDetailsTab()}
              {tabIndex === 1 && renderClientTab()}
              {tabIndex === 2 && renderHistoryTab()}
              {tabIndex === 3 && quotation.notes && renderNotesTab()}
            </Box>
          </Box>
        ) : (
          <Box
            textAlign="center"
            flex={1}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Typography>No quotation data available.</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
