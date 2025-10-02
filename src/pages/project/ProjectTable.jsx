import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import { Plus, Eye } from "lucide-react";
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
} from "@mui/material";
import ReactDOM from "react-dom";

import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import ProjectFormModal from "../project/ProjectFormModal";
import { getUser } from "../../utils/storage";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import { filterBySearch } from "../../utils/filter";

export default function ProjectTable() {
  const navigate = useNavigate();
  const hotTableRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

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
  const engineerRoles = [
    "project controller",
    "project manager",
    "engineering_admin",
  ].includes(userRole);
  const suc = ["warehouse"].includes(userRole);

  const formatDate = (val) => {
    if (!val) return "-";
    try {
      const date = new Date(val);
      if (isNaN(date)) return "-";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch {
      return "-";
    }
  };

  const formatValue = (val) => {
    if (val == null || val === "" || val === undefined) return "-";

    // kalau object, coba ambil key value/amount/nominal
    if (typeof val === "object") {
      const maybeNumber =
        val.value ?? val.amount ?? val.nominal ?? val.total ?? null;
      if (maybeNumber == null) return "-";
      val = maybeNumber;
    }

    // parse ke number
    const num = Number(val);
    if (isNaN(num)) return "-";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // utils
  const safeText = (val, fallback = "-") =>
    val == null || val === "" ? fallback : String(val);

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = safeText(formatDate(value));
    return td;
  };

  const valueRenderer = (instance, td, row, col, prop, value) => {
    td.style.fontWeight = "600";
    td.style.color = "green";
    td.innerText = safeText(formatValue(value));
    return td;
  };

  const percentRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = `${value != null ? value : 0}%`;
    return td;
  };

  const statusRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value?.name || "-";
    return td;
  };

  const confirmationRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = Number(value) === 1 ? "✅ Yes" : "❌ No";
    return td;
  };

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
          const button = document.createElement("button");
          button.style.cursor = "pointer";
          button.style.border = "none";
          button.style.background = "transparent";
          button.title = "View";

          const icon = document.createElement("span");
          icon.innerHTML = "👁️";
          button.appendChild(icon);

          button.onclick = () => {
            const project = instance.getSourceDataAtRow(row);
            if (project?.id) {
              if (marketingRoles) {
                navigate(`/projects/${project.id}`);
              } else if (engineerRoles) {
                navigate(`/engineer/projects/${project.id}`);
              } else if (suc) {
                navigate(`/warehouse/projects/${project.id}`);
              }
            }
          };

          td.appendChild(button);
          return td;
        },
      },
      { data: "project_number", title: "Project Number" },
      { data: "project_name", title: "Project Name" },
      { data: "categories_name", title: "Category" },
      { data: "no_quotation", title: "No. Quotation" },
      { data: "client_name", title: "Client" },
      { data: "phc_dates", title: "PHC Date", renderer: dateRenderer },
      { data: "target_dates", title: "Target Date", renderer: dateRenderer },
      {
        data: "dokumen_finish_date",
        title: "Document Finish Date",
        renderer: dateRenderer,
      },
      {
        data: "engineering_finish_date",
        title: "Engineering Finish Date",
        renderer: dateRenderer,
      },
      { data: "po_number", title: "PO Number" },
      { data: "po_value", title: "PO Value", renderer: valueRenderer },
      { data: "po_date", title: "PO Date", renderer: dateRenderer },
      { data: "sales_weeks", title: "Sales Weeks" },
      { data: "mandays_engineer", title: "Mandays Engineer" },
      { data: "mandays_technician", title: "Mandays Technician" },
      { data: "material_status", title: "Material Status" },
      { data: "jumlah_invoice", title: "Jumlah Invoice" },
      {
        data: "project_progress",
        title: "Progress (%)",
        renderer: percentRenderer,
      },
      {
        data: "is_confirmation_order",
        title: "Confirmation Order",
        renderer: confirmationRenderer,
      },
      { data: "parent_pn_number", title: "Parent PN" },
      { data: "status_project", title: "Status", renderer: statusRenderer },
    ],
    [marketingRoles, engineerRoles, suc, navigate]
  );

  // Role-based filter
  const roleGroupColumnMap = {
    marketing: allColumns.map((c) => c.data),
    engineer: [
      "actions",
      "project_number",
      "project_name",
      "categories_name",
      "client_name",
      "phc_dates",
      "target_dates",
      "material_status",
      "po_number",
      "po_date",
      "project_progress",
      "status_project",
    ],
    warehouse: [
      "actions",
      "project_number",
      "project_name",
      "categories_name",
      "client_name",
      "phc_dates",
      "target_dates",
      "material_status",
      "po_number",
      "po_date",
      "project_progress",
      "status_project",
    ],
    super_admin: allColumns.map((c) => c.data),
  };

  let roleGroup = null;
  if (marketingRoles) roleGroup = "marketing";
  else if (engineerRoles) roleGroup = "engineer";
  else if (suc) roleGroup = "warehouse";
  else if (userRole === "super_admin") roleGroup = "super_admin";

  const allowedColumns = roleGroup ? roleGroupColumnMap[roleGroup] : [];
  const filteredColumns = allColumns.filter((col) =>
    allowedColumns.includes(col.data)
  );

  const initialVisibility = {};
  filteredColumns.forEach((col) => {
    initialVisibility[col.data] = true; // semua kolom default visible
  });
  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0); // reset ke halaman pertama
  };

  const handleToggleColumn = (field) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const fetchProjects = async () => {
    try {
      const resProjects = await api.get("/projects");
      const clientsData = clients.length ? clients : [];

      const projectsData = resProjects.data?.data?.map((p) => {
        let clientName = "-";
        const projectClient = clientsData.find((cl) => cl.id == p.client_id);
        if (projectClient) clientName = projectClient.name;
        else if (p.quotation?.client?.name)
          clientName = p.quotation.client.name;

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

  const loadData = async () => {
    setLoading(true);
    try {
      const resClients = await api.get("/clients");
      setClients(resClients.data.map((c) => ({ ...c, id: Number(c.id) })));

      await fetchProjects();

      const resQuotations = await api.get("/quotations");
      setQuotations(
        resQuotations.data?.map((q) => ({ ...q, id: q.quotation_number }))
      );

      const resCategory = await api.get("/categories-project");
      setCategories(resCategory.data?.map((q) => ({ ...q, id: q.id })));
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCellChange = async (changes, source) => {
    if (source === "loadData" || !changes) return;

    for (let [rowIndex, prop, oldValue, newValue] of changes) {
      const project = projects[rowIndex];
      if (oldValue === newValue) continue;

      let payload = {};
      switch (prop) {
        case "status_project":
          payload = { status_project_id: Number(newValue?.id) };
          break;
        case "categories_name":
          payload = { category_id: Number(newValue?.id) || Number(newValue) };
          break;
        case "target_dates":
          payload = { target_dates: newValue };
          break;
        default:
          payload[prop] = newValue;
      }

      try {
        const res = await api.put(`/projects/${project.id}`, payload);
        setProjects((prev) => {
          const newProjects = [...prev];
          newProjects[rowIndex] = {
            ...newProjects[rowIndex],
            ...res.data.data,
          };
          return newProjects;
        });
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
      }
    }
  };

  const filteredData = filterBySearch(projects, searchTerm).map((p) => ({
    actions: "👁️",
    id: p.pn_number, // untuk navigasi (pastikan konsisten)
    project_number: p.project_number,
    project_name: p.project_name,
    categories_name: p.categories_name,
    no_quotation: p.no_quotation,
    client_name: p.client_name,
    phc_dates: formatDate(p.phc_dates),
    target_dates: formatDate(p.target_dates),
    dokumen_finish_date: formatDate(p.dokumen_finish_date),
    engineering_finish_date: formatDate(p.engineering_finish_date),
    po_number: p.po_number,
    po_value: p.po_value,
    po_date: formatDate(p.po_date),
    sales_weeks: p.sales_weeks,
    mandays_engineer: p.mandays_engineer,
    mandays_technician: p.mandays_technician,
    material_status: p.material_status,
    jumlah_invoice: p.jumlah_invoice,
    project_progress: p.project_progress,
    is_confirmation_order: p.is_confirmation_order,
    parent_pn_number: p.parent_pn_number,
    status_project: p.status_project,
  }));
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

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

        <ColumnVisibilityModal
          columns={filteredColumns}
          columnVisibility={columnVisibility}
          handleToggleColumn={handleToggleColumn}
        />

        {!engineerRoles && !suc && (
          <IconButton
            onClick={() => setOpenCreateModal(true)}
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
        )}
      </Stack>

      {/* Handsontable */}
      <HotTable
        ref={hotTableRef}
        data={paginatedData}
        colHeaders={filteredColumns.map((c) => c.title)}
        columns={filteredColumns}
        width="100%"
        height={450}
        manualColumnResize
        licenseKey="non-commercial-and-evaluation"
        manualColumnFreeze
        fixedColumnsLeft={3}
        afterChange={handleCellChange}
        stretchH="all"
        filters
        dropdownMenu
        className="ht-theme-horizon"
        manualColumnMove
        hiddenColumns={{
          columns: filteredColumns
            .map((col, i) => (columnVisibility[col.data] ? null : i))
            .filter((i) => i !== null),
          indicators: true,
        }}
      />

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

      {/* Modal Create Project */}
      {openCreateModal && (
        <ProjectFormModal
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
          clients={clients}
          quotations={quotations}
          projects={projects}
          categories={categories}
          token={""}
          onSave={loadData}
        />
      )}
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
