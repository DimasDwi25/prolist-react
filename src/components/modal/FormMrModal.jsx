import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  Grid,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import api from "../../api/api";
import { sortOptions } from "../../helper/SortOptions";

const FormMrModal = ({ open, onClose, onSave, pn_number, editData = null }) => {
  const isEdit = !!editData;

  const [materialDesc, setMaterialDesc] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [materialHandover, setMaterialHandover] = useState("");
  const [remark, setRemark] = useState("");
  const [additionalMaterial, setAdditionalMaterial] = useState(false);
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [materialStatus, setMaterialStatus] = useState(null);

  // ✅ Fetch users for handover dropdown and statuses
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users"); // pastikan endpoint tersedia
        setUsers(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    const fetchStatuses = async () => {
      try {
        const res = await api.get("/material-requests/get-available-statuses");
        setStatuses(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch statuses", err);
      }
    };
    fetchUsers();
    fetchStatuses();
  }, []);

  // ✅ Populate fields for edit mode
  useEffect(() => {
    if (isEdit && editData) {
      setMaterialDesc(editData.material_description || "");
      setTargetDate(
        editData.target_date ? editData.target_date.split(" ")[0] : ""
      );
      setMaterialHandover(editData.material_handover || "");
      setRemark(editData.remark || "");
      setAdditionalMaterial(
        editData.additional_material == "1" ||
          editData.additional_material === 1
      );
      setMaterialStatus(editData.material_status?.id || null);
    } else {
      // Reset for create mode
      setMaterialDesc("");
      setTargetDate("");
      setMaterialHandover("");
      setRemark("");
      setAdditionalMaterial(false);
      setMaterialStatus(null);
    }
  }, [isEdit, editData]);

  const handleSave = async () => {
    try {
      const payload = {
        pn_id: pn_number,
        material_description: materialDesc,
        target_date: targetDate,
        material_handover: materialHandover,
        remark,
        additional_material: additionalMaterial ? 1 : 0,
        material_status_id: materialStatus,
      };

      if (isEdit) {
        await api.put(`/material-requests/${editData.id}`, payload);
      } else {
        await api.post("/material-requests", payload);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Error saving MR:", err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? "Edit Material Request" : "Create Material Request"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} mt={1}>
          {/* Project Info */}
          <Typography variant="body2" color="textSecondary">
            Project Number: <strong>{pn_number}</strong>
          </Typography>

          {/* MR Description */}
          <TextField
            label="Material Request Title"
            placeholder="Enter a short title for this MR"
            value={materialDesc}
            onChange={(e) => setMaterialDesc(e.target.value)}
            fullWidth
            required
          />

          {/* Target Date */}
          <TextField
            label="Target Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
          />

          {/* Material Handover */}
          <Autocomplete
            options={sortOptions(users, "name")}
            getOptionLabel={(option) => option.name || ""}
            value={users.find((u) => u.id === materialHandover) || null}
            onChange={(e, newValue) =>
              setMaterialHandover(newValue ? newValue.id : "")
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign Handover To"
                placeholder="Search and select user"
                fullWidth
                required
              />
            )}
          />

          {/* Additional Material */}
          <FormControlLabel
            control={
              <Checkbox
                checked={additionalMaterial}
                onChange={(e) => setAdditionalMaterial(e.target.checked)}
              />
            }
            label="Additional Material"
          />

          {/* Material Status */}
          <Autocomplete
            options={statuses}
            getOptionLabel={(option) => option.name || ""}
            value={statuses.find((s) => s.id === materialStatus) || null}
            onChange={(e, newValue) =>
              setMaterialStatus(newValue ? newValue.id : null)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  isEdit
                    ? `Material Status (Current: ${
                        editData?.material_status?.name || "Unknown"
                      })`
                    : "Material Status"
                }
                placeholder="Select status"
                fullWidth
              />
            )}
          />

          {/* Remark */}
          <TextField
            label="Remark (Optional)"
            placeholder="Add additional notes if needed"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          {isEdit ? "Update MR" : "Save MR"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormMrModal;
