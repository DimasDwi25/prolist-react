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
  IconButton,
} from "@mui/material";
import { Eye } from "lucide-react";
import api from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import { filterBySearch } from "../../utils/filter";

export default function SalesReportTable() {
  const hotTableRef = useRef(null);
  const [projects, setProjects] = useState([]);
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

  // === COLUMNS ===
  const allColumns = useMemo(
    () => [
      { data: "project_number", title: "Project Number" },
      { data: "project_name", title: "Project Name" },
      { data: "category_name", title: "Category" },
      { data: "quotation_number", title: "Quotation" },
      { data: "po_date", title: "PO Date", renderer: dateRenderer },
      { data: "po_value", title: "Value", renderer: valueRenderer },
      { data: "po_number", title: "PO Number" },
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
  const fetchProjects = async () => {
    try {
      const res = await api.get("/sales-report");
      const data = res.data?.data?.map((p, idx) => ({
        id: idx + 1,
        project_number: p.project_number,
        project_name: p.project_name,
        category_name: p.category?.name || "-",
        quotation_number: p.quotation?.no_quotation || "-",
        po_date: p.po_date,
        po_value: p.po_value,
        po_number: p.po_number,
      }));
      setProjects(data);
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to fetch sales report",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // === FILTER & PAGINATION ===
  const filteredData = filterBySearch(projects, searchTerm);
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
          placeholder="Search sales..."
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
