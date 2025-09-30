import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
} from "@mui/material";
import api from "../../api/api";

const UpdateStatusModal = ({ open, handleClose, project, onStatusUpdated }) => {
  const [allStatus, setAllStatus] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch all status when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await api.get("/status-projects");
        const statusData = res.data || [];
        setAllStatus(statusData);

        // Set selectedStatus only if project has status
        if (project?.status_project?.id) {
          setSelectedStatus(project.status_project.id);
        }
      } catch (err) {
        console.error("Failed to fetch status:", err);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [open, project]);

  const handleStatusChange = async () => {
    try {
      setUpdating(true);
      await api.post(`/engineer/projects/${project.pn_number}/status`, {
        status_project_id: selectedStatus,
      });

      // Lookup status terbaru dari allStatus
      const updatedStatus = allStatus.find((s) => s.id === selectedStatus);

      if (onStatusUpdated) {
        onStatusUpdated(updatedStatus);
      }

      handleClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="update-status-modal"
      aria-describedby="modal-to-update-project-status"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 350,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography id="update-status-modal" variant="h6" component="h2" mb={2}>
          Update Project Status
        </Typography>

        <FormControl fullWidth disabled={loadingStatus}>
          <Autocomplete
            options={allStatus}
            getOptionLabel={(option) => option.name || ""}
            value={allStatus.find((s) => s.id === selectedStatus) || null}
            onChange={(event, newValue) => {
              setSelectedStatus(newValue ? newValue.id : "");
            }}
            renderInput={(params) => <TextField {...params} label="Status" />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </FormControl>

        <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
          <Button onClick={handleClose} variant="outlined" size="small">
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            color="primary"
            size="small"
            disabled={updating || !selectedStatus}
          >
            {updating ? "Updating..." : "Update"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UpdateStatusModal;
