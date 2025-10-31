import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Grid,
  Box,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  AccountCircle,
  Business,
  MonetizationOn,
  Receipt,
  CalendarToday,
  AttachMoney,
} from "@mui/icons-material";
import api from "../../api/api";
import { getClientName } from "../../utils/getClientName";
import { formatValue } from "../../utils/formatValue";

const FormRetentionModal = ({ open, onClose, retention, projects, onSave }) => {
  const [formData, setFormData] = useState({
    project_id: "",
    retention_due_date: "",
    retention_value: "",
    invoice_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [projectInvoices, setProjectInvoices] = useState([]);

  useEffect(() => {
    if (retention) {
      setFormData({
        project_id: retention.project_id || "",
        retention_due_date: retention.retention_due_date || "",
        retention_value: retention.retention_value || "",
        invoice_id: retention.invoice_id || "",
      });
    } else {
      setFormData({
        project_id: "",
        retention_due_date: "",
        retention_value: "",
        invoice_id: "",
      });
    }
  }, [retention, open]);

  useEffect(() => {
    if (open && formData.project_id) {
      fetchProjectInvoices();
    }
  }, [open, formData.project_id]);

  const fetchProjectInvoices = async () => {
    if (!formData.project_id) return;

    setLoadingInvoices(true);
    try {
      const response = await api.get("/finance/invoices", {
        params: { project_id: formData.project_id },
      });
      setProjectInvoices(response.data?.invoices || response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch project invoices:", error);
      setProjectInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update only
      await api.put(`/finance/retentions/${retention.id}`, formData);
      onSave();
      onClose();
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(
    (p) => p.pn_number === formData.project_id
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Receipt />
        Edit Retention
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <Business />
            Project Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Project Name"
                value={selectedProject?.project_name || ""}
                InputProps={{ readOnly: true }}
                variant="filled"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Client Name"
                value={getClientName(selectedProject) || ""}
                InputProps={{ readOnly: true }}
                variant="filled"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Project Value"
                value={
                  selectedProject?.po_value
                    ? formatValue(selectedProject.po_value).formatted
                    : ""
                }
                InputProps={{ readOnly: true }}
                variant="filled"
              />
            </Grid>
          </Grid>
        </Box>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <MonetizationOn />
            Retention Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                fullWidth
                options={projectInvoices}
                getOptionLabel={(option) => {
                  if (!option) return "";
                  const invoiceId = option.invoice_id || "";
                  return invoiceId;
                }}
                value={
                  projectInvoices.find(
                    (inv) => inv.invoice_id === formData.invoice_id
                  ) || null
                }
                onChange={(event, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    invoice_id: newValue ? newValue.invoice_id : "",
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Invoice"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: loadingInvoices ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : (
                        <Receipt sx={{ color: "action.active", mr: 1 }} />
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
                      }}
                      {...otherProps}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontFamily: "monospace",
                          color: "text.primary",
                        }}
                      >
                        {option.invoice_number ||
                          option.invoice_id ||
                          option.id}
                      </Typography>
                      {option.invoice_value && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", mt: 0.5 }}
                        >
                          Value: {formatValue(option.invoice_value).formatted}
                        </Typography>
                      )}
                    </Box>
                  );
                }}
                noOptionsText={
                  loadingInvoices
                    ? "Loading invoices..."
                    : projectInvoices.length === 0
                    ? "No invoices available for this project"
                    : "No options"
                }
                disabled={!formData.project_id}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Retention Due Date"
                name="retention_due_date"
                type="date"
                value={formData.retention_due_date}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <CalendarToday sx={{ color: "action.active", mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Retention Value"
                name="retention_value"
                placeholder="Enter retention amount"
                value={
                  formData.retention_value
                    ? Number(formData.retention_value).toLocaleString("id-ID")
                    : ""
                }
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, "");
                  setFormData((prev) => ({
                    ...prev,
                    retention_value: numericValue,
                  }));
                }}
                InputProps={{
                  startAdornment: (
                    <Typography
                      sx={{
                        mr: 1,
                        fontWeight: 600,
                        color: "#1976d2",
                        fontSize: 16,
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      Rp
                    </Typography>
                  ),
                }}
                helperText={
                  formData.retention_value
                    ? formatValue(formData.retention_value).formatted
                    : ""
                }
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
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={<Receipt />}
        >
          {loading ? "Saving..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormRetentionModal;
