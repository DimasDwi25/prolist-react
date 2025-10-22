import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import { Plus } from "lucide-react";
import {
  Stack,
  Box,
  Snackbar,
  Alert,
  IconButton,
  TextField,
  TablePagination,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import api from "../../../api/api";
import LoadingOverlay from "../../../components/loading/LoadingOverlay";
import ColumnVisibilityModal from "../../../components/ColumnVisibilityModal";
import { filterBySearch } from "../../../utils/filter";
import { getClientName } from "../../../utils/getClientName";
import ViewProjectsModalManPower from "../../../components/modal/ViewProjectsModalManPower";

// ---------------- Utils ---------------- //
const formatDate = (val) => {
  if (!val) return "-";
  try {
    const date = new Date(val);
    if (isNaN(date)) return "-";
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  } catch {
    return "-";
  }
};

const safeText = (val, fallback = "-") =>
  val == null || val === "" ? fallback : String(val);

const dateRenderer = (instance, td, row, col, prop, value) => {
  td.innerText = safeText(formatDate(value));
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

// ---------------- Component ---------------- //
export default function ManPowerProjectTable() {
  const navigate = useNavigate();
  const hotTableRef = useRef(null);

  // State
  const [projects, setProjects] = useState([]);
  const [clients] = useState([]);
  const [quotations] = useState([]);
  const [categories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch Projects
  const fetchProjects = async () => {
    try {
      const res = await api.get("/man-power/projects");
      const projectsData = res.data?.data?.map((p) => ({
        id: p.pn_number,
        project_number: p.project_number,
        project_name: p.project_name,
        categories_name: p.category?.name || "-",
        client_name: getClientName(p),
        phc_dates: p.phc_dates,
        target_dates: p.target_dates,
        dokumen_finish_date: p.dokumen_finish_date,
        engineering_finish_date: p.engineering_finish_date,
        mandays_engineer: p.mandays_engineer,
        mandays_technician: p.mandays_technician,
        material_status: p.material_status,
        project_progress: p.project_progress,
        status_project: p.status_project || { id: p.status_project_id },
      }));
      setProjects(projectsData);
    } catch (err) {
      console.error("Error fetching projects:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Columns
  const columns = useMemo(
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
          button.innerHTML = "👁️";

          button.onclick = () => {
            const project = instance.getSourceDataAtRow(row);
            if (project?.id) {
              setSelectedProject(project);
              setOpenViewModal(true);
            }
          };

          td.appendChild(button);
          return td;
        },
      },
      { data: "project_number", title: "Project Number" },
      { data: "project_name", title: "Project Name" },
      { data: "categories_name", title: "Category" },
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
      { data: "mandays_engineer", title: "Mandays Engineer" },
      { data: "mandays_technician", title: "Mandays Technician" },
      { data: "material_status", title: "Material Status" },
      {
        data: "project_progress",
        title: "Progress (%)",
        renderer: percentRenderer,
      },
      { data: "status_project", title: "Status", renderer: statusRenderer },
    ],
    [navigate]
  );

  // Column Visibility
  const initialVisibility = columns.reduce((acc, col) => {
    acc[col.data] = true;
    return acc;
  }, {});
  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  // Filter + Pagination
  const filteredData = useMemo(() => {
    return filterBySearch(projects, searchTerm).map((p) => ({
      ...p,
      phc_dates: formatDate(p.phc_dates),
      target_dates: formatDate(p.target_dates),
      dokumen_finish_date: formatDate(p.dokumen_finish_date),
      engineering_finish_date: formatDate(p.engineering_finish_date),
    }));
  }, [projects, searchTerm]);

  const paginatedData = useMemo(
    () => filteredData.slice(page * pageSize, page * pageSize + pageSize),
    [filteredData, page, pageSize]
  );

  return (
    <Box sx={{ position: "relative" }}>
      <LoadingOverlay loading={loading} />

      {/* Controls */}
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
          sx={{ width: 240 }}
        />

        <ColumnVisibilityModal
          columns={columns}
          columnVisibility={columnVisibility}
          handleToggleColumn={(field) =>
            setColumnVisibility((prev) => ({ ...prev, [field]: !prev[field] }))
          }
        />
      </Stack>

      {/* Handsontable */}
      {/* Handsontable */}
      {paginatedData.length > 0 ? (
        <HotTable
          ref={hotTableRef}
          data={paginatedData}
          colHeaders={columns.map((c) => c.title)}
          columns={columns}
          width="100%"
          height={450}
          manualColumnResize
          manualColumnFreeze
          fixedColumnsLeft={3}
          stretchH="all"
          filters
          dropdownMenu
          className="ht-theme-horizon"
          licenseKey="non-commercial-and-evaluation"
          hiddenColumns={{
            columns: columns
              .map((col, i) => (columnVisibility[col.data] ? null : i))
              .filter((i) => i !== null),
            indicators: true,
          }}
        />
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          height={300}
          sx={{ border: "1px dashed #ccc", borderRadius: 2 }}
        >
          <p style={{ color: "#666", fontSize: "1rem" }}>
            🚫 No projects available
          </p>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Modal Create */}
      {openCreateModal && (
        <ProjectFormModal
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
          clients={clients}
          quotations={quotations}
          projects={projects}
          categories={categories}
          token=""
          onSave={fetchProjects}
        />
      )}

      {/* Modal View */}
      {openViewModal && selectedProject && (
        <ViewProjectsModalManPower
          open={openViewModal}
          onClose={() => {
            setOpenViewModal(false);
            setSelectedProject(null);
          }}
          pn_number={selectedProject.id}
        />
      )}

      {/* Pagination */}
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
}
