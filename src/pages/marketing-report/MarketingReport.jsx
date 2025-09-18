import React, { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { Typography, Chip } from "@mui/material";

import api from "../../api/api"; // Axios instance dengan JWT

export default function MarketingReport() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Columns ---
  const columns = [
    {
      field: "no_quotation",
      headerName: "No. Quotation",
      flex: 1,
      renderCell: (params) => (
        <Typography fontWeight={600}>{params.value}</Typography>
      ),
    },
    {
      field: "title_quotation",
      headerName: "Title",
      flex: 2,
      renderCell: (params) => (
        <Typography noWrap fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "client_name",
      headerName: "Client",
      flex: 1,
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "client_pic",
      headerName: "PIC",
      flex: 1,
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "quotation_date",
      headerName: "Date",
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
      field: "quotation_value",
      headerName: "Value",
      flex: 1,
      editable: true,
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

    {
      field: "quotation_weeks",
      headerName: "Week",
      flex: 1,
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },

    {
      field: "revision_quotation_date",
      headerName: "Revision Date",
      flex: 1,
      type: "date",
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
      field: "revisi",
      headerName: "Revision",
      flex: 1,
      type: "number",
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },

    {
      field: "status",
      headerName: "Status",
      flex: 1,
      valueOptions: ["A", "D", "E", "F", "O"], // kode status
      renderCell: (params) => {
        // Mapping kode ke label dan warna
        const statusMap = {
          A: { label: "[A] ✓ Completed", color: "success", variant: "filled" },
          D: {
            label: "[D] ⏳ No PO Yet",
            color: "warning",
            variant: "outlined",
          },
          E: { label: "[E] ❌ Cancelled", color: "error", variant: "outlined" },
          F: {
            label: "[F] ⚠️ Lost Bid",
            color: "warning",
            variant: "outlined",
          },
          O: { label: "[O] 🕒 On Going", color: "info", variant: "outlined" },
        };

        const status = statusMap[params.value] || {
          label: params.value,
          color: "default",
          variant: "outlined",
        };

        return (
          <Chip
            label={status.label}
            color={status.color}
            size="small"
            variant={status.variant}
            sx={{ fontWeight: 600, minWidth: 120, textAlign: "center" }}
          />
        );
      },
    },

    {
      field: "notes",
      headerName: "Notes",
      flex: 2,
      renderCell: (params) => (
        <Typography color="text.secondary" noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },
  ];

  const [columnVisibility, setColumnVisibility] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.field]: true }), {})
  );

  const fetchQuotations = async () => {
    try {
      const res = await api.get("/marketing-report");
      setQuotations(
        res.data.data.map((q) => ({
          id: q.quotation_number,
          ...q,
          quotation_number: q.quotation_number,
          client_name: q.client?.name,
        }))
      );
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // --- Panggil di useEffect pertama kali ---
  useEffect(() => {
    fetchQuotations();
  }, []);

  return (
    <div className="table-wrapper">
      <div className="table-inner">
        <DataGrid
          rows={quotations}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          showToolbar
          pagination
          rowsPerPageOptions={[10, 20, 50]}
          disableSelectionOnClick
          pageSizeOptions={[10, 20, 50]}
          columnVisibilityModel={columnVisibility}
          onColumnVisibilityModelChange={(newModel) =>
            setColumnVisibility(newModel)
          }
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
  );
}
