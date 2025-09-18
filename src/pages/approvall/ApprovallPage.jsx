import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import api from "../../api/api";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import ViewPhcModal from "../../components/modal/ViewPhcModal";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function ApprovalPage() {
  const [openModal, setOpenModal] = useState(false);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [statusToUpdate, setStatusToUpdate] = useState("");
  const [pin, setPin] = useState("");
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/approvals");
      const data = Array.isArray(res.data) ? res.data : res.data.data;
      setApprovals(data || []);

      console.log(approvals);

      // Hitung jumlah status
      const approved = data.filter((a) => a.status === "approved").length;
      const pending = data.filter((a) => a.status === "pending").length;
      const rejected = data.filter((a) => a.status === "rejected").length;
      setCounts({ approved, pending, rejected });

      console.log(res.data);
    } catch (err) {
      console.error(err);
      setAlert({
        open: true,
        message: "Gagal memuat data approvals",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleActionClick = (approval, status) => {
    setSelectedApproval(approval);
    setStatusToUpdate(status);
    setPin("");
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!pin) {
      setAlert({ open: true, message: "PIN harus diisi", severity: "warning" });
      return;
    }

    try {
      await api.post(`/approvals/${selectedApproval.id}/status`, {
        status: statusToUpdate,
        pin,
      });

      setAlert({
        open: true,
        message: `Approval ${statusToUpdate} berhasil`,
        severity: "success",
      });
      setModalOpen(false);
      fetchApprovals();
    } catch (err) {
      setAlert({
        open: true,
        message: err.response?.data?.message || "Terjadi kesalahan",
        severity: "error",
      });
    }
  };

  const handleViewPhc = (pnNumber) => {
    setSelectedProjectId(pnNumber);
    setOpenModal(true);
  };

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="approve"
          icon={<CheckIcon color="success" />}
          label="Approve"
          onClick={() => handleActionClick(params.row, "approved")}
          disabled={params.row?.status !== "pending"}
          showInMenu={false}
        />,

        <GridActionsCellItem
          key="reject"
          icon={<CloseIcon color="error" />}
          label="Reject"
          onClick={() => handleActionClick(params.row, "rejected")}
          disabled={params.row?.status !== "pending"}
          showInMenu={false}
        />,

        <GridActionsCellItem
          key="view"
          icon={<VisibilityIcon color="primary" />}
          label="View PHC"
          onClick={() => handleViewPhc(params.row.approvable.project.pn_number)}
          showInMenu={false}
        />,
      ],
    },

    {
      field: "type",
      headerName: "Type",
      width: 150,
      renderCell: (params) => {
        return params?.row?.type ?? "N/A";
      },
    },

    {
      field: "approval_for",
      headerName: "Project",
      width: 300,
      renderCell: (params) =>
        params?.row?.approvable?.project?.project_number ?? "N/A",
    },

    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const status = params?.value ?? "";
        let color = "inherit";
        if (status === "approved") color = "green";
        else if (status === "pending") color = "orange";
        else if (status === "rejected") color = "red";
        return <span style={{ color }}>{status}</span>;
      },
    },

    {
      field: "validated_at",
      headerName: "Validated At",
      width: 180,
      renderCell: (params) => {
        const date = params?.row?.validated_at;
        if (!date) return "-";

        // Format tanggal, misal jadi YYYY-MM-DD HH:mm
        const formatted = new Date(date).toLocaleString("id-ID", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        return <span>{formatted}</span>;
      },
    },
  ];

  return (
    <Box p={3}>
      {/* Status Cards */}
      <Stack direction="row" spacing={2} mb={3}>
        <Card sx={{ flex: 1, bgcolor: "#e0f7fa" }}>
          <CardContent>
            <Typography variant="h6">Approved</Typography>
            <Typography variant="h4">{counts.approved}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: "#fff9c4" }}>
          <CardContent>
            <Typography variant="h6">Pending</Typography>
            <Typography variant="h4">{counts.pending}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: "#ffcdd2" }}>
          <CardContent>
            <Typography variant="h6">Rejected</Typography>
            <Typography variant="h4">{counts.rejected}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* DataGrid */}
      <div className="table-wrapper">
        <div className="table-inner">
          <DataGrid
            rows={approvals}
            columns={columns}
            loading={loading}
            getRowId={(row) => Number(row.id)}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </div>
      </div>

      {/* Modal PIN */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Masukkan PIN untuk {statusToUpdate}</DialogTitle>
        <DialogContent>
          <TextField
            label="PIN"
            type="password"
            fullWidth
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleConfirm}>
            Konfirmasi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Alert */}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert((a) => ({ ...a, open: false }))}
      >
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>
      <ViewPhcModal
        open={openModal}
        handleClose={() => setOpenModal(false)}
        projectId={selectedProjectId}
      />
    </Box>
  );
}
