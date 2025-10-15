import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Button,
  Stack,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Box,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import api from "../../api/api";
import FormLogModal from "../modal/FormLogModal";
import { formatDate } from "../../utils/FormatDate";

export default function LogTable({ projectId }) {
  const hotTableRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // Konfirmasi modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

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
      console.log(res);
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
  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 60,
        renderer: (instance, td, row) => {
          td.innerHTML = "";

          const log = instance.getSourceDataAtRow(row);

          // Only show close button if status is not closed
          if (log.status !== "closed") {
            const closeBtn = document.createElement("button");
            closeBtn.style.cursor = "pointer";
            closeBtn.style.border = "none";
            closeBtn.style.background = "transparent";
            closeBtn.title = "Close";

            const icon = document.createElement("span");
            icon.innerHTML = "❌";
            closeBtn.appendChild(icon);

            closeBtn.onclick = () => {
              openConfirm(log);
            };

            td.appendChild(closeBtn);
          }

          return td;
        },
      },
      {
        data: "tgl_logs",
        title: "Date",
        renderer: (instance, td, row, col, prop, value) => {
          td.innerText = formatDate(value);
          return td;
        },
      },
      { data: "user", title: "Created By" },
      { data: "categorie", title: "Category" },
      { data: "logs", title: "Log" },
      {
        data: "status",
        title: "Status",
        renderer: (instance, td, row, col, prop, value) => {
          const statusColors = {
            "waiting approval": "warning",
            open: "success",
            closed: "error",
          };
          const color = statusColors[value] || "default";
          td.innerHTML = `<span style="background-color: ${
            color === "warning"
              ? "#ff9800"
              : color === "success"
              ? "#4caf50"
              : color === "error"
              ? "#f44336"
              : "#9e9e9e"
          }; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${value}</span>`;
          return td;
        },
      },
      {
        data: "responseUser",
        title: "Response User",
        renderer: (instance, td, row, col, prop, value) => {
          td.innerText = value || "-";
          return td;
        },
      },
    ],
    []
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = logs.slice(page * pageSize, page * pageSize + pageSize);

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  // ------------------ Render ------------------ //
  return (
    <Box sx={{ position: "relative" }}>
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

        {logs.length === 0 && !loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              backgroundColor: "#fafafa",
            }}
          >
            <Typography variant="h6" color="textSecondary">
              No logs available for this project.
            </Typography>
          </Box>
        ) : (
          <div className="table-wrapper">
            <div className="table-inner">
              <HotTable
                ref={hotTableRef}
                data={paginatedData}
                colHeaders={allColumns.map((c) => c.title)}
                columns={allColumns}
                width="auto"
                height={tableHeight}
                manualColumnResize
                licenseKey="non-commercial-and-evaluation"
                manualColumnFreeze
                fixedColumnsLeft={1}
                stretchH="all"
                filters
                dropdownMenu
                className="ht-theme-horizon"
                manualColumnMove
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Pagination */}
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <TablePagination
            component="div"
            count={logs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangePageSize}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>

        {/* ------------------ Modal Konfirmasi Close ------------------ */}
        <Dialog open={confirmOpen} onClose={handleCancelClose}>
          <DialogTitle>Confirm Close Log</DialogTitle>
          <DialogContent>
            Are you sure you want to close this log?
          </DialogContent>
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
    </Box>
  );
}
