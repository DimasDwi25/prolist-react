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
} from "@mui/material";
import ReactDOM from "react-dom";

import api from "../../api/api";
import ViewInvoicesModal from "../../components/modal/ViewInvoicesModal";
// import { getUser } from "../../utils/storage";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import FilterBar from "../../components/filter/FilterBar";
import DashboardCard from "../../components/card/DashboardCard";
import { filterBySearch } from "../../utils/filter";
import { formatValue } from "../../utils/formatValue";

export default function InvoiceSummary() {
  const hotTableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceSummaries, setInvoiceSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    range_type: "monthly",
    month: null,
    from_date: "",
    to_date: "",
  });

  const [stats, setStats] = useState({
    availableYears: [new Date().getFullYear(), new Date().getFullYear() + 1],
  });

  // const user = getUser();
  // const userRole = user?.role?.name?.toLowerCase();

  // Definisi kolom
  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 60,
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

          const icon = document.createElement("span");
          icon.innerHTML = "👁️";
          viewBtn.appendChild(icon);

          viewBtn.onclick = () => {
            const project = instance.getSourceDataAtRow(row);
            if (project?.pn_number) {
              setSelectedProjectId(project.pn_number);
              setOpenViewModal(true);
            }
          };

          wrapper.appendChild(viewBtn);
          td.appendChild(wrapper);
          return td;
        },
      },
      { data: "pn_number", title: "PN Number" },
      { data: "project_name", title: "Project Name" },
      { data: "client", title: "Client" },
      {
        data: "project_value",
        title: "Project Value",
        renderer: (instance, td, row, col, prop, value) => {
          td.style.fontWeight = "600";
          td.style.color = "green";
          td.innerText = formatValue(value).formatted;
          return td;
        },
      },
      {
        data: "invoice_total",
        title: "Invoice Total",
        renderer: (instance, td, row, col, prop, value) => {
          td.style.fontWeight = "600";
          td.style.color = "green";
          td.innerText = formatValue(value).formatted;
          return td;
        },
      },
      {
        data: "payment_total",
        title: "Payment Total",
        renderer: (instance, td, row, col, prop, value) => {
          td.style.fontWeight = "600";
          td.style.color = "green";
          td.innerText = formatValue(value).formatted;
          return td;
        },
      },
      {
        data: "outstanding_invoice",
        title: "Outstanding Invoice",
        renderer: (instance, td, row, col, prop, value) => {
          td.style.fontWeight = "600";
          td.style.color = "green";
          td.innerText = formatValue(value).formatted;
          return td;
        },
      },
      {
        data: "outstanding_amount",
        title: "Outstanding Amount",
        renderer: (instance, td, row, col, prop, value) => {
          td.style.fontWeight = "600";
          td.style.color = "green";
          td.innerText = formatValue(value).formatted;
          return td;
        },
      },
      { data: "remarks", title: "Remarks" },
    ],
    []
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/finance/invoice-summary", {
        params: filters,
      });
      const data = response.data || {};
      setInvoiceSummaries(data.projects || []);
      // Summary stats can be calculated later if needed
      setStats((prev) => ({
        ...prev,
        availableYears: data.availableYears || [
          new Date().getFullYear(),
          new Date().getFullYear() + 1,
        ],
      }));
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to fetch invoice summary data",
        severity: "error",
      });
      setInvoiceSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilter = (newFilters) => {
    const payload = {
      year: newFilters.year,
      range_type: newFilters.rangeType,
    };

    if (newFilters.month) payload.month = newFilters.month;
    if (newFilters.from) payload.from_date = newFilters.from;
    if (newFilters.to) payload.to_date = newFilters.to;

    setFilters(payload);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = filterBySearch(invoiceSummaries, searchTerm).map(
    (item) => ({
      actions: "👁️",
      pn_number: item.pn_number || "",
      project_name: item.project_name || "",
      client: item.client || "",
      project_value: item.project_value || 0,
      invoice_total: item.invoice_total || 0,
      payment_total: item.payment_total || 0,
      outstanding_invoice: item.outstanding_invoice || 0,
      outstanding_amount: item.outstanding_amount || 0,
      remarks: item.remarks || "",
    })
  );
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  return (
    <Box sx={{ position: "relative" }}>
      <LoadingOverlay loading={loading} />

      <FilterBar
        stats={stats}
        onFilter={handleFilter}
        initialFilters={{
          year: new Date().getFullYear(),
          rangeType: "monthly",
          month: null,
          from: "",
          to: "",
        }}
      />

      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        alignItems="center"
        mt={3}
        mb={2}
      >
        <TextField
          size="small"
          placeholder="Search projects..."
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
            fixedColumnsLeft={3}
            stretchH="all"
            filters
            dropdownMenu
            className="ht-theme-horizon"
            manualColumnMove
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

      <ViewInvoicesModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedProjectId(null);
        }}
        projectId={selectedProjectId}
        year={filters.year}
        onDataUpdated={fetchData}
      />

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
