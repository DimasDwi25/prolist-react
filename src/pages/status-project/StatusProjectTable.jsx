import React, { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";

import api from "../../api/api";
import CreateStatusProjectModal from "../status-project/CreateStatusProjectTable";

export default function StatusProjectTable() {
  const [statuses, setStatuses] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [openCellConfirm, setOpenCellConfirm] = useState(false);
  const [changedCell, setChangedCell] = useState(null);

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
          key="delete"
          icon={<Typography color="error">🗑️</Typography>}
          label="Delete"
          onClick={() => handleDeleteStatus(params.row.id)}
        />,
      ],
    },
    { field: "name", headerName: "Name", flex: 2, editable: true },
  ];

  const [columnVisibility, setColumnVisibility] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.field]: true }), {})
  );

  // Fetch data
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await api.get("/status-projects");
        setStatuses(res.data.map((s) => ({ ...s, id: s.id })));
      } catch (err) {
        console.error("Error fetching statuses:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatuses();
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
      const res = await api.put(`/status-projects/${id}`, {
        [field]: newValue,
      });
      setStatuses((prev) =>
        prev.map((row) => (row.id === id ? res.data.data : row))
      );
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

  const handleDeleteStatus = async (id) => {
    if (!window.confirm("Are you sure you want to delete this status?")) return;
    try {
      await api.delete(`/status-projects/${id}`);
      setStatuses((prev) => prev.filter((row) => row.id !== id));
      setSnackbar({
        open: true,
        message: "Status deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to delete status.",
        severity: "error",
      });
    }
  };

  return (
    <div style={{ height: 500, width: "100%" }}>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setOpenCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white h-[32px] px-2 rounded text-[11px] shadow inline-flex items-center gap-0.5 mr-2"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      <DataGrid
        rows={statuses}
        columns={columns}
        pagination
        loading={loading}
        pageSizeOptions={[10, 20, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowsPerPageOptions={[10, 20, 50]}
        disableSelectionOnClick
        processRowUpdate={handleProcessRowUpdate}
        columnVisibilityModel={columnVisibility}
        onColumnVisibilityModelChange={(newModel) =>
          setColumnVisibility(newModel)
        }
      />

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

      {/* Create Modal */}
      <CreateStatusProjectModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onStatusCreated={(newStatus) =>
          setStatuses((prev) => [newStatus, ...prev])
        }
      />
    </div>
  );
}
