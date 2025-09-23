import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
  Box,
  Autocomplete,
  Tooltip,
  Paper,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import api from "../../api/api";

export default function WorkOrderFormModal({
  open,
  onClose,
  project,
  workOrder = null, // jika ada maka edit, jika null maka create
}) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    wo_date: "",
    wo_count: 1,
    add_work: false,
    start_working_date: "",
    end_working_date: "",
    client_approved: false,
    pics: [{ user_id: "", role_id: "" }],
    descriptions: [{ title: "", description: "", result: "" }],
  });

  // === Fetch users & roles ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resUsers = await api.get("/users/engineer-only");
        const resRoles = await api.get("/users/roleTypeTwoOnly");
        setUsers(resUsers.data.data || []);
        setRoles(resRoles.data.data || []);

        console.log("Fetched users:", resUsers.data.data);
        console.log("Fetched roles:", resRoles.data.data);
      } catch (err) {
        console.error("Failed to fetch users/roles", err);
      }
    };
    fetchData();
  }, []);

  // === Isi form jika edit ===
  useEffect(() => {
    if (!workOrder) return;

    console.log("WorkOrder PICs:", workOrder.pics);
    console.log("Users fetched:", users);
    console.log("Roles fetched:", roles);

    if (users.length === 0 || roles.length === 0) return; // tunggu fetch selesai

    const mappedPics = workOrder.pics?.map((p) => {
      const userOption = users.find(
        (u) => String(u.id) === String(p.user_id)
      ) ||
        p.user || { id: p.user_id, name: "Unknown User", email: "" }; // fallback langsung dari relasi workOrder

      const roleOption = roles.find(
        (r) => String(r.id) === String(p.role_id)
      ) ||
        p.role || { id: p.role_id, name: "Unknown Role" }; // fallback langsung dari relasi workOrder

      return {
        user_id: p.user_id,
        role_id: p.role_id,
        _userOption: userOption,
        _roleOption: roleOption,
      };
    }) || [{ user_id: "", role_id: "", _userOption: null, _roleOption: null }];

    setForm((prev) => ({
      ...prev,
      wo_date: formatDate(workOrder.wo_date),
      start_working_date: formatDate(workOrder.start_working_date),
      end_working_date: formatDate(workOrder.end_working_date),
      wo_count: workOrder.wo_count || 1,
      add_work: Boolean(Number(workOrder.add_work)),
      client_approved: Boolean(Number(workOrder.client_approved)),
      pics: mappedPics,
      descriptions: workOrder.descriptions?.map((d) => ({
        title: d.title || "",
        description: d.description || "",
        result: d.result || "",
      })) || [{ title: "", description: "", result: "" }],
    }));
  }, [workOrder, users, roles]);

  // === Hitung mandays otomatis ===
  useEffect(() => {
    const totalEng = form.pics.filter((p) => {
      const role = roles.find((r) => r.id === p.role_id);
      return role?.name.toLowerCase().includes("engineer");
    }).length;

    const totalElect = form.pics.filter((p) => {
      const role = roles.find((r) => r.id === p.role_id);
      return role?.name.toLowerCase().includes("electrician");
    }).length;

    setForm((prev) => ({
      ...prev,
      total_mandays_eng: totalEng,
      total_mandays_elect: totalElect,
    }));
  }, [form.pics, roles]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // === PIC Handlers ===
  const addPic = () => {
    setForm((prev) => ({
      ...prev,
      pics: [...prev.pics, { user_id: "", role_id: "" }],
    }));
  };

  const updatePic = (index, field, value, optionObj) => {
    const updated = [...form.pics];
    updated[index][field] = value;

    if (field === "user_id") updated[index]._userOption = optionObj || null;
    if (field === "role_id") updated[index]._roleOption = optionObj || null;

    setForm((prev) => ({ ...prev, pics: updated }));
  };

  const removePic = (index) => {
    setForm((prev) => ({
      ...prev,
      pics: prev.pics.filter((_, i) => i !== index),
    }));
  };

  // === Description Handlers ===
  const addDescription = () => {
    setForm((prev) => ({
      ...prev,
      descriptions: [
        ...prev.descriptions,
        { title: "", description: "", result: "" },
      ],
    }));
  };

  const updateDescription = (index, field, value) => {
    const updated = [...form.descriptions];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, descriptions: updated }));
  };

  const removeDescription = (index) => {
    setForm((prev) => ({
      ...prev,
      descriptions: prev.descriptions.filter((_, i) => i !== index),
    }));
  };

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // Format yyyy-MM-dd
  }

  const getWoDatesPreview = () => {
    if (!form.wo_date || form.wo_count < 1) return [];
    const startDate = new Date(form.wo_date);
    const dates = [];

    for (let i = 0; i < form.wo_count; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(
        d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    }

    return dates;
  };

  // === HANDLE SUBMIT ===
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = { ...form, project_id: project.pn_number };
      let res;
      let updatedWO;

      if (workOrder) {
        // Update existing
        res = await api.put(`/work-order/${workOrder.id}`, payload);
        const updatedData = res.data?.data;

        if (!updatedData?.id) {
          console.error(
            "Update response tidak mengandung id. Pastikan backend mengirim id!"
          );
          Swal.fire(
            "Error",
            "Backend tidak mengirim id untuk Work Order. Update gagal.",
            "error"
          );
          return;
        }

        updatedWO = updatedData;
        Swal.fire("Success", "Work Order updated successfully", "success");
      } else {
        // Create new
        res = await api.post("/work-order", payload);
        const createdData = res.data.data;

        // Pastikan setiap created WO punya id
        updatedWO = Array.isArray(createdData) ? createdData : [createdData];

        if (updatedWO.some((wo) => !wo.id)) {
          console.error(
            "Salah satu Work Order baru tidak punya id. Pastikan backend mengirim id!"
          );
          Swal.fire(
            "Error",
            "Beberapa Work Order baru tidak punya id. Create gagal.",
            "error"
          );
          return;
        }

        Swal.fire(
          "Success",
          form.wo_count > 1
            ? `${updatedWO.length} Work Orders created successfully`
            : "Work Order created successfully",
          "success"
        );
      }

      // Kirim ke parent (modal)
      onClose(updatedWO.length === 1 ? updatedWO[0] : updatedWO);
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to save WO",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(null)} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.5rem" }}>
        {workOrder ? "Edit Work Order" : "Create New Work Order"}
        <IconButton
          onClick={() => onClose(null)}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#f9f9f9", py: 3 }}>
        {/* === General Information Card: Project Info === */}
        <Paper
          variant="outlined"
          sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#fff" }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            General Information
          </Typography>
          <Grid container spacing={2}>
            <Grid xs={12} md={4}>
              <TextField
                label="Project Number"
                value={project?.project_number || ""}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={4}>
              <TextField
                label="Client Name"
                value={project?.client?.name || ""}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={4}>
              <TextField
                label="WO Date"
                type="date"
                name="wo_date"
                value={form.wo_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
          </Grid>
        </Paper>

        {/* === Overnight Work Section: Start & End Date === */}
        <Paper
          variant="outlined"
          sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#fff" }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Overnight Work
          </Typography>
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <TextField
                label="Start Working Date"
                type="date"
                name="start_working_date"
                value={form.start_working_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={6}>
              <TextField
                label="End Working Date"
                type="date"
                name="end_working_date"
                value={form.end_working_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
          </Grid>
        </Paper>

        {/* === PIC Card === */}
        <Paper
          variant="outlined"
          sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#fff" }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Person In Charge (PIC)
          </Typography>
          <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
            {form.pics.map((pic, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 2,
                  aligs: "center",
                  p: 2,
                  mb: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  bgcolor: "#fefefe",
                }}
              >
                <Autocomplete
                  options={users}
                  getOptionLabel={(u) => `${u.name} (${u.email})`}
                  value={pic._userOption || null}
                  onChange={(_, val) =>
                    updatePic(index, "user_id", val ? val.id : "", val)
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Select User" />
                  )}
                  fullWidth
                />

                <Autocomplete
                  options={roles}
                  getOptionLabel={(r) => r.name}
                  value={pic._roleOption || null}
                  onChange={(_, val) =>
                    updatePic(index, "role_id", val ? val.id : "", val)
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Select Role" />
                  )}
                  fullWidth
                />

                <Tooltip title="Remove PIC">
                  <IconButton color="error" onClick={() => removePic(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
          <Button onClick={addPic} size="small" variant="contained">
            + Add PIC
          </Button>
        </Paper>

        {/* === Work Descriptions Card === */}
        <Paper
          variant="outlined"
          sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#fff" }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Work Descriptions
          </Typography>
          <Box sx={{ maxHeight: 250, overflowY: "auto" }}>
            {form.descriptions.map((desc, index) => (
              <Box
                key={index}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr auto",
                  gap: 2,
                  aligs: "center",
                  p: 2,
                  mb: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  bgcolor: "#fefefe",
                }}
              >
                <TextField
                  label="Description"
                  value={desc.description}
                  multiline
                  minRows={2}
                  onChange={(e) =>
                    updateDescription(index, "description", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Result"
                  value={desc.result}
                  multiline
                  minRows={2}
                  onChange={(e) =>
                    updateDescription(index, "result", e.target.value)
                  }
                  fullWidth
                />
                <Tooltip title="Remove Description">
                  <IconButton
                    color="error"
                    onClick={() => removeDescription(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
          <Button onClick={addDescription} size="small" variant="contained">
            + Add Description
          </Button>
        </Paper>

        {/* === Work Order Details === */}
        <Paper
          variant="outlined"
          sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#fff" }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Work Order Details
          </Typography>

          {/* Mandays 2 columns */}
          <Grid container spacing={2} mb={2}>
            <Grid xs={12} md={6}>
              <TextField
                label="Mandays Engineer"
                type="number"
                name="total_mandays_eng"
                value={form.total_mandays_eng || 0}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={6}>
              <TextField
                label="Mandays Electrician"
                type="number"
                name="total_mandays_elect"
                value={form.total_mandays_elect || 0}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
          </Grid>

          {/* Checkboxes 2 columns */}
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.add_work}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        add_work: e.target.checked,
                      }))
                    }
                  />
                }
                label="Additional Work"
              />
            </Grid>
            <Grid xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.client_approved}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        client_approved: e.target.checked,
                      }))
                    }
                  />
                }
                label="Client Approved"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* === WO Count & Preview === */}
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, bgcolor: "#f5f5f5" }}
        >
          <Grid container spacing={2} aligs="flex-start">
            <Grid xs={12} md={3}>
              <TextField
                label="WO Count"
                type="number"
                name="wo_count"
                value={form.wo_count}
                onChange={(e) => {
                  let val = parseInt(e.target.value);
                  const maxWO = 20;
                  const minWO = 1;

                  if (isNaN(val)) val = ""; // biarkan kosong saat mengetik
                  else if (val > maxWO) val = maxWO;
                  else if (val < minWO) val = minWO;

                  setForm((prev) => ({ ...prev, wo_count: val }));
                }}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
              <Typography variant="caption" color="text.secondary">
                WO Count determines how many Work Orders will be created (max
                20).
              </Typography>
            </Grid>

            <Grid xs={12} md={9}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Work Order Dates Preview
              </Typography>
              {getWoDatesPreview().length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                  {getWoDatesPreview().map((date, i) => (
                    <li key={i}>{date}</li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Enter the WO Date and WO Count to see the list of dates.
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => onClose(null)} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">
          {loading
            ? "Saving..."
            : workOrder
            ? "Update Work Order"
            : form.wo_count > 1
            ? `Create ${form.wo_count} Work Orders`
            : "Create Work Order"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
