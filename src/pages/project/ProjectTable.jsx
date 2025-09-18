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
  IconButton,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import api from "../../api/api"; // Axios instance
import ProjectFormModal from "../project/ProjectFormModal";
import { getUser } from "../../utils/storage";
import LoadingScreen from "../../components/loading/loadingScreen";

export default function ProjectTable() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [openCellConfirm, setOpenCellConfirm] = useState(false);
  const [changedCell, setChangedCell] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const user = getUser();
  const userRole = user?.role?.name?.toLowerCase();

  const marketingRoles = [
    "marketing_admin",
    "manager_marketing",
    "sales_supervisor",
    "super_admin",
    "marketing_director",
    "supervisor marketing",
    "sales_supervisor",
    "marketing_estimator",
    "engineering_director",
  ].includes(userRole);

  const engineerRoles = ["project controller", "project manager"].includes(
    userRole
  );

  const sensitiveCols = [
    "po_value",
    "jumlah_invoice",
    "sales_weeks",
    "is_confirmation_order",
  ];

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
            if (marketingRoles) {
              navigate(`/projects/${params.row.pn_number}`);
            } else if (engineerRoles) {
              navigate(`/engineer/projects/${params.row.pn_number}`);
            }
          }}
        />,
      ],
    },
    {
      field: "project_number",
      headerName: "Project Code",
      flex: 4,
      renderCell: (params) => (
        <Typography fontWeight={600}>{params.value}</Typography>
      ),
    },
    {
      field: "project_name",
      headerName: "Project Name",
      flex: 5,
      renderCell: (params) => (
        <Typography noWrap fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "categories_name",
      headerName: "Category",
      flex: 6,
      renderCell: (params) => (
        <Typography color="text.secondary">{params.value || "-"}</Typography>
      ),
    },
    {
      field: "no_quotation",
      headerName: "No. Quotation",
      flex: 5,
      renderCell: (params) => (
        <Typography fontWeight={500}>{params.value || "-"}</Typography>
      ),
    },
    {
      field: "client_name",
      headerName: "Client",
      flex: 5,
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "phc_dates",
      headerName: "PHC Date",
      flex: 4,
      renderCell: (params) =>
        params.value ? formatDate(params.value) : <Typography>-</Typography>,
    },
    {
      field: "mandays_engineer",
      headerName: "Mandays Engineer",
      flex: 2,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "mandays_technician",
      headerName: "Mandays Technician",
      flex: 2,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "target_dates",
      headerName: "Target Date",
      flex: 5,
      renderCell: (params) =>
        params.value ? formatDate(params.value) : <Typography>-</Typography>,
    },
    {
      field: "material_status",
      headerName: "Material Status",
      flex: 2,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "dokumen_finish_date",
      headerName: "Document Finish Date",
      flex: 2,
      renderCell: (params) =>
        params.value ? formatDate(params.value) : <Typography>-</Typography>,
    },
    {
      field: "engineering_finish_date",
      headerName: "Engineering Finish Date",
      flex: 2,
      renderCell: (params) =>
        params.value ? formatDate(params.value) : <Typography>-</Typography>,
    },
    {
      field: "jumlah_invoice",
      headerName: "Jumlah Invoice",
      flex: 2,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "status_project",
      headerName: "Status",
      flex: 2,
      renderCell: (params) => {
        const statusName = params.value?.name || "-";
        return (
          <Chip
            label={statusName}
            color="primary"
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: "project_progress",
      headerName: "Progress (%)",
      flex: 2,
      renderCell: (params) => `${params.value || 0}%`,
    },
    {
      field: "po_date",
      headerName: "PO Date",
      flex: 2,
      renderCell: (params) =>
        params.value ? formatDate(params.value) : <Typography>-</Typography>,
    },
    {
      field: "sales_weeks",
      headerName: "Sales Weeks",
      flex: 2,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "po_number",
      headerName: "PO Number",
      flex: 2,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "po_value",
      headerName: "PO Value",
      flex: 2,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "is_confirmation_order",
      headerName: "Confirmation Order",
      flex: 2,
      renderCell: (params) =>
        Number(params.value) === 1 ? (
          <Chip label="Yes" color="success" size="small" />
        ) : (
          <Chip label="No" color="error" size="small" variant="outlined" />
        ),
    },
    {
      field: "parent_pn_number",
      headerName: "Parent PN",
      flex: 2,
      renderCell: (params) => params.value || "-",
    },
  ];

  const filteredColumns = engineerRoles
    ? columns.filter((col) => !sensitiveCols.includes(col.field))
    : columns;

  function formatDate(value) {
    const date = new Date(value);
    return (
      <Typography color="text.secondary" noWrap>
        {`${String(date.getDate()).padStart(2, "0")}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${date.getFullYear()}`}
      </Typography>
    );
  }

  const [columnVisibility, setColumnVisibility] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.field]: true }), {})
  );

  const fetchProjects = async () => {
    try {
      const resProjects = await api.get("/projects");

      // Pastikan clients sudah tersedia, kalau belum, ambil dulu
      const clientsData = clients.length ? clients : [];

      const projectsData = resProjects.data?.data?.map((p) => {
        // Client fallback
        let clientName = "-";

        // Cek dulu project.client_id dan cari di clientsData
        const projectClient = clientsData.find(
          (cl) => cl.id == p.client_id // pakai "==" untuk cocokan string/number
        );

        if (projectClient) {
          clientName = projectClient.name;
        } else if (p.quotation?.client?.name) {
          // fallback ke client dari quotation
          clientName = p.quotation.client.name;
        }

        return {
          id: p.pn_number,
          ...p,
          client_name: clientName,
          no_quotation: p.quotation?.no_quotation || "-",
          categories_name: p.category?.name || "-",
          status_project: p.status_project || {
            id: Number(p.status_project_id),
          },
        };
      });

      setProjects(projectsData);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  // --- Fetch clients & projects sekaligus ---
  const loadData = async () => {
    setLoading(true);
    try {
      const resClients = await api.get("/clients");
      const clientsData = resClients.data.map((c) => ({
        ...c,
        id: Number(c.id),
      }));
      setClients(clientsData);

      // --- Projects ---
      await fetchProjects();

      // Fetch quotations
      const resQuotations = await api.get("/quotations");

      const quotationsData = resQuotations.data?.map((q) => ({
        ...q,
        id: q.quotation_number, // tetap string
      }));

      setQuotations(quotationsData);

      // Fetch category
      const resCategory = await api.get("/categories-project");

      const categoryData = resCategory.data?.map((q) => ({
        ...q,
        id: q.id, // tetap string
      }));

      setCategories(categoryData);
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddProjects = async () => {
    await fetchProjects();
    setSnackbar({
      open: true,
      message: "Quotation created successfully!",
      severity: "success",
    });
  };

  // --- Inline edit ---
  const handleProcessRowUpdate = (newRow, oldRow) => {
    const changedField = Object.keys(newRow).find(
      (key) => newRow[key] !== oldRow[key]
    );
    if (changedField) {
      setChangedCell({
        project_id: oldRow.id,
        field: changedField,
        oldValue: oldRow[changedField],
        newValue: newRow[changedField],
      });
      setOpenCellConfirm(true);
    }
    return oldRow; // keep old row until confirmed
  };

  const confirmCellUpdate = async () => {
    try {
      const { project_id, field, newValue } = changedCell;

      // Tentukan payload sesuai tipe field
      let payload = {};

      switch (field) {
        case "status_project":
          payload = { status_project_id: Number(newValue?.id) };
          break;
        case "categories_name":
          payload = { category_id: Number(newValue?.id) || Number(newValue) };
          break;
        case "target_dates":
          payload = { target_dates: newValue }; // pastikan format tanggal sesuai backend
          break;
        default:
          payload[field] = newValue; // field text biasa
      }

      const res = await api.put(`/projects/${project_id}`, payload);

      // Update frontend
      setProjects((prev) =>
        prev.map((r) =>
          r.id === project_id
            ? {
                ...r,
                ...res.data.data,
                client_name: res.data.data.client?.name || r.client_name,
                categories_name:
                  res.data.data.category?.name || r.categories_name,
                status_project:
                  res.data.data.status_project || r.status_project,
              }
            : r
        )
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
        message: "Failed to update cell",
        severity: "error",
      });
    } finally {
      setOpenCellConfirm(false);
      setChangedCell(null);
    }
  };

  return (
    <div style={{ height: 600, width: "100%" }}>
      <div className="flex justify-end mb-2">
        {!engineerRoles && ( // hanya tampil kalau BUKAN engineer
          <IconButton
            onClick={() => setOpenCreateModal(true)}
            sx={{
              backgroundColor: "#2563eb",
              color: "#fff",
              width: 36,
              height: 36,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            <Plus fontSize="small" />
          </IconButton>
        )}
      </div>
      <div className="table-wrapper">
        <div className="table-inner">
          <DataGrid
            rows={projects}
            getRowId={(row) => row.pn_number}
            columns={filteredColumns.map((col) => ({
              ...col,
              minWidth: col.minWidth || 150, // kasih default minWidth
              flex: col.flex || 1,
            }))}
            loading={loading}
            showToolbar
            pagination
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            disableSelectionOnClick
            processRowUpdate={handleProcessRowUpdate}
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

      {openCreateModal && (
        <ProjectFormModal
          open={openCreateModal} // ✅ tambahkan ini
          onClose={() => setOpenCreateModal(false)} // ✅ tambahkan ini
          clients={clients}
          quotations={quotations}
          projects={projects}
          categories={categories}
          token={""} // jangan lupa token jika API dipakai
          onSave={handleAddProjects}
        />
      )}
    </div>
  );
}
