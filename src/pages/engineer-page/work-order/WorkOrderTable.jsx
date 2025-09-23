import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ArrowLeft, Plus, Edit3 } from "lucide-react";
import { format } from "date-fns";
import api from "../../../api/api";
import WorkOrderFormModal from "../../../components/modal/WorkOrderFormModal";

export default function WorkOrderTable() {
  const { pn_number } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openWO, setOpenWO] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  // === Fetch Project ===
  const fetchProject = async () => {
    try {
      const resProject = await api.get(`/projects/${pn_number}`);
      setProject(resProject.data.data.project);
    } catch (err) {
      console.error(err);
    }
  };

  // === Fetch Work Orders ===
  const fetchWorkOrders = async () => {
    if (!pn_number) return;
    setLoading(true);
    try {
      const resWO = await api.get(`/work-order/${pn_number}`);
      console.log(resWO);
      setWorkOrders(resWO.data.data.map((wo) => ({ id: wo.id, ...wo })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchWorkOrders();
  }, [pn_number]);

  // === HANDLE EDIT FUNCTION ===
  const handleEdit = async (woId) => {
    try {
      const res = await api.get(`/work-order/detail/${woId}`); // endpoint detail
      setSelectedWorkOrder(res.data.data); // data lengkap
      setOpenWO(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // === HANDLE MODAL CLOSE ===
  const handleModalClose = (updatedWO) => {
    setOpenWO(false);
    setSelectedWorkOrder(null);

    if (!updatedWO) return;

    const newWorkOrders = [...workOrders];

    const mapWO = (wo) => {
      if (!wo.id) {
        console.error("Row tidak punya id. DataGrid akan error!", wo);
        return null; // skip jika tidak ada id
      }
      return wo;
    };

    if (Array.isArray(updatedWO)) {
      updatedWO.forEach((wo) => {
        const mapped = mapWO(wo);
        if (!mapped) return;

        const exists = newWorkOrders.find((w) => w.id === mapped.id);
        if (exists) {
          const index = newWorkOrders.findIndex((w) => w.id === mapped.id);
          newWorkOrders[index] = mapped;
        } else {
          newWorkOrders.push(mapped);
        }
      });
    } else {
      const mapped = mapWO(updatedWO);
      if (mapped) {
        const index = newWorkOrders.findIndex((w) => w.id === mapped.id);
        if (index !== -1) newWorkOrders[index] = mapped;
        else newWorkOrders.push(mapped);
      }
    }

    // Urutkan
    newWorkOrders.sort(
      (a, b) =>
        (Number(a.wo_number_in_project) || 0) -
        (Number(b.wo_number_in_project) || 0)
    );

    setWorkOrders(newWorkOrders);
  };

  const formatDate = (val) => {
    if (!val) return "-";
    const d = new Date(val);
    return format(d, "dd-MM-yyyy");
  };

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton
              color="primary"
              onClick={() => handleEdit(params.row.id)}
              sx={{ padding: 0.5 }}
            >
              <Edit3 size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1.2,
      renderCell: (params) => {
        if (!params.value) return "-";

        const statusColorMap = {
          "waiting approval": "warning",
          approved: "success",
          finished: "default", // atau "primary" sesuai preferensi
        };

        const color = statusColorMap[params.value.toLowerCase()] || "default";

        return <Chip label={params.value} color={color} size="small" />;
      },
    },

    { field: "wo_number_in_project", headerName: "WO No.", flex: 1 },
    { field: "wo_kode_no", headerName: "WO Code", flex: 1.5 },
    {
      field: "wo_date",
      headerName: "WO Date",
      flex: 1.2,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: "total_mandays_eng",
      headerName: "Mandays ENG",
      flex: 1,
    },
    {
      field: "total_mandays_elect",
      headerName: "Mandays ELECT",
      flex: 1,
    },
    {
      field: "add_work",
      headerName: "Additional Work",
      flex: 1.2,
      renderCell: (params) =>
        params.value === 1 || params.value === true || params.value === "1" ? (
          <Chip label="Yes" color="primary" size="small" />
        ) : (
          <Chip label="No" variant="outlined" size="small" />
        ),
    },
    {
      field: "pics",
      headerName: "PICs",
      flex: 2,
      renderCell: (params) => {
        if (!params.value || !params.value.length) return "-";
        return (
          <Stack spacing={0.5}>
            {params.value.map((pic, idx) => (
              <Typography key={idx} variant="body2" noWrap>
                {pic.user?.name} {pic.role ? `(${pic.role.name})` : ""}
              </Typography>
            ))}
          </Stack>
        );
      },
    },
    {
      field: "descriptions",
      headerName: "Descriptions",
      flex: 3,
      renderCell: (params) => {
        if (!params.value || !params.value.length) return "-";
        return (
          <Stack spacing={0.5}>
            {params.value.map((desc, idx) => (
              <Typography
                key={idx}
                variant="body2"
                noWrap
                sx={{ fontStyle: "italic" }}
              >
                {desc.title || "-"}: {desc.description || "-"}
              </Typography>
            ))}
          </Stack>
        );
      },
    },
  ];

  return (
    <div style={{ height: 600, width: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Typography variant="subtitle1" fontWeight={600} ml={1}>
            {project?.project_number
              ? `Work Orders - ${project.project_number}`
              : "Work Orders"}
          </Typography>
        </Stack>

        <IconButton
          size="small"
          sx={{
            backgroundColor: "#2563eb",
            color: "#fff",
            "&:hover": { backgroundColor: "#1e40af" },
          }}
          onClick={() => setOpenWO(true)}
        >
          <Plus size={16} />
        </IconButton>
      </Stack>

      <div className="table-wrapper">
        <div className="table-inner">
          <DataGrid
            rows={workOrders}
            columns={columns}
            getRowId={(row) => row.id || row.wo_number_in_project}
            loading={loading}
            pageSizeOptions={[10, 20]}
            sx={{
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-columnHeader": {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            }}
          />
        </div>
      </div>
      {openWO && (
        <WorkOrderFormModal
          open={openWO}
          onClose={handleModalClose}
          project={project}
          workOrder={selectedWorkOrder}
        />
      )}
    </div>
  );
}
