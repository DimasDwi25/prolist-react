import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Snackbar,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import api from "../../api/api";

export default function SalesReportTable() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { field: "project_number", headerName: "Project Number", flex: 1 },
    { field: "project_name", headerName: "Project Name", flex: 2 },
    {
      field: "category_name",
      headerName: "Category",
      flex: 1,
      valueGetter: (value, row) => row?.category?.name ?? "-",
    },
    {
      field: "quotation_number",
      headerName: "Quotation",
      flex: 1,
      valueGetter: (value, row) => row?.quotation?.no_quotation ?? "-",
    },
    {
      field: "po_date",
      headerName: "PO Date",
      flex: 1,
      valueFormatter: (params) => {
        if (!params || !params.value) return "-";
        const date = new Date(params.value);
        if (isNaN(date)) return "-";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      },
      renderCell: (params) => {
        if (!params.value)
          return <Typography color="text.secondary">-</Typography>;
        const date = new Date(params.value);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return (
          <Typography color="text.secondary" noWrap>
            {`${day}-${month}-${year}`}
          </Typography>
        );
      },
    },
    {
      field: "po_value",
      headerName: "Value",
      flex: 1,
      preProcessEditCellProps: (params) => {
        let value = params.props.value;

        if (value === "" || value === undefined || isNaN(value)) {
          value = null; // biar aman
        } else {
          value = Number(value);
        }

        return { ...params.props, value };
      },
      valueFormatter: (params) => {
        if (!params || params.value == null) return "-";
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(params.value);
      },
      renderCell: (params) => (
        <Typography fontWeight={600} color="green">
          {params.value != null
            ? new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(params.value)
            : "-"}
        </Typography>
      ),
    },

    { field: "po_number", headerName: "PO Number", flex: 1 },
  ];

  // Fetch data
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/sales-report");
        setProjects(res.data.data);
      } catch (err) {
        console.error(
          "Error fetching sales report:",
          err.response?.data || err
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div style={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={projects}
        columns={columns}
        getRowId={(row) => row.pn_number}
        loading={loading}
        showToolbar
        pagination
        rowsPerPageOptions={[10, 20, 50]}
        disableSelectionOnClick
        pageSizeOptions={[10, 20, 50]}
        sx={{
          borderRadius: 2,
          ".MuiDataGrid-cell": { py: 1.2 },
          ".MuiDataGrid-columnHeaders": {
            backgroundColor: "#f5f5f5",
            fontWeight: 600,
          },
          ".MuiDataGrid-footerContainer": { borderTop: "1px solid #e0e0e0" },
        }}
      />
    </div>
  );
}
