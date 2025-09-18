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
  MenuItem,
  InputAdornment,
  IconButton,
} from "@mui/material";

import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
// import CreateQuotationModal from "./create/CreateQuotationModal";
import api from "../../api/api"; // Axios instance dengan JWT
import QuotationFormModal from "./QuotationFormModal";
import QuotationDetailModal from "./QuotationDetailModal";

export default function QuotationTable() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // --- Inline Cell Edit ---
  const [openCellConfirm, setOpenCellConfirm] = useState(false);
  const [changedCell, setChangedCell] = useState(null);

  // --- Snackbar ---
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- Tambahkan state untuk modal create ---
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [clients, setClients] = useState([]);

  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  // --- Columns ---
  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      flex: 1,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<Typography color="primary">👁️</Typography>}
          label="View"
          onClick={() => {
            setSelectedQuotationId(params.row.id);
            setOpenDetailModal(true);
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Typography color="error">🗑️</Typography>}
          label="Delete"
          onClick={() => handleDeleteQuotation(params.row.quotation_number)}
        />,
      ],
    },
    {
      field: "no_quotation",
      headerName: "No. Quotation",
      flex: 1,
      renderCell: (params) => (
        <Typography fontWeight={600}>{params.value}</Typography>
      ),
    },
    {
      field: "title_quotation",
      headerName: "Title",
      flex: 2,
      editable: true,
      renderCell: (params) => (
        <Typography noWrap fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "client_name",
      headerName: "Client",
      flex: 1,
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "client_pic",
      headerName: "PIC",
      flex: 1,
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "quotation_date",
      headerName: "Date",
      flex: 1,
      valueFormatter: (params) => {
        if (!params || !params.value) return "-";
        const date = new Date(params.value);
        if (isNaN(date)) return "-";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      },
      renderCell: (params) => {
        if (!params.value)
          return <Typography color="text.secondary">-</Typography>;
        const date = new Date(params.value);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return (
          <Typography color="text.secondary" noWrap>
            {`${day}-${month}-${year}`}
          </Typography>
        );
      },
    },

    {
      field: "quotation_value",
      headerName: "Value",
      flex: 1,
      editable: true,
      type: "number",
      preProcessEditCellProps: (params) => {
        let value = params.props.value;

        if (value === "" || value === undefined || isNaN(value)) {
          value = null; // biar aman
        } else {
          value = Number(value);
        }

        return { ...params.props, value };
      },
      valueFormatter: (params) => {
        if (!params || params.value == null) return "-";
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(params.value);
      },
      renderCell: (params) => (
        <Typography fontWeight={600} color="green">
          {params.value != null
            ? new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(params.value)
            : "-"}
        </Typography>
      ),
    },

    {
      field: "quotation_weeks",
      headerName: "Week",
      flex: 1,
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },

    {
      field: "revision_quotation_date",
      headerName: "Revision Date",
      flex: 1,
      editable: true,
      type: "date",
      valueFormatter: (params) => {
        if (!params || !params.value) return "-";
        const date = new Date(params.value);
        if (isNaN(date)) return "-";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      },
      renderCell: (params) => {
        if (!params.value)
          return <Typography color="text.secondary">-</Typography>;
        const date = new Date(params.value);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return (
          <Typography color="text.secondary" noWrap>
            {`${day}-${month}-${year}`}
          </Typography>
        );
      },
    },

    {
      field: "revisi",
      headerName: "Revision",
      flex: 1,
      editable: true,
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },

    {
      field: "status",
      headerName: "Status",
      flex: 1,
      editable: true,
      type: "singleSelect",
      valueOptions: ["A", "D", "E", "F", "O"], // kode status
      renderCell: (params) => {
        // Mapping kode ke label dan warna
        const statusMap = {
          A: { label: "[A] ✓ Completed", color: "success", variant: "filled" },
          D: {
            label: "[D] ⏳ No PO Yet",
            color: "warning",
            variant: "outlined",
          },
          E: { label: "[E] ❌ Cancelled", color: "error", variant: "outlined" },
          F: {
            label: "[F] ⚠️ Lost Bid",
            color: "warning",
            variant: "outlined",
          },
          O: { label: "[O] 🕒 On Going", color: "info", variant: "outlined" },
        };

        const status = statusMap[params.value] || {
          label: params.value,
          color: "default",
          variant: "outlined",
        };

        return (
          <Chip
            label={status.label}
            color={status.color}
            size="small"
            variant={status.variant}
            sx={{ fontWeight: 600, minWidth: 120, textAlign: "center" }}
          />
        );
      },
    },

    {
      field: "notes",
      headerName: "Notes",
      flex: 2,
      editable: true,
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },
  ];

  const [columnVisibility, setColumnVisibility] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.field]: true }), {})
  );

  const fetchQuotations = async () => {
    try {
      const res = await api.get("/quotations");
      setQuotations(
        res.data.map((q) => ({
          id: q.quotation_number,
          ...q,
          quotation_number: q.quotation_number,
          client_name: q.client?.name,
        }))
      );
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // --- Panggil di useEffect pertama kali ---
  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get("/clients");
        setClients(res.data.map((c) => ({ ...c, id: c.id })));
      } catch (err) {
        console.error("Error fetching clients:", err.response?.data || err);
      }
    };
    fetchClients();
  }, []);

  // --- Inline Cell Edit Handler ---
  // processRowUpdate: jangan return newRow, cukup simpan perubahan
  const handleProcessRowUpdate = (newRow, oldRow) => {
    const changedField = Object.keys(newRow).find(
      (key) => newRow[key] !== oldRow[key]
    );

    if (changedField) {
      setChangedCell({
        quotation_number: oldRow.quotation_number,
        field: changedField,
        oldValue: oldRow[changedField],
        newValue: newRow[changedField],
      });
      setOpenCellConfirm(true);
    }

    return oldRow; // tetap pakai row lama dulu
  };

  // confirm modal
  const confirmCellUpdate = async () => {
    try {
      const { quotation_number, field, newValue } = changedCell;
      const row = quotations.find(
        (q) => q.quotation_number === quotation_number
      );

      const payload = { ...row, [field]: newValue };
      const res = await api.put(`/quotations/${quotation_number}`, payload);

      // update state agar grid re-render
      setQuotations((prev) =>
        prev.map((r) =>
          r.quotation_number === quotation_number
            ? {
                ...r, // simpan data lama
                ...res.data.quotation, // update dari backend
                client_name: res.data.quotation.client?.name ?? r.client_name,
                client_pic: res.data.quotation.client?.pic ?? r.client_pic,
              }
            : r
        )
      );

      setSnackbar({
        open: true,
        message: "Cell updated successfully!",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to update cell",
        severity: "error",
      });
    } finally {
      setOpenCellConfirm(false);
      setChangedCell(null);
    }
  };

  // --- Delete Quotation Handler ---
  const handleDeleteQuotation = async (quotation_number) => {
    if (!window.confirm("Are you sure you want to delete this quotation?"))
      return;
    try {
      await api.delete(`/quotations/${quotation_number}`);
      setQuotations((prev) =>
        prev.filter((row) => row.quotation_number !== quotation_number)
      );
      setSnackbar({
        open: true,
        message: "Quotation deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to delete quotation.",
        severity: "error",
      });
    }
  };

  // --- Handler saat save dari modal ---
  const handleAddQuotation = async () => {
    await fetchQuotations();
    setSnackbar({
      open: true,
      message: "Quotation created successfully!",
      severity: "success",
    });
  };

  return (
    <div style={{ height: 600, width: "100%" }}>
      <div className="flex justify-end mb-2">
        <IconButton
          onClick={() => setOpenCreateModal(true)}
          sx={{
            backgroundColor: "#2563eb",
            color: "#fff",
            width: 36, // lebar
            height: 36, // tinggi
            "&:hover": { backgroundColor: "#1d4ed8" },
          }}
        >
          <Plus fontSize="small" />
        </IconButton>
        <ColumnVisibilityModal
          columns={columns}
          columnVisibility={columnVisibility}
          handleToggleColumn={(field) =>
            setColumnVisibility((prev) => ({ ...prev, [field]: !prev[field] }))
          }
        />
      </div>
      <div className="table-wrapper">
        <div className="table-inner">
          <DataGrid
            rows={quotations}
            getRowId={(row) => row.id}
            columns={columns}
            loading={loading}
            showToolbar
            pagination
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
            sx={{
              borderRadius: 2,
              ".MuiDataGrid-cell": { py: 1.2 },
              ".MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5",
                fontWeight: 600,
              },
              ".MuiDataGrid-footerContainer": {
                borderTop: "1px solid #e0e0e0",
              },
            }}
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

      {/* --- Modal Single Cell --- */}
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
                  label={
                    changedCell.oldValue instanceof Date
                      ? changedCell.oldValue.toLocaleDateString("id-ID")
                      : changedCell.oldValue || "—"
                  }
                  color="error"
                  variant="outlined"
                />
                <Chip
                  label={
                    changedCell.newValue instanceof Date
                      ? changedCell.newValue.toLocaleDateString("id-ID")
                      : changedCell.newValue || "—"
                  }
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

      <QuotationFormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        clients={clients}
        onSave={handleAddQuotation}
      />

      <QuotationDetailModal
        open={openDetailModal}
        onClose={() => setOpenDetailModal(false)}
        quotationId={selectedQuotationId}
      />
    </div>
  );
}
