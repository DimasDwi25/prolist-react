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
  Divider,
  Alert,
} from "@mui/material";
import { Save } from "lucide-react";
import api from "../../api/api";
import LoadingOverlay from "../loading/LoadingOverlay";

const FormHoldingTaxModal = ({ open, onClose, invoiceId, onSave }) => {
  const [formData, setFormData] = useState({
    pph23_rate: "",
    nilai_pph23: "",
    pph42_rate: "",
    nilai_pph42: "",
    no_bukti_potong: "",
    nilai_potongan: "",
    tanggal_wht: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchHoldingTax = async () => {
    if (!invoiceId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/finance/holding-taxes/invoice/${encodeURIComponent(invoiceId)}`
      );
      const data = response.data.data.holding_tax;
      setFormData({
        pph23_rate: data.pph23_rate || "",
        nilai_pph23: data.nilai_pph23 || "",
        pph42_rate: data.pph42_rate || "",
        nilai_pph42: data.nilai_pph42 || "",
        no_bukti_potong: data.no_bukti_potong || "",
        nilai_potongan: data.nilai_potongan || "",
        tanggal_wht: data.tanggal_wht ? data.tanggal_wht.split("T")[0] : "",
      });
    } catch (err) {
      console.error("Failed to fetch holding tax:", err);
      // Initialize empty form for new entry - this is normal
      setFormData({
        pph23_rate: "",
        nilai_pph23: "",
        pph42_rate: "",
        nilai_pph42: "",
        no_bukti_potong: "",
        nilai_potongan: "",
        tanggal_wht: "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && invoiceId) {
      fetchHoldingTax();
    }
  }, [open, invoiceId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Auto-calculate nilai_potongan if not manually set
      if (field === "nilai_pph23" || field === "nilai_pph42") {
        const nilaiPph23 =
          field === "nilai_pph23"
            ? parseFloat(value) || 0
            : parseFloat(newData.nilai_pph23) || 0;
        const nilaiPph42 =
          field === "nilai_pph42"
            ? parseFloat(value) || 0
            : parseFloat(newData.nilai_pph42) || 0;
        const calculatedPotongan = nilaiPph23 + nilaiPph42;

        if (
          !newData.nilai_potongan ||
          newData.nilai_potongan ===
            (
              parseFloat(newData.nilai_pph23 || 0) +
              parseFloat(newData.nilai_pph42 || 0)
            ).toString()
        ) {
          newData.nilai_potongan = calculatedPotongan.toString();
        }
      }

      return newData;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        pph23_rate: formData.pph23_rate
          ? parseFloat(formData.pph23_rate)
          : null,
        nilai_pph23: formData.nilai_pph23
          ? parseFloat(formData.nilai_pph23)
          : null,
        pph42_rate: formData.pph42_rate
          ? parseFloat(formData.pph42_rate)
          : null,
        nilai_pph42: formData.nilai_pph42
          ? parseFloat(formData.nilai_pph42)
          : null,
        no_bukti_potong: formData.no_bukti_potong || null,
        nilai_potongan: formData.nilai_potongan
          ? parseFloat(formData.nilai_potongan)
          : null,
        tanggal_wht: formData.tanggal_wht || null,
      };

      await api.put(
        `/finance/holding-taxes/invoice/${encodeURIComponent(invoiceId)}`,
        payload
      );

      setSuccess(true);
      if (onSave) {
        onSave();
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to save holding tax:", err);
      setError(err.response?.data?.message || "Failed to save holding tax");
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Edit With Holding Tax - Invoice {invoiceId}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: "relative", minHeight: 400 }}>
          <LoadingOverlay loading={loading || saving} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Holding tax updated successfully!
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                PPh 23 Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="PPh 23 Rate (%)"
                    type="number"
                    value={formData.pph23_rate}
                    onChange={(e) =>
                      handleInputChange("pph23_rate", e.target.value)
                    }
                    size="small"
                    inputProps={{ min: 0, max: 1, step: 0.01 }}
                    helperText="Enter rate as decimal (e.g., 0.02 for 2%)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Nilai PPh 23"
                    type="number"
                    value={formData.nilai_pph23}
                    onChange={(e) =>
                      handleInputChange("nilai_pph23", e.target.value)
                    }
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                PPh 42 Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="PPh 42 Rate (%)"
                    type="number"
                    value={formData.pph42_rate}
                    onChange={(e) =>
                      handleInputChange("pph42_rate", e.target.value)
                    }
                    size="small"
                    inputProps={{ min: 0, max: 1, step: 0.01 }}
                    helperText="Enter rate as decimal (e.g., 0.04 for 4%)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Nilai PPh 42"
                    type="number"
                    value={formData.nilai_pph42}
                    onChange={(e) =>
                      handleInputChange("nilai_pph42", e.target.value)
                    }
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="No Bukti Potong"
                    value={formData.no_bukti_potong}
                    onChange={(e) =>
                      handleInputChange("no_bukti_potong", e.target.value)
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Nilai Potongan"
                    type="number"
                    value={formData.nilai_potongan}
                    onChange={(e) =>
                      handleInputChange("nilai_potongan", e.target.value)
                    }
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Auto-calculated from PPh values if not set manually"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Tanggal WHT"
                    type="date"
                    value={formData.tanggal_wht}
                    onChange={(e) =>
                      handleInputChange("tanggal_wht", e.target.value)
                    }
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
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
          disabled={saving || loading}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormHoldingTaxModal;
