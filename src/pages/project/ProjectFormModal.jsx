import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Stack,
  Typography,
  Box,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import api from "../../api/api";

import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import ReceiptIcon from "@mui/icons-material/Receipt";
import EngineeringIcon from "@mui/icons-material/Engineering";

export default function ProjectFormModal({
  open,
  onClose,
  clients = [],
  quotations = [],
  projects = [],
  categories = [],
  token,
  onSave,
}) {
  const [form, setForm] = useState({
    project_name: "",
    client_id: "",
    quotations_id: "",
    project_number: "",
    target_dates: "",
    po_number: "",
    po_date: "",
    po_value: "",
    sales_weeks: "",
    is_confirmation_order: false,
    is_variant_order: false,
    parent_pn_number: "",
    mandays_engineer: "",
    mandays_technician: "",
    useDifferentClient: false,
  });

  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);

  const prevPoDate = useRef("");

  const memoClients = useMemo(() => clients, [clients]);
  const memoQuotations = useMemo(() => quotations, [quotations]);
  const memoProjects = useMemo(() => projects, [projects]);
  const memoCategories = useMemo(() => categories, [categories]);

  // Tambah state
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // Memo filter quotation by client_id dan status A/D
  const filteredQuotations = useMemo(() => {
    let data = memoQuotations;

    // Filter hanya status A atau D
    data = data.filter((q) => ["A", "D"].includes(q.status));

    // Filter by client_id jika ada
    if (form.client_id) {
      data = data.filter((q) => String(q.client_id) === String(form.client_id));
    }

    return data;
  }, [form.client_id, memoQuotations]);

  // --- Generate Project Number if Confirmation Order ---
  useEffect(() => {
    let mounted = true;

    api
      .get("/projects/generate-number", {
        params: { is_co: form.is_confirmation_order },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!mounted) return;

        const { project_number, pn_number } = res.data.data; // ✅ ambil dari data
        setForm((prev) => ({
          ...prev,
          project_number,
          pn_number, // kalau mau simpan juga di state
        }));
      })
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, [open, form.is_confirmation_order, token]);

  // --- Hitung Sales Week dari PO Date ---
  useEffect(() => {
    if (!form.po_date || prevPoDate.current === form.po_date) return;
    prevPoDate.current = form.po_date;

    const date = new Date(form.po_date);
    const week = Math.ceil(
      ((date - new Date(date.getFullYear(), 0, 1)) / 86400000 +
        new Date(date.getFullYear(), 0, 1).getDay() +
        1) /
        7
    );
    const newSalesWeek = `${date.getFullYear()}-W${week}`;

    setForm((prev) => ({ ...prev, sales_weeks: newSalesWeek }));
  }, [form.po_date]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCurrencyChange = (value) =>
    setForm((prev) => ({ ...prev, po_value: value.replace(/[^0-9]/g, "") }));

  const formatCurrency = (value) =>
    value
      ? new Intl.NumberFormat("id-ID").format(
          value.toString().replace(/[^0-9]/g, "")
        )
      : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerErrors([]);

    const newErrors = {};
    if (!form.project_name) newErrors.project_name = "Project name is required";
    if (!selectedQuotation) newErrors.quotations_id = "Quotation is required";
    if (form.useDifferentClient && !form.client_id)
      newErrors.client_id = "Client is required when overriding";
    if (!form.po_number) newErrors.po_number = "PO Number is required";
    if (!form.po_date) newErrors.po_date = "PO Date is required";
    if (!form.po_value) newErrors.po_value = "PO Value is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const payload = {
        ...form,
        quotations_id: selectedQuotation.quotation_number,
        client_id: form.useDifferentClient
          ? form.client_id // override dipakai
          : null,
      };

      const res = await api.post("/projects", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSave?.(res.data);
      onClose();
    } catch (err) {
      if (err.response?.data?.errors) {
        const apiErrors = Object.values(err.response.data.errors).flat();
        setServerErrors(apiErrors);
      } else if (err.response?.data?.message) {
        setServerErrors([err.response.data.message]);
      } else {
        setServerErrors(["Failed to save project. Please try again."]);
      }
      console.error("Submit Project Error:", err);
    }
  };

  const selectedClient = useMemo(
    () => memoClients.find((c) => c.id === form.client_id) || null,
    [memoClients, form.client_id]
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <form onSubmit={handleSubmit}>
        {/* Header */}
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
          Create New Project
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Fill in the form below to create a new project
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          {/* Error Display */}
          {serverErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <List dense>
                {serverErrors.map((error, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 20, color: "error.main" }}>
                      •
                    </ListItemIcon>
                    <ListItemText
                      primaryTypographyProps={{ fontSize: 13 }}
                      primary={error}
                    />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 3,
              }}
            >
              {/* Project Info */}
              <Box
                sx={{
                  backgroundColor: "#f9fafb",
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "text.primary",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 600,
                  }}
                >
                  <BusinessIcon
                    sx={{ mr: 1, fontSize: 18, color: "primary.main" }}
                  />
                  Project Info
                </Typography>

                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    {/* Client */}
                    <Autocomplete
                      size="small"
                      fullWidth
                      options={memoClients}
                      getOptionLabel={(option) => option.name || ""}
                      value={selectedClient}
                      onChange={(e, newVal) =>
                        handleChange("client_id", newVal ? newVal.id : "")
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Client *"
                          placeholder="Search client..."
                          error={!!errors.client_id}
                          helperText={errors.client_id}
                          fullWidth
                        />
                      )}
                    />

                    {/* Quotation */}
                    <Autocomplete
                      size="small"
                      fullWidth
                      options={filteredQuotations}
                      getOptionLabel={(option) => option.no_quotation || ""}
                      value={selectedQuotation || null}
                      onChange={(e, newVal) => {
                        setSelectedQuotation(newVal);
                        handleChange("quotations_id", newVal ? newVal.id : "");
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Quotation *"
                          placeholder="Search quotation..."
                          error={!!errors.quotations_id}
                          helperText={errors.quotations_id}
                          fullWidth
                        />
                      )}
                    />
                  </Stack>

                  {/* Badge info */}
                  {selectedClient && (
                    <Chip
                      label={`Filtered by client: ${selectedClient.name}`}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ fontSize: "0.75rem" }}
                    />
                  )}

                  {/* Quotation Detail */}
                  {selectedQuotation && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "#fafafa",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Quotation Detail
                      </Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          <strong>Client:</strong>{" "}
                          {selectedQuotation.client?.name || "-"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Value:</strong> Rp{" "}
                          {new Intl.NumberFormat("id-ID").format(
                            selectedQuotation.quotation_value || 0
                          )}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Date:</strong>{" "}
                          {new Date(
                            selectedQuotation.quotation_date
                          ).toLocaleDateString("id-ID")}
                        </Typography>
                      </Stack>
                    </Paper>
                  )}

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.useDifferentClient || false}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            useDifferentClient: e.target.checked,
                            client_id: e.target.checked
                              ? ""
                              : selectedQuotation?.client_id || "",
                          }))
                        }
                      />
                    }
                    label="Use Different Client"
                  />

                  {form.useDifferentClient && (
                    <Autocomplete
                      size="small"
                      options={memoClients}
                      getOptionLabel={(option) => option.name || ""}
                      value={
                        form.client_id
                          ? memoClients.find((c) => c.id === form.client_id) ||
                            null
                          : null
                      }
                      onChange={(e, newVal) =>
                        handleChange("client_id", newVal ? newVal.id : "")
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Client *"
                          placeholder="Select different client"
                          error={!!errors.client_id}
                          helperText={errors.client_id}
                          fullWidth
                        />
                      )}
                    />
                  )}

                  <Stack direction="row" spacing={2}>
                    <TextField
                      size="small"
                      label="Project Name *"
                      placeholder="e.g. Network Upgrade for Bank XYZ"
                      value={form.project_name}
                      onChange={(e) =>
                        handleChange("project_name", e.target.value)
                      }
                      error={!!errors.project_name}
                      helperText={errors.project_name}
                      fullWidth
                    />

                    <Autocomplete
                      size="small"
                      fullWidth
                      options={memoCategories}
                      getOptionLabel={(option) => option.name || ""}
                      value={
                        form.categories_project_id
                          ? memoCategories.find(
                              (c) => c.id === form.categories_project_id
                            ) || null
                          : null
                      }
                      onChange={(e, newVal) =>
                        handleChange(
                          "categories_project_id",
                          newVal ? newVal.id : ""
                        )
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Project Category *"
                          placeholder="Select project category"
                          error={!!errors.categories_project_id}
                          helperText={errors.categories_project_id}
                          fullWidth
                        />
                      )}
                    />
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <TextField
                      size="small"
                      label="Project Number"
                      value={form.project_number}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />

                    <TextField
                      size="small"
                      label="Target Completion Date"
                      type="date"
                      value={form.target_dates}
                      onChange={(e) =>
                        handleChange("target_dates", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Stack>
                </Stack>
              </Box>

              {/* Purchase Order */}
              <Box
                sx={{
                  backgroundColor: "#fdfdfd",
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "text.primary",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 600,
                  }}
                >
                  <ReceiptIcon
                    sx={{ mr: 1, fontSize: 18, color: "secondary.main" }}
                  />
                  Purchase Order
                </Typography>

                <Stack direction="row" spacing={2}>
                  <TextField
                    size="small"
                    label="PO Number *"
                    value={form.po_number}
                    onChange={(e) => handleChange("po_number", e.target.value)}
                    error={!!errors.po_number}
                    helperText={errors.po_number}
                    fullWidth
                  />

                  <TextField
                    size="small"
                    label="PO Date *"
                    type="date"
                    value={form.po_date}
                    onChange={(e) => handleChange("po_date", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.po_date}
                    helperText={errors.po_date}
                    fullWidth
                  />
                </Stack>
                <Stack direction="row" spacing={2} mt={4}>
                  <TextField
                    size="small"
                    label="PO Value (IDR) *"
                    value={formatCurrency(form.po_value)}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    error={!!errors.po_value}
                    helperText={errors.po_value}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">Rp</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    size="small"
                    label="Sales Week"
                    value={form.sales_weeks}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Stack>
              </Box>

              {/* Options */}
              <Box
                sx={{
                  backgroundColor: "#fafafa",
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 600,
                  }}
                >
                  <SettingsIcon
                    sx={{ mr: 1, fontSize: 18, color: "warning.main" }}
                  />
                  Options
                </Typography>

                <Stack direction="row" spacing={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.is_confirmation_order}
                        onChange={(e) =>
                          handleChange(
                            "is_confirmation_order",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Confirmation Order"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.is_variant_order}
                        onChange={(e) =>
                          handleChange("is_variant_order", e.target.checked)
                        }
                      />
                    }
                    label="Variant Order"
                  />
                </Stack>

                {form.is_variant_order && (
                  <Autocomplete
                    size="small"
                    options={memoProjects}
                    getOptionLabel={(option) => option.project_number}
                    value={
                      form.parent_pn_number
                        ? memoProjects.find(
                            (p) => p.project_number === form.parent_pn_number
                          ) || null
                        : null
                    }
                    onChange={(e, newVal) =>
                      handleChange(
                        "parent_pn_number",
                        newVal ? newVal.project_number : ""
                      )
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Parent Project Number"
                        fullWidth
                      />
                    )}
                  />
                )}
              </Box>

              {/* Mandays */}
              <Box
                sx={{
                  backgroundColor: "#f9fdf9",
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 600,
                  }}
                >
                  <EngineeringIcon
                    sx={{ mr: 1, fontSize: 18, color: "success.main" }}
                  />
                  Mandays
                </Typography>

                <Stack direction="row" spacing={2}>
                  <TextField
                    size="small"
                    label="Mandays Engineer"
                    type="number"
                    value={form.mandays_engineer}
                    onChange={(e) =>
                      handleChange("mandays_engineer", e.target.value)
                    }
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Mandays Technician"
                    type="number"
                    value={form.mandays_technician}
                    onChange={(e) =>
                      handleChange("mandays_technician", e.target.value)
                    }
                    fullWidth
                  />
                </Stack>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        {/* Footer */}
        <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
          <Button
            onClick={onClose}
            color="error"
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{
              bgcolor: "#2563eb",
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              transition: "all 0.2s",
              "&:hover": { bgcolor: "#1d4ed8", transform: "translateY(-1px)" },
            }}
          >
            Create Project
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
