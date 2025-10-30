import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
} from "@mui/material";
import api from "../../api/api";

const FormRetentionModal = ({
  open,
  onClose,
  retention,
  projects,
  invoices,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    project_id: "",
    retention_due_date: "",
    retention_value: "",
    invoice_id: "",
  });
  const [loading, setLoading] = useState(false);

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
      if (retention) {
        // Update
        await api.put(`/finance/retentions/${retention.id}`, formData);
      } else {
        // Create
        await api.post("/finance/retentions", formData);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {retention ? "Edit Retention" : "Create Retention"}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Project"
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                required
              >
                {projects.map((project) => (
                  <MenuItem key={project.pn_number} value={project.pn_number}>
                    {project.project_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Invoice"
                name="invoice_id"
                value={formData.invoice_id}
                onChange={handleChange}
              >
                {invoices.map((invoice) => (
                  <MenuItem key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Retention Value"
                name="retention_value"
                type="number"
                value={formData.retention_value}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? "Saving..." : retention ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormRetentionModal;
