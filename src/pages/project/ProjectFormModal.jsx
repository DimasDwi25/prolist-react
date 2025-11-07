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
  Snackbar,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import api from "../../api/api";
import { sortOptions } from "../../helper/SortOptions";

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
  project = null,
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
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const prevPoDate = useRef("");

  const memoClients = useMemo(
    () => (Array.isArray(clients) ? clients : []),
    [clients]
  );
  const memoQuotations = useMemo(
    () => (Array.isArray(quotations) ? quotations : []),
    [quotations]
  );
  const memoProjects = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects]
  );
  const memoCategories = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories]
  );
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
    if (!open || project) return; // ⛔ skip kalau edit
    let mounted = true;

    api
      .get("/projects/generate-number", {
        params: { is_co: form.is_confirmation_order },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!mounted) return;
        setForm((prev) => ({
          ...prev,
          project_number: res.data.data.project_number,
          pn_number: res.data.data.pn_number,
        }));
      })
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, [open, form.is_confirmation_order, token, project]);

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

  // ✅ isi form saat mode edit
  useEffect(() => {
    console.log("useEffect edit mode triggered:", { project, open });
    console.log("Project details:", {
      pn_number: project?.pn_number,
      project_name: project?.project_name,
      is_confirmation_order: project?.is_confirmation_order,
      hasProject: !!project,
    });
    if (project && open) {
      console.log("=== DEBUG CONFIRMATION ORDER ===");
      console.log(
        "Raw project.is_confirmation_order =",
        project.is_confirmation_order
      );
      console.log(
        "Type of project.is_confirmation_order =",
        typeof project.is_confirmation_order
      );
      console.log(
        "Boolean(project.is_confirmation_order) =",
        Boolean(project.is_confirmation_order)
      );
      console.log(
        "Final conversion result =",
        project.is_confirmation_order === 1 ||
          project.is_confirmation_order === true ||
          project.is_confirmation_order === "1"
      );
      setForm((prev) => ({
        ...prev,
        project_name: project.project_name || "",
        client_id: project.client_id || "",
        quotations_id: project.quotations_id || "",

        project_number: project.project_number || "",
        target_dates: project.target_dates || "",
        po_number: project.po_number || "",
        po_date: project.po_date ? project.po_date.slice(0, 10) : "",
        po_value: project.po_value || "",
        sales_weeks: project.sales_weeks || "",
        is_confirmation_order:
          project.is_confirmation_order === 1 ||
          project.is_confirmation_order === true ||
          project.is_confirmation_order === "1",

        is_variant_order: !!project.is_variant_order,
        parent_pn_number: project.parent_pn_number || "",
        mandays_engineer: project.mandays_engineer || "",
        mandays_technician: project.mandays_technician || "",
        useDifferentClient: !!project.client_id, // jika override client
        categories_project_id:
          project.categories_project_id || project.categories?.id || "",
      }));

      // quotation yg terpilih
      const q = memoQuotations.find(
        (q) => q.quotation_number === project?.quotations_id
      );

      setSelectedQuotation(q || null);

      // Debug: tampilkan nilai form setelah di-set
      console.log("Form values after setting:", {
        is_confirmation_order:
          project.is_confirmation_order === 1 ||
          project.is_confirmation_order === true ||
          project.is_confirmation_order === "1",
        is_variant_order: !!project.is_variant_order,
      });
    } else if (!project && open) {
      // reset saat create
      setForm({
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
        categories_project_id: "",
      });
      setSelectedQuotation(null);
    }
  }, [project, open, quotations]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCurrencyChange = (value) =>
    setForm((prev) => ({ ...prev, po_value: value.replace(/[^0-9]/g, "") }));

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerErrors([]);

    // Prepare preview data
    const preview = {
      project_name: form.project_name,
      client_name:
        selectedClient?.name ||
        selectedQuotation?.client?.name ||
        "Not selected",
      quotation_number: selectedQuotation?.no_quotation || "Not selected",
      project_number: form.project_number,
      target_dates: form.target_dates,
      po_number: form.po_number,
      po_date: form.po_date,
      po_value: form.po_value
        ? `Rp ${Number(form.po_value).toLocaleString("id-ID")}`
        : "",
      sales_weeks: form.sales_weeks,
      is_confirmation_order: form.is_confirmation_order,
      is_variant_order: form.is_variant_order,
      parent_pn_number: form.parent_pn_number,
      mandays_engineer: form.mandays_engineer,
      mandays_technician: form.mandays_technician,
      categories_project_name:
        categories.find(
          (c) => String(c.id) === String(form.categories_project_id)
        )?.name || "Not selected",
    };

    setPreviewData(preview);
    setOpenConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setOpenConfirmation(false);

    console.log("=== SUBMIT DEBUG ===");
    console.log("Form values before submit:", {
      is_confirmation_order: form.is_confirmation_order,
      is_variant_order: form.is_variant_order,
      project: project?.pn_number,
    });

    try {
      const payload = {
        ...form,
        quotations_id:
          selectedQuotation?.quotation_number || form.quotations_id,
        client_id: form.useDifferentClient ? form.client_id : null,
      };

      console.log("Payload to be sent:", {
        is_confirmation_order: payload.is_confirmation_order,
        is_variant_order: payload.is_variant_order,
        project_name: payload.project_name,
      });

      // Debug: tampilkan semua field boolean
      console.log("All boolean fields in payload:", {
        is_confirmation_order: payload.is_confirmation_order,
        is_variant_order: payload.is_variant_order,
        useDifferentClient: payload.useDifferentClient,
      });

      // kalau bukan variant order, hapus parent_pn_number
      if (!form.is_variant_order) {
        delete payload.parent_pn_number;
      }

      let res;
      if (project) {
        // 🔹 update mode
        console.log(
          "Sending PUT request to:",
          `/projects/${project.pn_number}`
        );
        res = await api.put(`/projects/${project.pn_number}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("API Response:", res.data);
      } else {
        // 🔹 create mode
        console.log("Sending POST request to:", `/projects`);
        res = await api.post(`/projects`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("API Response:", res.data);
      }

      onSave?.();
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
          {project ? "Edit Project" : "Create New Project"}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {project
              ? "Update the project details below"
              : "Fill in the form below to create a new project"}
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
                      options={sortOptions(memoClients, "name")}
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

                    <Autocomplete
                      size="small"
                      fullWidth
                      options={sortOptions(filteredQuotations, "no_quotation")}
                      getOptionLabel={(option) => option.no_quotation || ""}
                      isOptionEqualToValue={(option, value) =>
                        String(option.quotation_number) ===
                        String(value.quotation_number)
                      }
                      value={
                        selectedQuotation ||
                        (form.quotations_id
                          ? filteredQuotations.find(
                              (q) =>
                                String(q.quotation_number) ===
                                String(form.quotations_id)
                            ) || null
                          : null)
                      }
                      onChange={(e, newVal) => {
                        setSelectedQuotation(newVal || null);
                        handleChange(
                          "quotations_id",
                          newVal ? newVal.quotation_number : ""
                        );
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
                      options={sortOptions(memoClients, "name")}
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
                      options={sortOptions(memoCategories, "name")}
                      getOptionLabel={(option) => option.name || ""}
                      // 🟢 ini penting → supaya value lama match berdasarkan id
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      value={
                        categories.find(
                          (c) =>
                            String(c.id) === String(form.categories_project_id)
                        ) || null
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
                    value={
                      form.po_value
                        ? Number(form.po_value).toLocaleString("id-ID")
                        : ""
                    }
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">Rp</InputAdornment>
                      ),
                    }}
                    fullWidth
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
                        onChange={(e) => {
                          console.log("Checkbox changed:", e.target.checked);
                          handleChange(
                            "is_confirmation_order",
                            e.target.checked
                          );
                        }}
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
                    options={sortOptions(memoProjects, "project_number")}
                    getOptionLabel={(option) => option.project_number}
                    value={
                      form.parent_pn_number
                        ? memoProjects.find(
                            (p) => p.pn_number === form.parent_pn_number
                          ) || null
                        : null
                    }
                    onChange={(e, newVal) =>
                      handleChange(
                        "parent_pn_number",
                        newVal ? newVal.pn_number : ""
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
            {project ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </form>

      {/* Confirmation Modal */}
      <Dialog
        open={openConfirmation}
        onClose={() => setOpenConfirmation(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
            pb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <BusinessIcon sx={{ fontSize: 24, color: "primary.main" }} />
          Confirm {project ? "Update" : "Create"} Project
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3, px: 4 }}>
          <Typography
            variant="body1"
            sx={{ mb: 3, fontWeight: 600, color: "text.secondary" }}
          >
            Please review the project details below before proceeding:
          </Typography>
          {previewData && (
            <Box sx={{ maxHeight: "60vh", overflowY: "auto" }}>
              {/* Project Information Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <BusinessIcon
                    sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "primary.main" }}
                  >
                    Project Information
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Project Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.project_name || "Not specified"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Client
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.client_name}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Quotation
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.quotation_number}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Project Number
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.project_number || "Auto-generated"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Target Completion Date
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.target_dates
                          ? new Date(
                              previewData.target_dates
                            ).toLocaleDateString("id-ID")
                          : "Not specified"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Project Category
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.categories_project_name}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Purchase Order Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <ReceiptIcon
                    sx={{ mr: 1, color: "secondary.main", fontSize: 20 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "secondary.main" }}
                  >
                    Purchase Order Details
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        PO Number
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.po_number || "Not specified"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        PO Date
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.po_date
                          ? new Date(previewData.po_date).toLocaleDateString(
                              "id-ID"
                            )
                          : "Not specified"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        PO Value
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.po_value || "Not specified"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Sales Week
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.sales_weeks || "Not specified"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Options & Mandays Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <SettingsIcon
                    sx={{ mr: 1, color: "warning.main", fontSize: 20 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "warning.main" }}
                  >
                    Options & Mandays
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Confirmation Order
                      </Typography>
                      <Chip
                        label={previewData.is_confirmation_order ? "Yes" : "No"}
                        color={
                          previewData.is_confirmation_order
                            ? "success"
                            : "default"
                        }
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Variant Order
                      </Typography>
                      <Chip
                        label={previewData.is_variant_order ? "Yes" : "No"}
                        color={
                          previewData.is_variant_order ? "warning" : "default"
                        }
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  {previewData.is_variant_order && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: "text.secondary",
                            mb: 0.5,
                          }}
                        >
                          Parent Project Number
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {previewData.parent_pn_number || "Not specified"}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Mandays Engineer
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.mandays_engineer || "Not specified"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Mandays Technician
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {previewData.mandays_technician || "Not specified"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: 1, borderColor: "divider", gap: 2 }}
        >
          <Button
            onClick={() => setOpenConfirmation(false)}
            color="inherit"
            variant="outlined"
            size="medium"
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
            onClick={handleConfirmSubmit}
            variant="contained"
            size="medium"
            sx={{
              bgcolor: "#2563eb",
              px: 4,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              transition: "all 0.2s",
              "&:hover": { bgcolor: "#1d4ed8", transform: "translateY(-1px)" },
            }}
          >
            Confirm {project ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success notification */}
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
    </Dialog>
  );
}
