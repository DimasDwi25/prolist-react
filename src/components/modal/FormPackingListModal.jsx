import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  MenuItem,
  Autocomplete,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../api/api";

export default function FormPackingListModal({
  open,
  onClose,
  formValues,
  setFormValues,
  onSuccess,
}) {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const projectsRes = await api.get("/projects");
        const usersRes = await api.get("/users");

        setProjects(
          Array.isArray(projectsRes.data)
            ? projectsRes.data
            : projectsRes.data?.data || []
        );
        setUsers(
          Array.isArray(usersRes.data)
            ? usersRes.data
            : usersRes.data?.data || []
        );
      } catch (err) {
        console.error(err);
        setProjects([]);
        setUsers([]);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (field, value) =>
    setFormValues((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post("/packing-lists", formValues);
      onSuccess(res.data.data);
      onClose();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to create packing list");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="600">
          Create New Packing List
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          PL Number: {formValues.pl_number || "-"}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 1 }}>
        Fill in the details below to create a new packing list.
      </Typography>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Project Autocomplete */}
          <Autocomplete
            size="small"
            options={projects || []}
            getOptionLabel={(option) => option.project_number || ""}
            loading={loadingData}
            value={
              projects?.find((p) => p.pn_number === formValues.pn_id) || null
            }
            onChange={(_, newValue) =>
              handleInputChange("pn_id", newValue ? newValue.pn_number : "")
            }
            isOptionEqualToValue={(option, value) =>
              option.pn_number === value?.pn_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Project"
                placeholder="Select project..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingData ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Destination */}
          <TextField
            label="Destination"
            size="small"
            fullWidth
            value={formValues.destination}
            onChange={(e) => handleInputChange("destination", e.target.value)}
          />

          {/* Expedition Name */}
          <TextField
            label="Expedition Name"
            size="small"
            fullWidth
            value={formValues.expedition_name}
            onChange={(e) =>
              handleInputChange("expedition_name", e.target.value)
            }
          />

          {/* Client pic Name */}
          <TextField
            label="Client PIC"
            size="small"
            fullWidth
            value={formValues.client_pic}
            onChange={(e) => handleInputChange("client_pic", e.target.value)}
          />

          {/* PL Date & Ship Date */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="PL Date"
              type="date"
              size="small"
              fullWidth
              value={formValues.pl_date}
              onChange={(e) => handleInputChange("pl_date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 1,
                  backgroundColor: "#fff",
                },
              }}
            />
            <TextField
              label="Ship Date"
              type="date"
              size="small"
              fullWidth
              value={formValues.ship_date}
              onChange={(e) => handleInputChange("ship_date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 1,
                  backgroundColor: "#fff",
                },
              }}
            />
          </Stack>

          {/* PL Type */}
          <TextField
            select
            label="PL Type"
            size="small"
            fullWidth
            value={formValues.pl_type}
            onChange={(e) => handleInputChange("pl_type", e.target.value)}
          >
            <MenuItem value="internal">Internal</MenuItem>
            <MenuItem value="client">Client</MenuItem>
            <MenuItem value="expedition">Expedition</MenuItem>
          </TextField>

          {/* Client PIC Autocomplete */}
          <Autocomplete
            size="small"
            options={users || []}
            getOptionLabel={(option) => option.name || ""}
            loading={loadingData}
            value={users?.find((u) => u.id === formValues.int_pic) || null}
            onChange={(_, newValue) =>
              handleInputChange("int_pic", newValue ? newValue.id : "")
            }
            isOptionEqualToValue={(option, value) =>
              option.id === value?.int_pic
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Internal PIC"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingData ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Receive Date & PL Return Date */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Receive Date"
              type="date"
              size="small"
              fullWidth
              value={formValues.receive_date}
              onChange={(e) =>
                handleInputChange("receive_date", e.target.value)
              }
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 1,
                  backgroundColor: "#fff",
                },
              }}
            />
            <TextField
              label="PL Return Date"
              type="date"
              size="small"
              fullWidth
              value={formValues.pl_return_date}
              onChange={(e) =>
                handleInputChange("pl_return_date", e.target.value)
              }
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 1,
                  backgroundColor: "#fff",
                },
              }}
            />
          </Stack>

          {/* Remark */}
          <TextField
            label="Remark"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={formValues.remark}
            onChange={(e) => handleInputChange("remark", e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Create Packing List"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
