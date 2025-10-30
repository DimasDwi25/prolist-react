import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  InputAdornment,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Autocomplete,
  Snackbar,
} from "@mui/material";
import api from "../../api/api";
import { sortOptions } from "../../helper/SortOptions";

import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

export default function CreateQuotationDialog({
  open,
  onClose,
  clients,
  onSave,
  token,
}) {
  const [formValues, setFormValues] = useState({
    client_id: "",
    client_pic: "",
    title_quotation: "",
    inquiry_date: "",
    quotation_date: "",
    quotation_weeks: "",
    no_quotation: "",
    month_roman: "",
    quotation_value: "",
  });

  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!open) return;

    const fetchNextNumber = async () => {
      try {
        const res = await api.get("/quotations/next-number", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Next number:", res.data.next_number);
        setFormValues((prev) => ({
          ...prev,
          no_quotation: res.data.next_number,
        }));
      } catch (err) {
        console.error("Error fetching next number:", err.response?.data || err);
      }
    };

    fetchNextNumber();
  }, [open, token]);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (value) => {
    // Hapus semua selain digit
    const rawNumber = value.replace(/[^0-9]/g, "");
    // Simpan angka murni ke state
    setFormValues((prev) => ({
      ...prev,
      quotation_value: rawNumber,
    }));
  };

  const handleDateChange = (field, value) => {
    const date = new Date(value);
    let weeks = "";
    let monthRoman = "";

    if (field === "quotation_date" && !isNaN(date)) {
      const start = new Date(date.getFullYear(), 0, 1);
      const diff = (date - start) / (24 * 60 * 60 * 1000);
      const weekNumber = Math.ceil((diff + start.getDay() + 1) / 7);

      weeks = `${date.getFullYear()}-W${weekNumber}`;

      // Roman month
      const romans = [
        "I",
        "II",
        "III",
        "IV",
        "V",
        "VI",
        "VII",
        "VIII",
        "IX",
        "X",
        "XI",
        "XII",
      ];
      monthRoman = romans[date.getMonth()];
    }

    setFormValues((prev) => ({
      ...prev,
      [field]: value,
      quotation_weeks: weeks || prev.quotation_weeks,
      month_roman: monthRoman || prev.month_roman,
    }));
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    const number = value.toString().replace(/[^0-9]/g, "");
    return new Intl.NumberFormat("id-ID").format(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setErrors({});
    setServerErrors([]);

    // --- 1. Validasi Form ---
    const newErrors = {};
    if (!formValues.client_id) newErrors.client_id = "Client is required";
    if (!formValues.client_pic)
      newErrors.client_pic = "Person in charge is required";
    if (!formValues.title_quotation)
      newErrors.title_quotation = "Project title is required";
    if (!formValues.inquiry_date)
      newErrors.inquiry_date = "Inquiry date is required";
    if (!formValues.quotation_date)
      newErrors.quotation_date = "Quotation date is required";
    if (!formValues.no_quotation)
      newErrors.no_quotation = "Quotation number is required";
    else if (!/^\d{1,3}$/.test(formValues.no_quotation))
      newErrors.no_quotation = "Quotation number must be 1–3 digits";
    if (!formValues.quotation_value)
      newErrors.quotation_value = "Quotation value is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Show preview instead of submitting directly
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      // --- 2. Cek no_quotation, auto-generate jika kosong ---
      let payload = { ...formValues };
      if (!payload.no_quotation) {
        // request API untuk next number
        const res = await api.get("/quotations/next-number", {
          headers: { Authorization: `Bearer ${token}` },
        });
        payload.no_quotation = res.data.next_number;
      }

      const res = await api.post("/quotations", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Kirim hasil API ke parent, bukan payload mentah
      if (onSave) onSave(res.data.quotation);
      setSnackbar({
        open: true,
        message: "Quotation created successfully!",
        severity: "success",
      });
      onClose();
      setShowPreview(false);
    } catch (err) {
      // --- 5. Handle server errors ---
      if (err.response?.data?.errors) {
        const apiErrors = Object.values(err.response.data.errors).flat();
        setServerErrors(apiErrors);
      } else if (err.response?.data?.message) {
        setServerErrors([err.response.data.message]);
      } else {
        setServerErrors(["Failed to save quotation. Please try again."]);
      }
      console.error("Submit Quotation Error:", err);
      setShowPreview(false); // Close preview on error
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <DialogTitle
            sx={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "text.primary",
              borderBottom: 1,
              borderColor: "divider",
              pb: 1.5,
            }}
          >
            Create New Quotation
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Fill in the form below to create a new quotation
            </Typography>
          </DialogTitle>

          {/* Content */}
          <DialogContent dividers sx={{ py: 2.5 }}>
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

            {/* Client Information */}
            <Box
              sx={{
                backgroundColor: "#f9fafb",
                p: 2.5,
                borderRadius: 2,
                mb: 2.5,
                boxShadow: "inset 0 0 0 1px #e5e7eb",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: "text.primary",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 600,
                }}
              >
                <PersonIcon
                  sx={{ mr: 1, fontSize: 20, color: "primary.main" }}
                />
                Client Information
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Autocomplete
                  size="small"
                  options={sortOptions(clients || [], "name")}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    (clients || []).find(
                      (c) => c.id === formValues.client_id
                    ) || null
                  }
                  onChange={(e, newValue) =>
                    handleChange("client_id", newValue ? newValue.id : "")
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

                <TextField
                  size="small"
                  label="Person In Charge *"
                  value={formValues.client_pic}
                  onChange={(e) => handleChange("client_pic", e.target.value)}
                  fullWidth
                  error={!!errors.client_pic}
                  helperText={errors.client_pic}
                  placeholder="e.g. John Doe (Marketing Manager)"
                />
              </Box>
            </Box>

            {/* Quotation Details */}
            <Box
              sx={{
                backgroundColor: "#fdfdfd",
                p: 2.5,
                borderRadius: 2,
                mb: 2.5,
                boxShadow: "inset 0 0 0 1px #e5e7eb",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: "text.primary",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 600,
                }}
              >
                <DescriptionIcon
                  sx={{ mr: 1, fontSize: 20, color: "secondary.main" }}
                />
                Quotation Details
              </Typography>

              <TextField
                size="small"
                label="Project Title *"
                value={formValues.title_quotation}
                onChange={(e) =>
                  handleChange("title_quotation", e.target.value)
                }
                fullWidth
                sx={{ mb: 2 }}
                error={!!errors.title_quotation}
                helperText={errors.title_quotation}
                placeholder="e.g. Electrical Installation for Office Tower"
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                  gap: 2,
                  mb: 2,
                }}
              >
                <TextField
                  size="small"
                  label="Inquiry Date *"
                  type="date"
                  value={formValues.inquiry_date}
                  onChange={(e) => handleChange("inquiry_date", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <TextField
                  size="small"
                  label="Quotation Date *"
                  type="date"
                  value={formValues.quotation_date}
                  onChange={(e) =>
                    handleDateChange("quotation_date", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <TextField
                  size="small"
                  label="Quotation Week"
                  value={formValues.quotation_weeks}
                  fullWidth
                  disabled
                />
              </Box>

              {/* Quotation Number */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    border: 1,
                    borderColor: "grey.300",
                    borderRight: 0,
                    backgroundColor: "grey.50",
                    borderTopLeftRadius: 6,
                    borderBottomLeftRadius: 6,
                    color: "grey.600",
                    fontSize: "0.85rem",
                  }}
                >
                  Q-
                </Box>

                <TextField
                  size="small"
                  name="no_quotation"
                  value={formValues.no_quotation || ""} // ✅ otomatis terisi hasil API
                  onChange={(e) => handleChange("no_quotation", e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 0,
                      "& fieldset": { borderLeft: 0, borderRight: 0 },
                    },
                    "& .MuiInputBase-input": { textAlign: "center" },
                    width: 80,
                  }}
                  inputProps={{
                    pattern: "\\d{1,3}",
                    maxLength: 3,
                  }}
                />

                <Box
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    border: 1,
                    borderColor: "grey.300",
                    borderLeft: 0,
                    backgroundColor: "grey.50",
                    borderTopRightRadius: 6,
                    borderBottomRightRadius: 6,
                    color: "grey.600",
                    fontSize: "0.85rem",
                  }}
                >
                  /{formValues.month_roman}/
                  {formValues.quotation_date
                    ? new Date(formValues.quotation_date)
                        .getFullYear()
                        .toString()
                        .slice(-2)
                    : new Date().getFullYear().toString().slice(-2)}
                </Box>
              </Box>
            </Box>

            {/* Financial Information */}
            <Box
              sx={{
                backgroundColor: "#f9fdf9",
                p: 2.5,
                borderRadius: 2,
                boxShadow: "inset 0 0 0 1px #e5e7eb",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: "text.primary",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 600,
                }}
              >
                <AttachMoneyIcon
                  sx={{ mr: 1, fontSize: 20, color: "success.main" }}
                />
                Financial Information
              </Typography>

              <TextField
                size="small"
                label="Quotation Value (IDR) *"
                value={formatCurrency(formValues.quotation_value)}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Rp</InputAdornment>
                  ),
                }}
              />
            </Box>
          </DialogContent>

          {/* Footer */}
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={onClose}
              color="inherit"
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
                "&:hover": {
                  bgcolor: "#1d4ed8",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Preview
            </Button>
          </DialogActions>
        </form>

        {/* Preview Modal */}
        <Dialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle
            sx={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "text.primary",
              borderBottom: 1,
              borderColor: "divider",
              pb: 1.5,
            }}
          >
            Preview Quotation
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Review the details before creating the quotation
            </Typography>
          </DialogTitle>

          <DialogContent dividers sx={{ py: 2.5 }}>
            {/* Client Information */}
            <Box
              sx={{
                backgroundColor: "#f9fafb",
                p: 2.5,
                borderRadius: 2,
                mb: 2.5,
                boxShadow: "inset 0 0 0 1px #e5e7eb",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: "text.primary",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 600,
                }}
              >
                <PersonIcon
                  sx={{ mr: 1, fontSize: 20, color: "primary.main" }}
                />
                Client Information
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Client
                  </Typography>
                  <Typography variant="body1">
                    {(clients || []).find((c) => c.id === formValues.client_id)
                      ?.name || "N/A"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Person In Charge
                  </Typography>
                  <Typography variant="body1">
                    {formValues.client_pic || "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Quotation Details */}
            <Box
              sx={{
                backgroundColor: "#fdfdfd",
                p: 2.5,
                borderRadius: 2,
                mb: 2.5,
                boxShadow: "inset 0 0 0 1px #e5e7eb",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: "text.primary",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 600,
                }}
              >
                <DescriptionIcon
                  sx={{ mr: 1, fontSize: 20, color: "secondary.main" }}
                />
                Quotation Details
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Project Title
                </Typography>
                <Typography variant="body1">
                  {formValues.title_quotation || "N/A"}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Inquiry Date
                  </Typography>
                  <Typography variant="body1">
                    {formValues.inquiry_date || "N/A"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Quotation Date
                  </Typography>
                  <Typography variant="body1">
                    {formValues.quotation_date || "N/A"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Quotation Week
                  </Typography>
                  <Typography variant="body1">
                    {formValues.quotation_weeks || "N/A"}
                  </Typography>
                </Box>
              </Box>

              {/* Quotation Number */}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Quotation Number
                </Typography>
                <Typography variant="body1">
                  Q-{formValues.no_quotation || "N/A"}/
                  {formValues.month_roman || "N/A"}/
                  {formValues.quotation_date
                    ? new Date(formValues.quotation_date)
                        .getFullYear()
                        .toString()
                        .slice(-2)
                    : new Date().getFullYear().toString().slice(-2)}
                </Typography>
              </Box>
            </Box>

            {/* Financial Information */}
            <Box
              sx={{
                backgroundColor: "#f9fdf9",
                p: 2.5,
                borderRadius: 2,
                boxShadow: "inset 0 0 0 1px #e5e7eb",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: "text.primary",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 600,
                }}
              >
                <AttachMoneyIcon
                  sx={{ mr: 1, fontSize: 20, color: "success.main" }}
                />
                Financial Information
              </Typography>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Quotation Value (IDR)
                </Typography>
                <Typography variant="body1">
                  Rp {formatCurrency(formValues.quotation_value) || "N/A"}
                </Typography>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setShowPreview(false)}
              color="inherit"
              variant="outlined"
              size="small"
            >
              Back to Edit
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              variant="contained"
              size="small"
              sx={{
                bgcolor: "#2563eb",
                px: 3,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "#1d4ed8",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Confirm Create
            </Button>
          </DialogActions>
        </Dialog>
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
    </>
  );
}
