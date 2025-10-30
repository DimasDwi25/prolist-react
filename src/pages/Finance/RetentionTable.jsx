import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import {
  Typography,
  Stack,
  Box,
  Snackbar,
  Alert,
  IconButton,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ReactDOM from "react-dom";

import api from "../../api/api";
import ViewRetentionModal from "../../components/modal/ViewRetentionModal";
import FormRetentionModal from "../../components/modal/FormRetentionModal";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import { filterBySearch } from "../../utils/filter";
import { formatDate } from "../../utils/FormatDate";
import { formatValue } from "../../utils/formatValue";

export default function RetentionTable() {
  const hotTableRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [retentions, setRetentions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRetention, setSelectedRetention] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    retention: null,
  });

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    return td;
  };

  // Utils
  const safeText = (val, fallback = "-") =>
    val == null || val === "" ? fallback : String(val);

  // Definisi kolom
  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 120,
        renderer: (instance, td, row) => {
          td.innerHTML = "";

          // wrapper flex
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.alignItems = "center";
          wrapper.style.gap = "6px"; // jarak antar tombol

          // 👁️ View button
          const viewBtn = document.createElement("button");
          viewBtn.style.cursor = "pointer";
          viewBtn.style.border = "none";
          viewBtn.style.background = "transparent";
          viewBtn.title = "View";

          const viewIcon = document.createElement("span");
          viewIcon.innerHTML = "👁️";
          viewBtn.appendChild(viewIcon);

          viewBtn.onclick = () => {
            const retention = instance.getSourceDataAtRow(row);
            setSelectedRetention(retention);
            setOpenViewModal(true);
          };

          wrapper.appendChild(viewBtn);

          // ✏️ Edit button
          const editBtn = document.createElement("button");
          editBtn.style.cursor = "pointer";
          editBtn.style.border = "none";
          editBtn.style.background = "transparent";
          editBtn.title = "Edit";
          editBtn.innerHTML = "✏️";
          editBtn.onclick = () => {
            const retention = instance.getSourceDataAtRow(row);
            setSelectedRetention(retention);
            setOpenFormModal(true);
          };
          wrapper.appendChild(editBtn);

          // 🗑️ Delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.style.cursor = "pointer";
          deleteBtn.style.border = "none";
          deleteBtn.style.background = "transparent";
          deleteBtn.title = "Delete";
          deleteBtn.innerHTML = "🗑️";
          deleteBtn.onclick = () => {
            const retention = instance.getSourceDataAtRow(row);
            setDeleteDialog({ open: true, retention });
          };
          wrapper.appendChild(deleteBtn);

          td.appendChild(wrapper);
          return td;
        },
      },
      { data: "id", title: "ID" },
      { data: "project_name", title: "Project Name" },
      { data: "invoice_number", title: "Invoice Number" },
      {
        data: "retention_due_date",
        title: "Retention Due Date",
        renderer: dateRenderer,
      },
      {
        data: "retention_value",
        title: "Retention Value",
        renderer: (instance, td, row, col, prop, value) => {
          td.style.fontWeight = "600";
          td.style.color = "green";
          td.innerText = safeText(formatValue(value).formatted);
          return td;
        },
      },
    ],
    []
  );

  const initialVisibility = {};
  allColumns.forEach((col) => {
    initialVisibility[col.data] = true;
  });
  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleColumn = (field) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const fetchRetentions = async () => {
    try {
      const res = await api.get("/finance/retentions");
      const retentionsData = res.data?.map((r) => ({
        id: r.id,
        project_id: r.project_id,
        retention_due_date: r.retention_due_date,
        retention_value: r.retention_value,
        invoice_id: r.invoice_id,
        project_name: r.project?.project_name || "-",
        invoice_number: r.invoice?.invoice_number || "-",
      }));
      setRetentions(retentionsData);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchRetentions();

      // Fetch projects and invoices for form modal
      const resProjects = await api.get("/projects");
      setProjects(resProjects.data?.data || []);

      // Note: Invoices endpoint not available, using empty array for now
      setInvoices([]);
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.retention) return;

    try {
      await api.delete(`/finance/retentions/${deleteDialog.retention.id}`);
      setSnackbar({
        open: true,
        message: "Retention deleted successfully!",
        severity: "success",
      });
      setDeleteDialog({ open: false, retention: null });
      loadData();
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to delete retention",
        severity: "error",
      });
    }
  };

  const filteredData = filterBySearch(retentions, searchTerm).map((r) => ({
    id: r.id,
    project_id: r.project_id,
    retention_due_date: r.retention_due_date,
    retention_value: r.retention_value,
    invoice_id: r.invoice_id,
    project_name: r.project_name,
    invoice_number: r.invoice_number,
  }));
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  return (
    <Box sx={{ position: "relative" }}>
      {/* Loading Overlay */}
      <LoadingOverlay loading={loading} />

      {/* Top Controls */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        alignItems="center"
        mb={2}
      >
        <TextField
          size="small"
          placeholder="Search retentions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            width: 240,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              paddingRight: 0,
            },
            "& .MuiInputBase-input": {
              padding: "6px 10px",
              fontSize: "0.875rem",
            },
          }}
        />

        <ColumnVisibilityModal
          columns={allColumns}
          columnVisibility={columnVisibility}
          handleToggleColumn={handleToggleColumn}
        />

        <IconButton
          onClick={() => {
            setSelectedRetention(null); // create mode
            setOpenFormModal(true);
          }}
          sx={{
            backgroundColor: "#2563eb",
            color: "#fff",
            width: 36,
            height: 36,
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#1d4ed8",
              transform: "scale(1.05)",
            },
          }}
        >
          <Plus fontSize="small" />
        </IconButton>
      </Stack>

      {/* Handsontable */}
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
            hiddenColumns={{
              columns: allColumns
                .map((col, i) => (columnVisibility[col.data] ? null : i))
                .filter((i) => i !== null),
              indicators: true,
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

      {/* View Retention Modal */}
      <ViewRetentionModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedRetention(null);
        }}
        retention={selectedRetention}
      />

      {/* Form Retention Modal */}
      <FormRetentionModal
        open={openFormModal}
        onClose={() => {
          setOpenFormModal(false);
          setSelectedRetention(null);
        }}
        retention={selectedRetention}
        projects={projects}
        invoices={invoices}
        onSave={() => {
          setSnackbar({
            open: true,
            message: selectedRetention
              ? "Retention updated successfully!"
              : "Retention created successfully!",
            severity: "success",
          });
          loadData();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, retention: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this retention?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, retention: null })}
          >
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pagination */}
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangePageSize}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
}
