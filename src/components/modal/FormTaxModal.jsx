import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  Alert,
} from "@mui/material";
import { Save } from "lucide-react";
import LoadingOverlay from "../loading/LoadingOverlay";

const FormTaxModal = ({ open, onClose, onSubmit, tax, mode }) => {
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && tax) {
        setFormData({
          name: tax.name || "",
          rate: tax.rate || "",
        });
      } else {
        setFormData({
          name: "",
          rate: "",
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [open, mode, tax]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (formData.name.length > 255) {
      setError("Name must be less than 255 characters");
      return false;
    }
    if (formData.rate === "" || isNaN(formData.rate)) {
      setError("Rate is required and must be a number");
      return false;
    }
    const rate = parseFloat(formData.rate);
    if (rate < 0 || rate > 100) {
      setError("Rate must be between 0 and 100");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        name: formData.name.trim(),
        rate: parseFloat(formData.rate),
      };

      await onSubmit(payload);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to save tax:", err);
      setError(err.response?.data?.message || "Failed to save tax");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {mode === "create" ? "Create Tax" : "Edit Tax"}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: "relative", minHeight: 200 }}>
          <LoadingOverlay loading={saving} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Tax {mode === "create" ? "created" : "updated"} successfully!
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tax Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                size="small"
                required
                inputProps={{ maxLength: 255 }}
                helperText={`${formData.name.length}/255 characters`}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rate (%)"
                type="number"
                value={formData.rate}
                onChange={(e) => handleInputChange("rate", e.target.value)}
                size="small"
                required
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                helperText="Enter rate as percentage (0-100)"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary" disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save size={16} />}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormTaxModal;
