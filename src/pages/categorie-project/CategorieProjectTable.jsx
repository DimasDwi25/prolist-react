import React, { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
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

import api from "../../api/api";
import CreateCategorieProjectModal from "../categorie-project/CreateCategorieProjectModal";

export default function CategorieProjectTable() {
  const [categories, setCategories] = useState([]);
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
          onClick={() => handleDeleteCategory(params.row.id)}
        />,
      ],
    },
    { field: "name", headerName: "Name", flex: 1, editable: true },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      editable: true,
    },
  ];

  const [columnVisibility, setColumnVisibility] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.field]: true }), {})
  );

  // Fetch data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories-project");
        setCategories(res.data.map((c) => ({ ...c, id: c.id })));
      } catch (err) {
        console.error("Error fetching categories:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
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
      const res = await api.put(`/categories-project/${id}`, {
        [field]: newValue,
      });
      setCategories((prev) =>
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

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    try {
      await api.delete(`/categories-project/${id}`);
      setCategories((prev) => prev.filter((row) => row.id !== id));
      setSnackbar({
        open: true,
        message: "Category deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to delete category.",
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
            rows={categories}
            columns={columns}
            pagination
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            disableSelectionOnClick
            processRowUpdate={handleProcessRowUpdate}
            columnVisibilityModel={columnVisibility}
            onColumnVisibilityModelChange={(newModel) =>
              setColumnVisibility(newModel)
            }
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

      <CreateCategorieProjectModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onCategoryCreated={(newCategory) =>
          setCategories((prev) => [newCategory, ...prev])
        }
      />
    </div>
  );
}
