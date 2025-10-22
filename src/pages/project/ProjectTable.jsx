import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import { Plus, Eye, Key } from "lucide-react";
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
import ProjectDetailsModal from "../../components/modal/ProjectDetailsModal";
import ViewProjectsModal from "../../components/modal/ViewProjectsModal";
import { getUser } from "../../utils/storage";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import { filterBySearch } from "../../utils/filter";
import { formatDate } from "../../utils/FormatDate";
import { getClientName } from "../../utils/getClientName";

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
  const [selectedProject, setSelectedProject] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedPnNumber, setSelectedPnNumber] = useState(null);

  const [openViewProjectsModal, setOpenViewProjectsModal] = useState(false);
  const [selectedPnNumberForViewProjects, setSelectedPnNumberForViewProjects] =
    useState(null);

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
    td.innerText = formatDate(value);
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
              if (engineerRoles) {
                setSelectedPnNumberForViewProjects(project.pn_number);
                setOpenViewProjectsModal(true);
              } else {
                setSelectedPnNumber(project.pn_number);
                setOpenDetailsModal(true);
              }
            }
          };

          wrapper.appendChild(viewBtn);

          // ✏️ Edit button (hanya role marketing/super_admin)
          if (!engineerRoles && !suc) {
            const editBtn = document.createElement("button");
            editBtn.style.cursor = "pointer";
            editBtn.style.border = "none";
            editBtn.style.background = "transparent";
            editBtn.title = "Edit";
            editBtn.innerHTML = "✏️";
            editBtn.onclick = () => {
              const rowData = instance.getSourceDataAtRow(row); // ⬅️ ambil data row

              const fullProject = projects.find(
                (p) => p.pn_number === rowData.pn_number
              );
              setSelectedProject(fullProject);
              setOpenProjectModal(true);
            };
            wrapper.appendChild(editBtn);
          }

          td.appendChild(wrapper);
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
    [marketingRoles, engineerRoles, suc, navigate, projects]
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
      "dokumen_finish_date",
      "engineering_finish_date",
      "mandays_engineer",
      "mandays_technician",
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

      const projectsData = resProjects.data?.data?.map((p) => {
        return {
          pn_number: p.pn_number,
          ...p,
          client_name: getClientName(p),
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

  // Expose refresh function to window for modal communication
  useEffect(() => {
    window.parentRefreshProjects = async () => {
      await fetchProjects();
      // Refresh the table data after fetching
      const resProjects = await api.get("/projects");
      const projectsData = resProjects.data?.data?.map((p) => {
        return {
          pn_number: p.pn_number,
          ...p,
          client_name: getClientName(p),
          no_quotation: p.quotation?.no_quotation || "-",
          categories_name: p.category?.name || "-",
          status_project: p.status_project || {
            id: Number(p.status_project_id),
          },
        };
      });
      setProjects(projectsData);
    };
    return () => {
      delete window.parentRefreshProjects;
    };
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
        const res = await api.put(`/projects/${project.pn_number}`, payload);
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
    pn_number: p.pn_number, // untuk navigasi (pastikan konsisten)
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
            onClick={() => {
              setSelectedProject(null); // create mode
              setOpenProjectModal(true);
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
        )}
      </Stack>

      {/* Handsontable */}
      <div className="table-wrapper">
        <div className="table-inner">
          <HotTable
            ref={hotTableRef}
            data={paginatedData}
            colHeaders={filteredColumns.map((c) => c.title)}
            columns={filteredColumns}
            width="auto"
            height={tableHeight}
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

      {/* Modal Project (Create/Edit) */}
      {openProjectModal && (
        <ProjectFormModal
          open={openProjectModal}
          onClose={() => {
            setOpenProjectModal(false);
            setSelectedProject(null); // Reset selected project saat close
          }}
          clients={clients}
          quotations={quotations}
          projects={projects}
          categories={categories}
          token={""}
          onSave={() => {
            setSnackbar({
              open: true,
              message: selectedProject
                ? "Project updated successfully!"
                : "Project created successfully!",
              severity: "success",
            });
            loadData();
          }}
          project={selectedProject}
        />
      )}

      {/* Project Details Modal */}
      <ProjectDetailsModal
        open={openDetailsModal}
        onClose={() => {
          setOpenDetailsModal(false);
          setSelectedPnNumber(null);
        }}
        pn_number={selectedPnNumber}
      />

      {/* View Projects Modal */}
      <ViewProjectsModal
        open={openViewProjectsModal}
        onClose={() => {
          setOpenViewProjectsModal(false);
          setSelectedPnNumberForViewProjects(null);
        }}
        pn_number={selectedPnNumberForViewProjects}
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
