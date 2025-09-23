import React, { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Button,
  Stack,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import api from "../../api/api";
import FormLogModal from "../modal/FormLogModal";

export default function LogTable({ projectId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // Konfirmasi modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // ------------------ Fetch logs ------------------ //
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/logs`);
      setLogs(
        res.data.map((log) => ({
          id: log.id,
          logs: log.logs,
          tgl_logs: log.tgl_logs,
          status: log.status,
          categorie: log.category?.name || "-",
          user: log.user?.name || "-",
          responseUser: log.response_user ? log.response_user.name : "-",
          approvals: log.approvals || [],
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  // ------------------ Handlers ------------------ //
  const openConfirm = (log) => {
    setSelectedLog(log);
    setConfirmOpen(true);
  };

  const handleConfirmClose = async () => {
    if (!selectedLog) return;

    try {
      await api.patch(`/logs/${selectedLog.id}/close`); // pakai endpoint baru
      fetchLogs(); // refresh data
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmOpen(false);
      setSelectedLog(null);
    }
  };

  const handleCancelClose = () => {
    setConfirmOpen(false);
    setSelectedLog(null);
  };

  const handleLogCreated = () => {
    fetchLogs();
  };

  // ------------------ Columns ------------------ //
  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      flex: 1,
      getActions: (params) => [
        <GridActionsCellItem
          key="close"
          icon={<CloseIcon color="error" />}
          label="Close"
          onClick={() => openConfirm(params.row)}
          showInMenu={false} // tampil langsung icon
        />,
      ],
    },
    {
      field: "tgl_logs",
      headerName: "Date",
      flex: 2,
      renderCell: (params) => (
        <Typography>{new Date(params.value).toLocaleDateString()}</Typography>
      ),
    },
    { field: "user", headerName: "Created By", flex: 2 },
    { field: "categorie", headerName: "Category", flex: 2 },
    { field: "logs", headerName: "Log", flex: 4 },
    {
      field: "status",
      headerName: "Status",
      flex: 2,
      renderCell: (params) => {
        const statusColors = {
          "waiting approval": "warning",
          open: "success",
          closed: "error",
        };
        return (
          <Chip
            label={params.value}
            color={statusColors[params.value] || "default"}
            size="small"
          />
        );
      },
    },
    {
      field: "responseUser",
      headerName: "Response User",
      flex: 2,
      renderCell: (params) => params.value || "-",
    },
  ];

  // ------------------ Render ------------------ //
  return (
    <Stack spacing={2} p={2}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenModal(true)}
        sx={{ alignSelf: "flex-end" }}
      >
        + Add Log
      </Button>

      <FormLogModal
        open={openModal}
        handleClose={() => setOpenModal(false)}
        projectId={projectId}
        onLogCreated={handleLogCreated}
      />

      <DataGrid
        rows={logs}
        columns={columns}
        autoHeight
        loading={loading}
        showToolbar
        pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowsPerPageOptions={[10, 20, 50]}
        pageSizeOptions={[10, 20, 50]}
        disableSelectionOnClick
        sx={{
          borderRadius: 2,
          ".MuiDataGrid-cell": { py: 1 },
          ".MuiDataGrid-columnHeaders": {
            backgroundColor: "#f5f5f5",
            fontWeight: 600,
          },
          ".MuiDataGrid-footerContainer": { borderTop: "1px solid #e0e0e0" },
        }}
      />

      {/* ------------------ Modal Konfirmasi Close ------------------ */}
      <Dialog open={confirmOpen} onClose={handleCancelClose}>
        <DialogTitle>Confirm Close Log</DialogTitle>
        <DialogContent>Are you sure you want to close this log?</DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClose}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmClose}
          >
            Close Log
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
