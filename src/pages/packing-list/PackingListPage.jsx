import React, { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { Button, Stack, MenuItem, Select, Typography } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import api from "../../api/api";
import FormPackingListModal from "../../components/modal/FormPackingListModal";

export default function PackingListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [openCreateModal, setOpenCreateModal] = useState(false); // <- state modal

  const [formValues, setFormValues] = useState({
    pn_id: "",
    destination: "",
    expedition_name: "",
    pl_date: "",
    ship_date: "",
    pl_type: "internal",
    client_pic: "",
    int_pic: "",
    receive_date: "",
    pl_return_date: "",
    remark: "",
    pl_number: "",
    pl_id: "",
  });

  // Fetch packing lists
  const fetchPackingLists = async () => {
    setLoading(true);
    try {
      const res = await api.get("/packing-lists");
      setRows(
        res.data.map((pl) => ({
          id: pl.pl_id,
          pl_id: pl.pl_id,
          pl_number: pl.pl_number,
          pn_id: pl.project?.project_number,
          client_pic: pl.client_pic || null,
          int_pic: pl.project?.int_pic_name || null,
          int_pic_id: pl.project?.int_pic || null,
          destination: pl.destination,
          expedition_name: pl.expedition_name,
          pl_date: pl.pl_date ? new Date(pl.pl_date) : null,
          ship_date: pl.ship_date ? new Date(pl.ship_date) : null,
          receive_date: pl.receive_date ? new Date(pl.receive_date) : null,
          pl_return_date: pl.pl_return_date
            ? new Date(pl.pl_return_date)
            : null,
          pl_type: pl.pl_type,
          remark: pl.remark,
          created_by: pl.creator?.name || null,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPackingLists();
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this packing list?")) return;
    try {
      await api.delete(`/packing-lists/${id}`);
      fetchPackingLists();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`; // YYYY-MM-DD
  };

  const processRowUpdate = async (newRow) => {
    try {
      const payload = {
        ...newRow,
        pl_date: formatDate(newRow.pl_date),
        ship_date: formatDate(newRow.ship_date),
        receive_date: formatDate(newRow.receive_date),
        pl_return_date: formatDate(newRow.pl_return_date),
        int_pic: newRow.int_pic_id,
      };
      await api.put(`/packing-lists/${newRow.pl_id}`, payload);
      setRows((prev) =>
        prev.map((row) => (row.id === newRow.id ? { ...row, ...newRow } : row))
      );
      return newRow;
    } catch (err) {
      console.error(err);
      return rows.find((r) => r.id === newRow.id);
    }
  };

  const handleOpenCreateModal = async () => {
    try {
      const { data } = await api.get("/packing-lists/generate-number");
      setFormValues((prev) => ({
        ...prev,
        pl_number: data.pl_number,
        pl_id: data.pl_id,
      }));
      setOpenCreateModal(true);
    } catch (err) {
      console.error("Failed to generate PL number", err);
    }
  };

  const handleCreateSuccess = (newItem) => {
    setRows((prev) => [newItem, ...prev]);
    setOpenCreateModal(false);
  };

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      flex: 2,
      type: "actions",
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDelete(params.row.id)}
          showInMenu
        />,
      ],
    },
    {
      field: "pl_number",
      headerName: "PL_NO",
      flex: 3,
      renderCell: (p) => p.value || "NA",
      editable: true,
    },
    {
      field: "pn_id",
      headerName: "PNID",
      flex: 4,
      renderCell: (p) => p.value || "NA",
      editable: true,
    },
    {
      field: "destination",
      headerName: "DESTINATION",
      flex: 3,
      renderCell: (p) => p.value || "NA",
      editable: true,
    },
    {
      field: "expedition_name",
      headerName: "EXPEDITION",
      flex: 2,
      renderCell: (p) => p.value || "NA",
      editable: true,
    },
    {
      field: "pl_type",
      headerName: "PL_TYPE",
      flex: 2,
      editable: true,
      type: "singleSelect",
      valueOptions: ["internal", "client", "expedition"],
      renderCell: (p) => p.value || "NA",
    },
    {
      field: "pl_date",
      headerName: "PL_DATE",
      flex: 2,
      editable: true,
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
      field: "ship_date",
      headerName: "SHIP_DATE",
      flex: 2,
      editable: true,
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
      field: "receive_date",
      headerName: "RECEIVE_DATE",
      flex: 2,
      editable: true,
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
      field: "pl_return_date",
      headerName: "PL_RETURN_DATE",
      flex: 2,
      editable: true,
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
      field: "int_pic",
      headerName: "INT_PIC",
      flex: 2,
      editable: true,
      renderCell: (p) => p.value || "NA",
      renderEditCell: (params) => (
        <Select
          fullWidth
          value={params.row.int_pic_id || ""}
          onChange={(e) => {
            params.api.setEditCellValue({
              id: params.id,
              field: "int_pic_id",
              value: e.target.value,
            });
            const selectedUser = users.find((u) => u.id === e.target.value);
            params.api.setEditCellValue({
              id: params.id,
              field: "int_pic",
              value: selectedUser?.name || "NA",
            });
          }}
        >
          {users.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.name}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: "client_pic",
      headerName: "CLIENT_PIC",
      flex: 2,
      editable: true,
      renderCell: (p) => p.value || "NA",
    },
    {
      field: "remark",
      headerName: "REMARK",
      flex: 2,
      editable: true,
      renderCell: (p) => p.value || "NA",
    },
    {
      field: "created_by",
      headerName: "CREATED_BY",
      flex: 2,
      renderCell: (p) => p.value || "NA",
    },
  ];

  return (
    <Stack spacing={2} p={2}>
      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreateModal}
        >
          Add Packing List
        </Button>
      </Stack>

      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        loading={loading}
        pageSize={10}
        showToolbar
        pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowsPerPageOptions={[10, 20, 50]}
        disableSelectionOnClick
        experimentalFeatures={{ newEditingApi: true }}
        processRowUpdate={processRowUpdate}
        getRowId={(row) => row.pl_id}
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

      {/* Modal */}
      <FormPackingListModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        formValues={formValues}
        setFormValues={setFormValues}
        onSuccess={handleCreateSuccess}
      />
    </Stack>
  );
}
