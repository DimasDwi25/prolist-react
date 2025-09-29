import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  DialogContentText,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import api from "../../api/api";
import SowFormModal from "../modal/SowFormModal";

const SowModal = ({ open, handleClose, projectId, token }) => {
  const [boqs, setBoqs] = useState([]);
  const [sows, setSows] = useState([]);
  const [loadingBoq, setLoadingBoq] = useState(false);
  const [loadingSow, setLoadingSow] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [editRow, setEditRow] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  // fetch BOQ
  useEffect(() => {
    if (!open || !projectId) return;
    const fetchBoqs = async () => {
      setLoadingBoq(true);
      try {
        const res = await api.get(`/projects/${projectId}/boq`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (res.data.data || []).map((row) => ({
          id: row.id,
          description: row.description,
        }));
        setBoqs(data);
      } catch (err) {
        console.error("Error fetching BOQs:", err.response?.data || err);
      } finally {
        setLoadingBoq(false);
      }
    };
    fetchBoqs();
  }, [open, projectId, token]);

  // fetch SOW
  useEffect(() => {
    if (!open || !projectId) return;
    const fetchSows = async () => {
      setLoadingSow(true);
      try {
        const res = await api.get(`/scope-of-work`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // filter hanya untuk project ini
        const data = (res.data || []).filter(
          (row) => row.project_id === projectId
        );
        console.log(data);
        setSows(data);
      } catch (err) {
        console.error("Error fetching SOWs:", err.response?.data || err);
      } finally {
        setLoadingSow(false);
      }
    };
    fetchSows();
  }, [open, projectId, token]);

  // simpan SOW baru
  const handleSaveSow = async (formData) => {
    try {
      const payload = {
        project_id: projectId,
        work_details: formData.work_details,
        pic: formData.pic || null,
        target_finish_date: formData.target_finish_date || null,
        start_date: formData.start_date || null,
        finish_date: formData.finish_date || null,
      };

      const res = await api.post(`/scope-of-work`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSows((prev) => [...prev, res.data.data]);
      setOpenForm(false);
    } catch (err) {
      console.error("Error saving SOW:", err.response?.data || err);
    }
  };

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  }

  const DateEditCell = (params) => {
    const { id, value, api, field } = params;

    const handleChange = (event) => {
      api.setEditCellValue({ id, field, value: event.target.value }, event);
    };

    return (
      <TextField
        type="date"
        value={value ? value.split("T")[0] : ""}
        onChange={handleChange}
        size="small"
        fullWidth
      />
    );
  };

  // kolom tabel BOQ
  const boqColumns = [
    {
      field: "description",
      headerName: "Description",
      width: 400,
      renderCell: (params) => (
        <Typography fontWeight={500}>{params.value}</Typography>
      ),
    },
  ];

  // kolom tabel SOW
  const sowColumns = [
    {
      field: "work_details",
      headerName: "Work Details",
      width: 250,
      editable: true,
      cellClassName: "sticky-col sticky-col-1",
      headerClassName: "sticky-col sticky-col-1",
    },
    {
      field: "pic",
      headerName: "PIC",
      width: 120,
      editable: true,
      renderCell: (params) => params.row.pic_user?.name || "-",
    },
    {
      field: "target_finish_date",
      headerName: "Target Finish",
      width: 150,
      editable: true,
      renderCell: (params) => (params.value ? formatDate(params.value) : "-"),
      renderEditCell: (params) => <DateEditCell {...params} />,
    },
    {
      field: "start_date",
      headerName: "Start Date",
      width: 150,
      editable: true,
      renderCell: (params) => (params.value ? formatDate(params.value) : "-"),
      renderEditCell: (params) => <DateEditCell {...params} />,
    },
    {
      field: "finish_date",
      headerName: "Finish Date",
      width: 150,
      editable: true,
      renderCell: (params) => (params.value ? formatDate(params.value) : "-"),
      renderEditCell: (params) => <DateEditCell {...params} />,
    },
  ];

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>Scope of Work (SOW)</DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="h6">Bill of Quantity (BOQ)</Typography>
            <div style={{ height: 250, width: "100%" }}>
              <DataGrid
                rows={boqs}
                getRowId={(row) => row.id}
                columns={boqColumns}
                loading={loadingBoq}
                disableRowSelectionOnClick
                pagination
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                rowsPerPageOptions={[10, 20, 50]}
                pageSizeOptions={[10, 20, 50]}
                showToolbar
              />
            </div>
          </Box>

          <Box>
            <Typography variant="h6">Scope of Work</Typography>
            <div style={{ height: 300, width: "100%" }}>
              <DataGrid
                rows={sows}
                getRowId={(row) => row.id}
                columns={sowColumns}
                loading={loadingSow}
                disableRowSelectionOnClick
                pagination
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                rowsPerPageOptions={[10, 20, 50]}
                pageSizeOptions={[10, 20, 50]}
                showToolbar
                processRowUpdate={(newRow, oldRow) => {
                  setEditRow(oldRow);
                  setPendingChanges(newRow);
                  setOpenConfirm(true);
                  return oldRow; // jangan update dulu, tunggu konfirmasi
                }}
                initialState={{
                  pinnedColumns: {
                    left: ["id"], // freeze kolom id
                    right: ["pic"], // freeze kolom pic
                  },
                }}
              />
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenForm(true)}
            variant="contained"
            color="primary"
          >
            Add SOW
          </Button>
          <Button onClick={handleClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to update this Scope of Work? The following
            changes will be applied:
          </DialogContentText>

          {editRow && pendingChanges && (
            <Box mt={3}>
              {Object.keys(pendingChanges).map((key) => {
                if (pendingChanges[key] !== editRow[key]) {
                  const oldValue = editRow[key];
                  const newValue = pendingChanges[key];

                  // Cek apakah field date
                  const isDateField = [
                    "target_finish_date",
                    "start_date",
                    "finish_date",
                  ].includes(key);

                  return (
                    <Box
                      key={key}
                      mb={2}
                      p={2}
                      border="1px solid #eee"
                      borderRadius={2}
                      bgcolor="#fafafa"
                    >
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ textTransform: "capitalize" }}
                      >
                        {key.replace(/_/g, " ")}
                      </Typography>
                      <Typography variant="body2">
                        <span style={{ color: "red" }}>
                          {oldValue
                            ? isDateField
                              ? formatDate(oldValue)
                              : oldValue
                            : "-"}
                        </span>{" "}
                        →{" "}
                        <span style={{ color: "green" }}>
                          {newValue
                            ? isDateField
                              ? formatDate(newValue)
                              : newValue
                            : "-"}
                        </span>
                      </Typography>
                    </Box>
                  );
                }
                return null;
              })}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenConfirm(false)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                const res = await api.put(
                  `/scope-of-work/${editRow.id}`,
                  pendingChanges,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                setSows((prev) =>
                  prev.map((row) =>
                    row.id === editRow.id ? res.data.data : row
                  )
                );
                setOpenConfirm(false);
              } catch (err) {
                console.error("Error update:", err.response?.data || err);
              }
            }}
            variant="contained"
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Form Create SOW */}
      <SowFormModal
        open={openForm}
        handleClose={() => setOpenForm(false)}
        handleSave={handleSaveSow}
      />
    </>
  );
};

export default SowModal;
