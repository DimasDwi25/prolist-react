import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  Autocomplete,
} from "@mui/material";
import api from "../../api/api"; // gunakan api instance

export default function FormLogModal({
  open,
  handleClose,
  projectId,
  onLogCreated,
}) {
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    categorie_log_id: "",
    logs: "",
    tgl_logs: new Date().toISOString().split("T")[0],
    need_response: false,
    response_by: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;

    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories-log");
        setCategories(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setUsers(res.data.data);
        console.log(res.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCategories();
    fetchUsers();
  }, [open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "need_response" && !checked ? { response_by: "" } : {}),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = { ...form, project_id: projectId };
      const res = await api.post("/logs", payload); // backend otomatis ambil user login
      onLogCreated(res.data);

      setForm({
        categorie_log_id: "",
        logs: "",
        tgl_logs: new Date().toISOString().split("T")[0],
        need_response: false,
        response_by: "",
      });
      handleClose();
    } catch (err) {
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.5rem" }}>
        Add Project Log
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 1 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
            {errorMsg}
          </Alert>
        )}
        <Stack spacing={3}>
          {/* Category */}
          <Autocomplete
            options={categories}
            getOptionLabel={(option) => option.name || ""}
            value={
              categories.find((cat) => cat.id === form.categorie_log_id) || null
            }
            onChange={(event, newValue) =>
              setForm((prev) => ({
                ...prev,
                categorie_log_id: newValue?.id || "",
              }))
            }
            renderInput={(params) => (
              <TextField {...params} label="Category" required fullWidth />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />

          {/* Date */}
          <TextField
            label="Log Date"
            type="date"
            name="tgl_logs"
            value={form.tgl_logs}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Log Text */}
          <TextField
            label="Log Details"
            name="logs"
            value={form.logs}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
            required
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
          />

          {/* Need Approval */}
          <FormControlLabel
            control={
              <Checkbox
                name="need_response"
                checked={form.need_response}
                onChange={handleChange}
              />
            }
            label="Requires Approval"
          />

          {/* Response User */}
          {form.need_response && (
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option.name || ""}
              value={users.find((u) => u.id === form.response_by) || null}
              onChange={(event, newValue) =>
                setForm((prev) => ({
                  ...prev,
                  response_by: newValue?.id || "",
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign to User"
                  required
                  fullWidth
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          color="secondary"
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ borderRadius: 2, minWidth: 120 }}
        >
          {loading ? <CircularProgress size={24} /> : "Save Log"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
