import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Typography,
  Stack,
  Box,
  Snackbar,
  Alert,
  TextField,
  TablePagination,
  Chip,
} from "@mui/material";
import api from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import { filterBySearch } from "../../utils/filter";

export default function MarketingReport() {
  const hotTableRef = useRef(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // === FORMATTER ===
  const formatDate = (val) => {
    if (!val) return "-";
    try {
      const date = new Date(val);
      if (isNaN(date)) return "-";
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      return `${d}-${m}-${date.getFullYear()}`;
    } catch {
      return "-";
    }
  };

  const formatValue = (val) => {
    if (val == null || val === "" || isNaN(val)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    td.style.color = "#555";
    return td;
  };

  const valueRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatValue(value);
    td.style.fontWeight = "600";
    td.style.color = "green";
    return td;
  };

  const statusRenderer = (instance, td, row, col, prop, value) => {
    const statusMap = {
      A: { label: "[A] ✓ Completed", color: "success", variant: "filled" },
      D: { label: "[D] ⏳ No PO Yet", color: "warning", variant: "outlined" },
      E: { label: "[E] ❌ Cancelled", color: "error", variant: "outlined" },
      F: { label: "[F] ⚠️ Lost Bid", color: "warning", variant: "outlined" },
      O: { label: "[O] 🕒 On Going", color: "info", variant: "outlined" },
    };

    const status = statusMap[value] || {
      label: value,
      color: "default",
      variant: "outlined",
    };

    // Render Chip as HTML
    td.innerHTML = `<span style="
      background-color: ${
        status.variant === "filled"
          ? status.color === "success"
            ? "#4caf50"
            : status.color === "error"
            ? "#f44336"
            : "#2196f3"
          : "transparent"
      };
      color: ${
        status.variant === "filled"
          ? "white"
          : status.color === "success"
          ? "#4caf50"
          : status.color === "error"
          ? "#f44336"
          : "#2196f3"
      };
      border: ${
        status.variant === "outlined"
          ? `1px solid ${
              status.color === "success"
                ? "#4caf50"
                : status.color === "error"
                ? "#f44336"
                : "#2196f3"
            }`
          : "none"
      };
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
      display: inline-block;
      min-width: 120px;
      text-align: center;
    ">${status.label}</span>`;
    return td;
  };

  // === COLUMNS ===
  const allColumns = useMemo(
    () => [
      { data: "no_quotation", title: "No. Quotation" },
      { data: "title_quotation", title: "Title" },
      { data: "client_name", title: "Client" },
      { data: "client_pic", title: "PIC" },
      { data: "quotation_date", title: "Date", renderer: dateRenderer },
      { data: "quotation_value", title: "Value", renderer: valueRenderer },
      { data: "quotation_weeks", title: "Week" },
      {
        data: "revision_quotation_date",
        title: "Revision Date",
        renderer: dateRenderer,
      },
      { data: "revisi", title: "Revision" },
      { data: "status", title: "Status", renderer: statusRenderer },
      { data: "notes", title: "Notes" },
    ],
    []
  );

  // === VISIBILITY STATE ===
  const initialVisibility = {};
  allColumns.forEach((col) => {
    initialVisibility[col.data] = true;
  });
  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  const handleToggleColumn = (field) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // === FETCH DATA ===
  const fetchQuotations = async () => {
    try {
      const res = await api.get("/marketing-report");
      const data = res.data.data.map((q, idx) => ({
        id: idx + 1,
        no_quotation: q.no_quotation,
        title_quotation: q.title_quotation,
        client_name: q.client?.name || "-",
        client_pic: q.client_pic || "-",
        quotation_date: q.quotation_date,
        quotation_value: q.quotation_value,
        quotation_weeks: q.quotation_weeks || "-",
        revision_quotation_date: q.revision_quotation_date,
        revisi: q.revisi || "-",
        status: q.status,
        notes: q.notes || "-",
      }));
      setQuotations(data);
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to fetch marketing report",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // === FILTER & PAGINATION ===
  const filteredData = filterBySearch(quotations, searchTerm);
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const rowHeight = 40; // tinggi tiap row
  const headerHeight = 50; // tinggi header Handsontable
  const tableHeight = paginatedData.length * rowHeight + headerHeight + 2;

  const handleChangePage = (e, newPage) => setPage(newPage);
  const handleChangePageSize = (e) => {
    setPageSize(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      {/* Loading */}
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
          placeholder="Search marketing..."
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
      </Stack>

      {/* Handsontable */}
      <HotTable
        ref={hotTableRef}
        data={paginatedData}
        colHeaders={allColumns.map((c) => c.title)}
        columns={allColumns}
        width="100%"
        height={tableHeight} // <=== tinggi dinamis
        rowHeights={rowHeight} // konsisten tinggi baris
        manualColumnResize
        licenseKey="non-commercial-and-evaluation"
        manualColumnFreeze
        fixedColumnsLeft={2}
        stretchH="all"
        filters
        dropdownMenu
        manualColumnMove
        hiddenColumns={{
          columns: allColumns
            .map((col, i) => (columnVisibility[col.data] ? null : i))
            .filter((i) => i !== null),
          indicators: true,
        }}
        className="ht-theme-horizon"
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

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
