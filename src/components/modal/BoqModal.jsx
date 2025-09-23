import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import api from "../../api/api";
import BoqFormModal from "./BoqFormModal";
import { NumericFormat } from "react-number-format";
const marketingRoles = [
  "marketing",
  "marketing_admin",
  "manager_marketing",
  "sales_supervisor",
  "super_admin",
  "marketing_director",
  "supervisor marketing",
  "marketing_estimator",
];

const engineerRoles = [
  "project controller",
  "engineering_director",
  "project manager",
];

const BoqModal = ({
  open,
  handleClose,
  projectId,
  projectValue,
  role,
  token,
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);

  const isMarketing = marketingRoles.includes(role);
  const isEngineer = engineerRoles.includes(role);

  // fetch data BOQ
  useEffect(() => {
    if (!open || !projectId) return;

    const fetchBoqs = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/projects/${projectId}/boq`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const boqs = (res.data.data || []).map((row) => ({
          id: row.id,
          project_id: row.project_id,
          item_number: row.item_number,
          description: row.description,
          material_value: Number(row.material_value ?? 0),
          engineer_value: Number(row.engineer_value ?? 0),
          material_portion: Number(row.material_portion ?? 0),
          engineer_portion: Number(row.engineer_portion ?? 0),
          progress_material: Number(row.progress_material ?? 0),
          progress_engineer: Number(row.progress_engineer ?? 0),
          total_progress: Number(row.total_progress ?? 0),
        }));
        console.log("Fetched BOQs:", boqs);
        setRows(boqs);
      } catch (err) {
        console.error("Error fetching BOQs:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoqs();
  }, [open, projectId, token]);

  // inline update
  const processRowUpdate = async (newRow, oldRow) => {
    try {
      const payload = {
        description: newRow.description,
        material_value: newRow.material_value || 0,
        engineer_value: newRow.engineer_value || 0,
        progress_material: newRow.progress_material || 0,
        progress_engineer: newRow.progress_engineer || 0,
      };

      if (isMarketing && projectValue > 0) {
        payload.material_portion =
          ((payload.material_value || 0) / projectValue) * 100;
        payload.engineer_portion =
          ((payload.engineer_value || 0) / projectValue) * 100;
      }

      const res = await api.put(`/boq/${newRow.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updated = {
        ...res.data.data,
        material_value: Number(res.data.data.material_value ?? 0),
        engineer_value: Number(res.data.data.engineer_value ?? 0),
        material_portion: Number(res.data.data.material_portion ?? 0),
        engineer_portion: Number(res.data.data.engineer_portion ?? 0),
        progress_material: Number(res.data.data.progress_material ?? 0),
        progress_engineer: Number(res.data.data.progress_engineer ?? 0),
        total_progress: Number(res.data.data.total_progress ?? 0),
      };

      return updated;
    } catch (error) {
      console.error("Error updating row:", error.response?.data || error);
      return oldRow;
    }
  };

  const baseColumns = [
    {
      field: "item_number",
      headerName: "Item No",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography fontWeight={600}>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      width: 250,
      editable: true,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography fontWeight={500}>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "material_value",
      headerName: "Material Value",
      width: 160,
      align: "right",
      headerAlign: "right",
      editable: true,
      type: "number",
      preProcessEditCellProps: (params) => {
        let value = params.props.value;

        if (value === "" || value === undefined || isNaN(value)) {
          value = null;
        } else {
          value = Number(value);
        }

        return { ...params.props, value };
      },
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <Typography fontWeight={600} color="green">
            {params.value != null
              ? new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(params.value)
              : "-"}
          </Typography>
        </Box>
      ),
      renderEditCell: (params) => (
        <NumericFormat
          value={params.value ?? ""}
          onValueChange={(values) => {
            params.api.setEditCellValue(
              {
                id: params.id,
                field: params.field,
                value: values.floatValue ?? 0,
              },
              true
            );
          }}
          thousandSeparator="."
          decimalSeparator=","
          prefix="Rp "
          customInput={TextField}
          fullWidth
          size="small"
        />
      ),
    },
    {
      field: "engineer_value",
      headerName: "Engineer Value",
      width: 160,
      align: "right",
      headerAlign: "right",
      editable: true,
      type: "number",
      preProcessEditCellProps: (params) => {
        let value = params.props.value;

        if (value === "" || value === undefined || isNaN(value)) {
          value = null;
        } else {
          value = Number(value);
        }

        return { ...params.props, value };
      },
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <Typography fontWeight={600} color="blue">
            {params.value != null
              ? new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(params.value)
              : "-"}
          </Typography>
        </Box>
      ),
      renderEditCell: (params) => (
        <NumericFormat
          value={params.value ?? ""}
          onValueChange={(values) => {
            params.api.setEditCellValue(
              {
                id: params.id,
                field: params.field,
                value: values.floatValue ?? 0,
              },
              true
            );
          }}
          thousandSeparator="."
          decimalSeparator=","
          prefix="Rp "
          customInput={TextField}
          fullWidth
          size="small"
        />
      ),
    },

    {
      field: "material_portion",
      headerName: "Material Portion (%)",
      type: "number",
      width: 180,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <Typography fontWeight={600} color="green">
            {Number(params.row?.material_portion ?? 0).toFixed(2)} %
          </Typography>
        </Box>
      ),
    },
    {
      field: "engineer_portion",
      headerName: "Engineer Portion (%)",
      type: "number",
      width: 180,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <Typography fontWeight={600} color="blue">
            {Number(params.row?.engineer_portion ?? 0).toFixed(2)} %
          </Typography>
        </Box>
      ),
    },
  ];

  const engineerColumns = [
    {
      field: "progress_material",
      headerName: "Progress Material (%)",
      type: "number",
      width: 200,
      editable: isEngineer,
      renderCell: (params) => `${params.value ?? 0}%`,
      preProcessEditCellProps: (params) => {
        const value = Number(params.props.value);
        return { ...params.props, error: value < 0 || value > 100 };
      },
      renderEditCell: (params) => (
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={params.value ?? 0}
          onChange={(e) => {
            let val = Number(e.target.value);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: val,
            });
          }}
          className="w-full px-2 py-1 border rounded text-sm"
        />
      ),
    },
    {
      field: "progress_engineer",
      headerName: "Progress Engineer (%)",
      type: "number",
      width: 200,
      editable: isEngineer,
      renderCell: (params) => `${params.value ?? 0}%`,
      preProcessEditCellProps: (params) => {
        const value = Number(params.props.value);
        return { ...params.props, error: value < 0 || value > 100 };
      },
      renderEditCell: (params) => (
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={params.value ?? 0}
          onChange={(e) => {
            let val = Number(e.target.value);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: val,
            });
          }}
          className="w-full px-2 py-1 border rounded text-sm"
        />
      ),
    },

    {
      field: "total_progress",
      headerName: "Total Progress (%)",
      type: "number",
      width: 180,
    },
  ];

  const columns = isEngineer
    ? [
        // baseColumns tanpa material_value dan engineer_value
        ...baseColumns.filter(
          (col) =>
            col.field !== "material_value" && col.field !== "engineer_value"
        ),
        ...engineerColumns,
      ]
    : baseColumns; // marketing tetap tampil semua

  const handleSaveForm = async (formData) => {
    try {
      const payload = {
        project_id: projectId,
        description: formData.description,
        material_value: formData.material_value || 0,
        engineer_value: formData.engineer_value || 0,
      };

      const res = await api.post(`/projects/${projectId}/boq`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newRow = {
        ...res.data.data,
        material_value: Number(res.data.data.material_value ?? 0),
        engineer_value: Number(res.data.data.engineer_value ?? 0),
        material_portion: Number(res.data.data.material_portion ?? 0),
        engineer_portion: Number(res.data.data.engineer_portion ?? 0),
        progress_material: Number(res.data.data.progress_material ?? 0),
        progress_engineer: Number(res.data.data.progress_engineer ?? 0),
        total_progress: Number(res.data.data.total_progress ?? 0),
      };

      setRows((prev) => [...prev, newRow]);
      setOpenForm(false);
    } catch (err) {
      console.error("Error saving BOQ:", err.response?.data || err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>Bill of Quantity (BOQ)</DialogTitle>
        <DialogContent>
          <div style={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={rows}
              getRowId={(row) => row.id}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              processRowUpdate={processRowUpdate}
              onProcessRowUpdateError={(error) => console.error(error)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenForm(true)}
            variant="contained"
            color="primary"
          >
            Add Item
          </Button>
          <Button onClick={handleClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <BoqFormModal
        open={openForm}
        handleClose={() => setOpenForm(false)}
        handleSave={handleSaveForm}
      />
    </>
  );
};

export default BoqModal;
