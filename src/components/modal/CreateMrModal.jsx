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

const CreateMRModal = ({ open, onClose, onSave, pn_number }) => {
  const [materialDesc, setMaterialDesc] = useState("");
  const [materialCreated, setMaterialCreated] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [handoverUser, setHandoverUser] = useState("");
  const [hoDate, setHoDate] = useState("");
  const [remark, setRemark] = useState("");
  const [additionalMaterial, setAdditionalMaterial] = useState(false);
  const [users, setUsers] = useState([]);

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

  const handleSave = async () => {
    try {
      await api.post("/material-requests", {
        pn_id: pn_number,
        material_description: materialDesc,
        material_created: materialCreated,
        target_date: targetDate,
        material_handover: handoverUser,
        ho_date: hoDate,
        remark,
        additional_material: additionalMaterial ? 1 : 0,
      });
      onSave();
      onClose();
    } catch (err) {
      console.error("Error creating MR:", err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Material Request</DialogTitle>
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

          {/* Dates Section */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Created Date"
                type="date"
                value={materialCreated}
                onChange={(e) => setMaterialCreated(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Target Date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>

          {/* Material Handover */}
          <Autocomplete
            options={sortOptions(users, "name")}
            getOptionLabel={(option) => option.name || ""}
            value={users.find((u) => u.id === handoverUser) || null}
            onChange={(e, newValue) =>
              setHandoverUser(newValue ? newValue.id : "")
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

          {/* HO Date + Additional Material */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6}>
              <TextField
                label="HO Date"
                type="date"
                value={hoDate}
                onChange={(e) => setHoDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={additionalMaterial}
                    onChange={(e) => setAdditionalMaterial(e.target.checked)}
                  />
                }
                label="Additional Material"
              />
            </Grid>
          </Grid>

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
          Save MR
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateMRModal;
