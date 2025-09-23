import React, { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  Box,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";

import api from "../../../api/api"; // Axios instance

import { useNavigate } from "react-router-dom";

export default function WorkOrderPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      flex: 1,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<Typography color="primary">👁️</Typography>}
          label="View"
          onClick={() => {
            // Navigasi ke halaman Material Request dengan PN number
            navigate(`/work-order/${params.row.pn_number}`);
          }}
        />,
      ],
    },
    {
      field: "project_number",
      headerName: "Project Number",
      flex: 4,
      renderCell: (params) => (
        <Typography fontWeight={600}>{params.value}</Typography>
      ),
    },
    {
      field: "project_name",
      headerName: "Project Name",
      flex: 5,
      renderCell: (params) => (
        <Typography noWrap fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "client_name",
      headerName: "Client",
      flex: 5,
      renderCell: (params) => (
        <Typography noWrap fontWeight={500}>
          {params.value || "-"}
        </Typography>
      ),
    },

    {
      field: "total_wo",
      headerName: "TOTAL Wo",
      flex: 2,
      renderCell: (params) => params.value ?? 0, // gunakan ?? untuk null/undefined
    },

    {
      field: "status_project",
      headerName: "Status",
      flex: 2,
      renderCell: (params) => {
        const statusName = params.value?.name || "-";
        return (
          <Chip
            label={statusName}
            color="primary"
            size="small"
            variant="outlined"
          />
        );
      },
    },
  ];

  const fetchProjects = async () => {
    try {
      const res = await api.get("/wo-summary");

      const projectsData = res.data?.data?.map((p) => {
        return {
          id: p.pn_number,
          ...p,
          categories_name: p.category?.name || "-",
          status_project: p.status_project || {
            id: Number(p.status_project_id),
          },
          client_name: p.quotation?.client_name,
          project_number: p.project_number,
          project_name: p.project_name,
          total_wo: p.total_wo,
        };
      });

      console.log(projectsData);

      setProjects(projectsData);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  // --- Fetch clients & projects sekaligus ---
  const loadData = async () => {
    setLoading(true);
    try {
      // --- Projects ---
      await fetchProjects();
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ height: 600, width: "100%" }}>
      <div className="flex justify-end mb-2"></div>
      <div className="table-wrapper">
        <div className="table-inner">
          <DataGrid
            rows={projects}
            getRowId={(row) => row.pn_number}
            columns={columns.map((col) => ({
              ...col,
              minWidth: col.minWidth || 150, // kasih default minWidth
              flex: col.flex || 1,
            }))}
            loading={loading}
            showToolbar
            pagination
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            disableSelectionOnClick
            onRowClick={(params) => {
              navigate(`/work-order/${params.row.pn_number}`);
            }}
            sx={{
              borderRadius: 2,
              ".MuiDataGrid-cell": { py: 1.2 },
              ".MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5",
                fontWeight: 600,
              },
              ".MuiDataGrid-footerContainer": {
                borderTop: "1px solid #e0e0e0",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
