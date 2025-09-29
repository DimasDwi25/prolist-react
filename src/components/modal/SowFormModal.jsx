import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import api from "../../api/api";
import { sortOptions } from "../../helper/SortOptions";

const SowFormModal = ({ open, handleClose, handleSave, projectId }) => {
  const [formData, setFormData] = useState({
    project_id: projectId || "",
    work_details: "",
    pic: null,
    target_finish_date: "",
    start_date: "",
    finish_date: "",
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch users for handover dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users"); // pastikan endpoint tersedia
        setUsers(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = {
        project_id: formData.project_id,
        work_details: formData.work_details,
        pic: formData.pic ? formData.pic.id : null,
        target_finish_date: formData.target_finish_date || null,
        start_date: formData.start_date || null,
        finish_date: formData.finish_date || null,
      };

      await handleSave(payload);

      setFormData({
        project_id: projectId || "",
        work_details: "",
        pic: null,
        target_finish_date: "",
        start_date: "",
        finish_date: "",
      });
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.2rem" }}>
        Add Scope of Work
      </DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Work Details"
            name="work_details"
            multiline
            rows={3}
            value={formData.work_details}
            onChange={(e) => handleChange("work_details", e.target.value)}
            fullWidth
          />

          <Autocomplete
            options={sortOptions(users, "name")} // ⬅️ sort A–Z by name
            getOptionLabel={(option) => option.name || ""}
            value={formData.pic}
            onChange={(_, newValue) => handleChange("pic", newValue)}
            renderInput={(params) => (
              <TextField {...params} label="PIC (User)" fullWidth />
            )}
          />

          <TextField
            label="Target Finish Date"
            name="target_finish_date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.target_finish_date}
            onChange={(e) => handleChange("target_finish_date", e.target.value)}
          />

          <TextField
            label="Start Date"
            name="start_date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.start_date}
            onChange={(e) => handleChange("start_date", e.target.value)}
          />

          <TextField
            label="Finish Date"
            name="finish_date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.finish_date}
            onChange={(e) => handleChange("finish_date", e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : null}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SowFormModal;
