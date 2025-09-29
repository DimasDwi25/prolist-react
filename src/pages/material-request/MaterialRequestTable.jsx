import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Typography,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  DialogContentText,
  Tooltip,
} from "@mui/material";
import { Plus, ArrowLeft } from "lucide-react";
import { WarningAmber, CheckCircle, Cancel } from "@mui/icons-material";
import api from "../../api/api";
import CreateMRModal from "../../components/modal/CreateMrModal";

export default function MaterialRequestTable() {
  const { pn_number } = useParams(); // ambil pn_number dari URL
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [mrs, setMrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // "cancel" | "complete"
  const [selectedId, setSelectedId] = useState(null);

  const loadData = async () => {
    if (!pn_number) return;
    setLoading(true);
    try {
      // Fetch project
      const resProject = await api.get(`/projects/${pn_number}`);
      //   console.log(resProject.data.data.project);
      setProject(resProject.data.data.project);

      // Fetch material requests
      const resMRs = await api.get("/material-requests");
      const filteredMRs = resMRs.data.data.filter(
        (mr) => mr.pn_id == pn_number
      );
      setMrs(filteredMRs.map((mr) => ({ id: mr.id, ...mr })));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pn_number]);

  // 🔹 Taruh di luar
  const cancelMaterialRequest = async (id) => {
    try {
      await api.post(`/${id}/cancel`);
      await loadData();
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  const completeMaterialRequest = async (id) => {
    try {
      await api.post(`/${id}/complete`);
      await loadData();
    } catch (err) {
      console.error("Complete error:", err);
    }
  };

  // 🔹 konfirmasi submit
  const handleConfirm = async () => {
    if (confirmAction === "cancel") {
      await cancelMaterialRequest(selectedId);
    } else if (confirmAction === "complete") {
      await completeMaterialRequest(selectedId);
    }
    setConfirmOpen(false);
    setSelectedId(null);
    setConfirmAction(null);
  };

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

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (params) => {
        const isDisabled = ["Canceled", "Completed"].includes(
          params.row.material_status
        );

        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Cancel">
              <span>
                <IconButton
                  color="error"
                  onClick={() => {
                    setSelectedId(params.row.id);
                    setConfirmAction("cancel");
                    setConfirmOpen(true);
                  }}
                  disabled={isDisabled}
                  sx={{
                    opacity: isDisabled ? 0.5 : 1,
                    padding: 0.5, // lebih compact
                    fontSize: "20px",
                  }}
                >
                  <Cancel fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Complete">
              <span>
                <IconButton
                  color="success"
                  onClick={() => {
                    setSelectedId(params.row.id);
                    setConfirmAction("complete");
                    setConfirmOpen(true);
                  }}
                  disabled={isDisabled}
                  sx={{
                    opacity: isDisabled ? 0.5 : 1,
                    padding: 0.5,
                    fontSize: "20px",
                  }}
                >
                  <CheckCircle fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      },
    },
    { field: "material_number", headerName: "Material Number", flex: 1.5 },
    { field: "material_description", headerName: "Description", flex: 3 },

    {
      field: "created_at",
      headerName: "Created At",
      renderCell: (params) =>
        params.value ? formatDate(new Date(params.value), "dd MMM yyyy") : "-",
    },

    {
      field: "created_by",
      headerName: "Created By",
      renderCell: (params) => params.row.creator?.name || "-", // ✅ tampilkan nama user
    },

    {
      field: "material_handover",
      headerName: "Handover To",
      renderCell: (params) => params.row.mr_handover?.name || "-", // ✅ tampilkan nama user handover
    },

    {
      field: "target_date",
      headerName: "Target Date",
      renderCell: (params) =>
        params.value ? formatDate(new Date(params.value), "dd MMM yyyy") : "-",
    },
    {
      field: "cancel_date",
      headerName: "Cancel Date",
      renderCell: (params) =>
        params.value ? formatDate(new Date(params.value), "dd MMM yyyy") : "-",
    },
    {
      field: "complete_date",
      headerName: "Complete Date",
      renderCell: (params) =>
        params.value ? formatDate(new Date(params.value), "dd MMM yyyy") : "-",
    },

    {
      field: "material_status",
      headerName: "Status",
      renderCell: (params) => (
        <Chip
          label={params.value || "-"}
          color={
            params.value === "Completed"
              ? "success"
              : params.value === "Canceled"
              ? "error"
              : "warning"
          }
          size="small"
        />
      ),
    },

    { field: "remark", headerName: "Remark", flex: 3 },

    {
      field: "additional_material",
      headerName: "Additional Material",
      renderCell: (params) => {
        const isYes = Number(params.value) === 1;
        return isYes ? (
          <Chip label="Yes" color="primary" size="small" />
        ) : (
          <Chip label="No" variant="outlined" size="small" />
        );
      },
    },
  ];

  return (
    <div style={{ height: 600, width: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Typography variant="subtitle1" fontWeight={600} ml={1}>
            {project?.project_number
              ? `Material Requests - ${project.project_number}`
              : "Material Requests"}
          </Typography>
        </Stack>

        <IconButton
          size="small"
          sx={{
            backgroundColor: "#2563eb",
            color: "#fff",
            "&:hover": { backgroundColor: "#1e40af" },
          }}
          onClick={() => setOpenCreateModal(true)}
        >
          <Plus fontSize="small" />
        </IconButton>
      </Stack>
      <div className="table-wrapper">
        <div className="table-inner">
          <DataGrid
            rows={mrs}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
            pageSizeOptions={[10, 20]}
            sx={{
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center", // vertical center
                justifyContent: "center", // horizontal center jika mau
              },
              "& .MuiDataGrid-columnHeader": {
                display: "flex",
                alignItems: "center", // vertical center header
                justifyContent: "center", // horizontal center header
              },
            }}
          />
        </div>
      </div>

      {openCreateModal && (
        <CreateMRModal
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
          onSave={loadData}
          pn_number={pn_number}
        />
      )}

      {/* 🔹 Modern Confirmation Modal */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
          {confirmAction === "cancel"
            ? "Confirm Cancellation"
            : "Confirm Completion"}
        </DialogTitle>

        <DialogContent>
          <Stack alignItems="center" spacing={2} sx={{ py: 1 }}>
            {confirmAction === "cancel" ? (
              <WarningAmber sx={{ fontSize: 50, color: "error.main" }} />
            ) : (
              <CheckCircle sx={{ fontSize: 50, color: "success.main" }} />
            )}

            <DialogContentText sx={{ textAlign: "center" }}>
              Are you sure you want to{" "}
              <Typography component="span" fontWeight={600}>
                {confirmAction === "cancel" ? "cancel" : "complete"}
              </Typography>{" "}
              this material request?
            </DialogContentText>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, px: 3 }}
          >
            No
          </Button>
          <Button
            onClick={handleConfirm}
            color={confirmAction === "cancel" ? "error" : "success"}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Yes, {confirmAction === "cancel" ? "Cancel" : "Complete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
