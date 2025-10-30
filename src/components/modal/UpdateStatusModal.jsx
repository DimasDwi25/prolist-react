import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  FormControl,
  Autocomplete,
  TextField,
} from "@mui/material";
import api from "../../api/api";
import { formatDateForInput } from "../../utils/formatDateForInput";
import { sortOptions } from "../../helper/SortOptions";

const UpdateStatusModal = ({ open, handleClose, project, onStatusUpdated }) => {
  const [allStatus, setAllStatus] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [phcDates, setPhcDates] = useState("");
  const [materialStatus, setMaterialStatus] = useState("");
  const [dokumenFinishDate, setDokumenFinishDate] = useState("");
  const [engineeringFinishDate, setEngineeringFinishDate] = useState("");
  const [projectFinishDate, setProjectFinishDate] = useState("");
  const [projectProgress, setProjectProgress] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Initialize form fields when modal opens or project changes
  useEffect(() => {
    if (!open || !project) return;

    setSelectedStatus(project.status_project?.id || "");
    setPhcDates(formatDateForInput(project.phc_dates));
    setMaterialStatus(project.material_status || "");
    setDokumenFinishDate(formatDateForInput(project.dokumen_finish_date));
    setEngineeringFinishDate(
      formatDateForInput(project.engineering_finish_date)
    );
    setProjectFinishDate(formatDateForInput(project.project_finish_date));
    setProjectProgress(
      project.project_progress !== undefined ? project.project_progress : ""
    );
  }, [open, project]);

  // Fetch all status when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await api.get("/status-projects");
        const statusData = res.data || [];
        setAllStatus(statusData);
      } catch (err) {
        console.error("Failed to fetch status:", err);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [open]);

  const handleStatusChange = async () => {
    try {
      setUpdating(true);
      const payload = {
        phc_dates: phcDates || null,
        material_status: materialStatus || null,
        dokumen_finish_date: dokumenFinishDate || null,
        engineering_finish_date: projectFinishDate || null,
        project_finish_date: engineeringFinishDate || null,
        status_project_id: selectedStatus || null,
        project_progress:
          projectProgress !== "" ? Number(projectProgress) : null,
      };

      const res = await api.post(
        `/engineer/projects/${project.pn_number}/status`,
        payload
      );

      if (onStatusUpdated) {
        onStatusUpdated(res.data.data);
      }

      // Notify parent component to refresh project list
      if (window.parentRefreshProjects) {
        window.parentRefreshProjects();
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
          width: 400,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography id="update-status-modal" variant="h6" component="h2" mb={2}>
          Update Project Status
        </Typography>

        <FormControl fullWidth disabled={loadingStatus}>
          <Autocomplete
            options={sortOptions(allStatus, "name")}
            getOptionLabel={(option) => option.name || ""}
            value={allStatus.find((s) => s.id === selectedStatus) || null}
            onChange={(event, newValue) => {
              setSelectedStatus(newValue ? newValue.id : "");
            }}
            renderInput={(params) => <TextField {...params} label="Status" />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </FormControl>

        <TextField
          label="PHC Dates"
          type="date"
          fullWidth
          value={phcDates}
          onChange={(e) => setPhcDates(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Material Status"
          fullWidth
          value={materialStatus}
          onChange={(e) => setMaterialStatus(e.target.value)}
        />

        <TextField
          label="Document Finish Date"
          type="date"
          fullWidth
          value={dokumenFinishDate}
          onChange={(e) => setDokumenFinishDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Engineering Finish Date"
          type="date"
          fullWidth
          value={engineeringFinishDate}
          onChange={(e) => setEngineeringFinishDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Project Finish Date"
          type="date"
          fullWidth
          value={projectFinishDate}
          onChange={(e) => setProjectFinishDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Project Progress (%)"
          type="number"
          fullWidth
          inputProps={{ min: 0, max: 100 }}
          value={projectProgress}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || (Number(val) >= 0 && Number(val) <= 100)) {
              setProjectProgress(val);
            }
          }}
        />

        <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
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
