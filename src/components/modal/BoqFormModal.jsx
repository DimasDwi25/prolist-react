import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Stack,
  Box,
  InputAdornment,
} from "@mui/material";

const BoqFormModal = ({ open, handleClose, handleSave }) => {
  // state angka murni
  const [formDataRaw, setFormDataRaw] = useState({
    description: "",
    material_value: 0,
    engineer_value: 0,
  });

  // state tampilan (Rupiah)
  const [formDataDisplay, setFormDataDisplay] = useState({
    description: "",
    material_value: "",
    engineer_value: "",
  });

  // helper format Rupiah
  const formatCurrency = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(value);
  };

  // handle input description biasa
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormDataRaw((prev) => ({ ...prev, [name]: value }));
    setFormDataDisplay((prev) => ({ ...prev, [name]: value }));
  };

  // handle input currency
  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    const numeric = value.replace(/[^0-9]/g, ""); // ambil angka murni

    setFormDataRaw((prev) => ({ ...prev, [name]: Number(numeric) }));
    setFormDataDisplay((prev) => ({
      ...prev,
      [name]: formatCurrency(numeric),
    }));
  };

  const handleSubmit = () => {
    handleSave(formDataRaw); // kirim angka murni
    // reset form
    setFormDataRaw({ description: "", material_value: 0, engineer_value: 0 });
    setFormDataDisplay({
      description: "",
      material_value: "",
      engineer_value: "",
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Add BOQ Item</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formDataDisplay.description}
            onChange={handleChange}
          />
        </Box>
        <Stack direction="row" spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="text"
              label="Material Value (IDR) *"
              name="material_value"
              value={formDataDisplay.material_value}
              onChange={handleCurrencyChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">Rp</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="text"
              label="Engineer Value (IDR) *"
              name="engineer_value"
              value={formDataDisplay.engineer_value}
              onChange={handleCurrencyChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">Rp</InputAdornment>
                ),
              }}
            />
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoqFormModal;
