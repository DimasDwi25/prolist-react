import React, { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Plus } from "lucide-react";
import EditIcon from "@mui/icons-material/Edit";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  TextField,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";

import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import CreateClientModal from "./create/CreateClientModal";
import api from "../../api/api";

export default function ClientTable() {
  const [clients, setClients] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [openCellConfirm, setOpenCellConfirm] = useState(false);
  const [changedCell, setChangedCell] = useState(null);

  const [openRowModal, setOpenRowModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formValues, setFormValues] = useState({});

  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      flex: 1,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit Row"
          onClick={() => handleEditRowClick(params.row)}
        />,
      ],
    },
    { field: "name", headerName: "Name", flex: 1, editable: true },
    { field: "address", headerName: "Address", flex: 2, editable: true },
    { field: "phone", headerName: "Phone", flex: 1, editable: true },
    {
      field: "client_representative",
      headerName: "Representative",
      flex: 1.5,
      editable: true,
    },
    { field: "city", headerName: "City", flex: 1, editable: true },
    { field: "province", headerName: "Province", flex: 1, editable: true },
    { field: "country", headerName: "Country", flex: 1, editable: true },
    { field: "zip_code", headerName: "Zip Code", flex: 0.8, editable: true },
    { field: "web", headerName: "Website", flex: 1.5, editable: true },
    { field: "notes", headerName: "Notes", flex: 2, editable: true },
  ];

  const [columnVisibility, setColumnVisibility] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.field]: true }), {})
  );

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get("/clients");
        setClients(res.data.map((c) => ({ ...c, id: c.id })));
      } catch (err) {
        console.error("Error fetching clients:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleProcessRowUpdate = (newRow, oldRow) => {
    const changedField = Object.keys(newRow).find(
      (key) => newRow[key] !== oldRow[key]
    );
    if (changedField) {
      setChangedCell({
        id: oldRow.id,
        field: changedField,
        oldValue: oldRow[changedField],
        newValue: newRow[changedField],
      });
      setOpenCellConfirm(true);
    }
    return oldRow;
  };

  const confirmCellUpdate = async () => {
    try {
      const { id, field, newValue } = changedCell;
      const res = await api.put(`/clients/${id}`, { [field]: newValue });
      setClients((prev) => prev.map((row) => (row.id === id ? res.data : row)));
      setSnackbar({
        open: true,
        message: "Cell updated successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to update cell.",
        severity: "error",
      });
    } finally {
      setOpenCellConfirm(false);
      setChangedCell(null);
    }
  };

  const handleEditRowClick = (row) => {
    setEditRow(row);
    setFormValues(row);
    setOpenRowModal(true);
  };

  const handleInputChange = (field, value) =>
    setFormValues((prev) => ({ ...prev, [field]: value }));

  const handleSaveRow = async () => {
    try {
      const updatedFields = {};
      Object.keys(formValues).forEach((key) => {
        if (formValues[key] !== editRow[key])
          updatedFields[key] = formValues[key];
      });
      if (Object.keys(updatedFields).length === 0)
        return setOpenRowModal(false);

      const res = await api.put(`/clients/${editRow.id}`, updatedFields);
      setClients((prev) =>
        prev.map((row) => (row.id === editRow.id ? res.data : row))
      );
      setSnackbar({
        open: true,
        message: "Client updated successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to update client.",
        severity: "error",
      });
    } finally {
      setOpenRowModal(false);
      setEditRow(null);
    }
  };

  const handleClientCreated = (newClient) => {
    setClients((prev) => [{ ...newClient, id: newClient.id }, ...prev]);
    setSnackbar({
      open: true,
      message: "Client created successfully!",
      severity: "success",
    });
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      await api.delete(`/clients/${id}`);
      setClients((prev) => prev.filter((row) => row.id !== id));
      setSnackbar({
        open: true,
        message: "Client deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to delete client.",
        severity: "error",
      });
    }
  };

  return (
    <div style={{ height: 600, width: "100%" }}>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setOpenCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white h-[32px] px-2 rounded text-[11px] shadow inline-flex items-center gap-0.5 mr-2"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      <div className="table-wrapper">
        <div className="table-inner">
          <DataGrid
            rows={clients}
            columns={columns.map((col) =>
              col.field === "actions"
                ? {
                    ...col,
                    getActions: (params) => [
                      <GridActionsCellItem
                        key="edit"
                        icon={<EditIcon />}
                        label="Edit Row"
                        onClick={() => handleEditRowClick(params.row)}
                      />,
                      <GridActionsCellItem
                        key="delete"
                        icon={<Typography color="error">🗑️</Typography>}
                        label="Delete"
                        onClick={() => handleDeleteClient(params.row.id)}
                      />,
                    ],
                  }
                : col
            )}
            pagination
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowsPerPageOptions={[10, 20, 50]}
            disableSelectionOnClick
            experimentalFeatures={{ newEditingApi: true }}
            processRowUpdate={handleProcessRowUpdate}
            pageSizeOptions={[10, 20, 50]}
            columnVisibilityModel={columnVisibility}
            onColumnVisibilityModelChange={(newModel) =>
              setColumnVisibility(newModel)
            }
            showToolbar
          />
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirm Cell Update */}
      <Dialog
        open={openCellConfirm}
        onClose={() => setOpenCellConfirm(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
          Confirm Change
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          {changedCell && (
            <Stack spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                You are about to update:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {changedCell.field.replace(/_/g, " ")}
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Chip
                  label={changedCell.oldValue || "—"}
                  color="error"
                  variant="outlined"
                />
                <Chip
                  label={changedCell.newValue || "—"}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setOpenCellConfirm(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmCellUpdate}
            sx={{ borderRadius: 2 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Row Modal */}
      <Dialog
        open={openRowModal}
        onClose={() => setOpenRowModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
          Edit Client
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            {editRow &&
              Object.keys(editRow).map(
                (key) =>
                  key !== "id" && (
                    <TextField
                      key={key}
                      label={key.replace(/_/g, " ")}
                      value={formValues[key] || ""}
                      fullWidth
                      size="small"
                      variant="outlined"
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                    />
                  )
              )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setOpenRowModal(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRow}
            sx={{ borderRadius: 2 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Modal */}
      <CreateClientModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}
