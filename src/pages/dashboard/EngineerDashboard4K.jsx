import React, { useEffect, useState, useRef, useCallback } from "react";
import Chart from "chart.js/auto";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import {
  FaProjectDiagram,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChartPie,
  FaChartLine,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../api/api";
import { clearAuth } from "../../utils/storage";
import LoadingScreen from "../../components/loading/loadingScreen";
import { FaUsersCog, FaCalendarAlt } from "react-icons/fa";
import { formatDate } from "../../utils/FormatDate";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import { Close, Visibility } from "@mui/icons-material";

const dateRenderer = (instance, td, row, col, prop, value) => {
  td.innerText = formatDate(value);
  return td;
};

const DashboardCard = ({ title, value, color, icon, onViewClick }) => {
  const displayValue = value === 0 ? "No data" : value || "No data available";
  return (
    <div
      className={`bg-white shadow rounded-xl p-6 lg:p-8 xl:p-10 2xl:p-12 3xl:p-16 flex flex-col justify-center kpi-card relative`}
    >
      {/* Value + Icon */}
      <div className="flex items-center justify-between">
        <div
          className={`font-bold ${color.text} kpi-value text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl`}
        >
          {displayValue}
        </div>
        <div
          className={`${color.bg} p-4 lg:p-6 xl:p-8 2xl:p-10 3xl:p-12 rounded-lg`}
        >
          {React.cloneElement(icon, {
            size: 48,
            className: "icon-size",
          })}
        </div>
      </div>

      {/* Title */}
      <p className="mt-6 text-gray-600 kpi-title text-lg lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl">
        {title}
      </p>

      {/* View Button */}
      {onViewClick && (
        <IconButton
          onClick={onViewClick}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "#6b7280",
            "&:hover": { color: "#374151" },
          }}
        >
          <Visibility fontSize="large" />
        </IconButton>
      )}
    </div>
  );
};

export default function EngineerDashboard4K() {
  const [stats, setStats] = useState(null);
  const [workOrdersThisMonth, setWorkOrdersThisMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalColumns, setModalColumns] = useState([]);
  const [modalTitle, setModalTitle] = useState("");

  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);

  const renderCharts = useCallback((data) => {
    if (lineChartRef.current) lineChartRef.current.destroy();
    if (pieChartRef.current) pieChartRef.current.destroy();

    // Line Chart Completion Trend
    lineChartRef.current = new Chart(document.getElementById("lineChart"), {
      type: "line",
      data: {
        labels: data.months,
        datasets: [
          {
            label: "On Time",
            font: {
              size: 24,
            },
            data: data.onTimeProjects,
            borderColor: "#10b981",
            fill: true,
            backgroundColor: "rgba(16,185,129,0.1)",
          },
          {
            label: "Late",
            font: {
              size: 24,
            },
            data: data.lateProjects,
            borderColor: "#ef4444",
            fill: true,
            backgroundColor: "rgba(239,68,68,0.1)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
      scales: {
        x: {
          ticks: {
            font: { size: 20 },
          },
        },
        y: {
          ticks: {
            font: { size: 20 },
          },
        },
      },
    });

    // Pie Chart Status Distribution
    pieChartRef.current = new Chart(document.getElementById("statusPie"), {
      type: "pie",
      data: {
        labels: [
          "Overdue",
          "Due This Month",
          "Outstanding Projects (Not Overdue)",
        ],
        font: {
          size: 24,
        },
        datasets: [
          {
            data: data.statusCounts,
            backgroundColor: ["#ef4444", "#fbbf24", "#10b981"],
          },
        ],
      },
      options: { responsive: true, plugins: { legend: { position: "right" } } },
      scales: {
        x: {
          ticks: {
            font: { size: 20 },
          },
        },
        y: {
          ticks: {
            font: { size: 20 },
          },
        },
      },
    });
  }, []);

  useEffect(() => {
    api
      .get("/engineer/dashboard")
      .then((res) => {
        setStats(res.data);
        setWorkOrdersThisMonth(res.data.workOrdersThisMonth || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ API error:", err.response?.data || err.message);
        if (err.response?.status === 401) {
          clearAuth();
          toast.error("Session expired. Please log in again.");
          window.location.href = "/login";
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (stats) renderCharts(stats);

    return () => {
      if (lineChartRef.current) lineChartRef.current.destroy();
      if (pieChartRef.current) pieChartRef.current.destroy();
    };
  }, [stats, renderCharts]);

  if (loading || !stats) return <LoadingScreen />;

  const tableHeight = 600;
  const largeTableHeight = 800;

  const handleViewClick = (type) => {
    if (type === "overdue") {
      setModalData(stats.top5Overdue);
      setModalColumns([
        { data: "pn_number", title: "PN Number" },
        { data: "project_name", title: "Project Name" },
        { data: "pic", title: "PIC" },
        {
          data: "target_dates",
          title: "Target Date",
          renderer: (instance, td, row, col, prop, value) => {
            const displayValue = value ? formatDate(value) : "";
            td.innerHTML = displayValue;
            return td;
          },
        },
        { data: "delay_days", title: "Delay (days)" },
        { data: "status", title: "Status" },
      ]);
      setModalTitle("Overdue Projects");
    } else if (type === "dueThisMonth") {
      setModalData(stats.projectDueThisMonthList);
      setModalColumns([
        { data: "pn_number", title: "PN Number" },
        { data: "project_name", title: "Project Name" },
        { data: "pic", title: "PIC" },
        {
          data: "target_dates",
          title: "Target Date",
          renderer: (instance, td, row, col, prop, value) => {
            const displayValue = value ? formatDate(value) : "";
            td.innerHTML = displayValue;
            return td;
          },
        },
        { data: "status", title: "Status" },
      ]);
      setModalTitle("Overdue Projects");
    } else if (type === "onTrack") {
      setModalData(stats.projectOnTrackList);
      setModalColumns([
        { data: "pn_number", title: "PN Number" },
        { data: "project_name", title: "Project Name" },
        { data: "pic", title: "PIC" },
        {
          data: "target_dates",
          title: "Target Date",
          renderer: (instance, td, row, col, prop, value) => {
            const displayValue = value ? formatDate(value) : "";
            td.innerHTML = displayValue;
            return td;
          },
        },
        { data: "status", title: "Status" },
      ]);
      setModalTitle("On Track Projects");
    } else if (type === "workOrders") {
      setModalData(workOrdersThisMonth.slice(0, 10));
      setModalColumns([
        {
          data: "wo_kode_no",
          title: "WO Code",
          type: "text",
          editor: false,
          width: 160,
        },
        {
          data: "wo_date",
          title: "WO Date",
          type: "date",
          dateFormat: "YYYY-MM-DD",
          editor: false,
          width: 140,
          renderer: dateRenderer,
        },
        {
          data: "project_name",
          title: "Project Name",
          type: "text",
          editor: false,
          width: 200,
        },
        {
          data: "client_name",
          title: "Client Name",
          type: "text",
          editor: false,
          width: 200,
        },
        {
          data: "created_by",
          title: "Created By",
          type: "text",
          editor: false,
          width: 140,
        },
        {
          data: "pic_names",
          title: "PIC Names",
          type: "text",
          editor: false,
          width: 160,
        },
      ]);
      setModalTitle("Work Orders This Month");
    } else {
      setModalData([]);
      setModalColumns([]);
      setModalTitle("Data Not Available");
    }
    setModalOpen(true);
  };

  const cards = [
    {
      title: "Project Outstanding (Overdue)",
      value: stats.projectOverdue,
      color: { bg: "bg-red-100", text: "text-red-600" },
      icon: <FaExclamationTriangle size={32} />,
      onViewClick: () => handleViewClick("overdue"),
    },
    {
      title: "Due This Month",
      value: stats.projectDueThisMonth,
      color: { bg: "bg-yellow-100", text: "text-yellow-600" },
      icon: <FaClock size={32} />,
      onViewClick: () => handleViewClick("dueThisMonth"),
    },
    {
      title: "Project Outstanding (Not Overdue)",
      value: stats.projectOnTrack,
      color: { bg: "bg-purple-100", text: "text-purple-600" },
      icon: <FaCheckCircle size={32} />,
      onViewClick: () => handleViewClick("onTrack"),
    },
    {
      title: "Total Outstanding Projects",
      value: stats.totalOutstandingProjects,
      color: { bg: "bg-orange-100", text: "text-orange-600" },
      icon: <FaProjectDiagram size={32} />,
    },
    {
      title: "Work Orders (This Month)",
      value: stats.totalWorkOrders,
      color: { bg: "bg-blue-100", text: "text-blue-600" },
      icon: <FaUsersCog size={32} />,
      onViewClick: () => handleViewClick("workOrders"),
    },
  ];

  return (
    <div className="w-full p-2 lg:p-4 xl:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <DashboardCard key={i} {...c} />
        ))}
      </div>

      {/* Chart */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4
                    h-auto lg:h-[25vh] 2xl:h-[30vh] 3xl:h-[35vh]"
      >
        <div className="bg-white shadow rounded-xl p-2 lg:p-4 flex flex-col min-h-[200px] 2xl:min-h-[250px] 3xl:min-h-[300px]">
          <h2 className="text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl 3xl:text-5xl font-semibold">
            <FaChartLine className="text-green-500" /> Completion Trend
          </h2>
          <canvas id="lineChart" className="flex-1"></canvas>
        </div>
        <div className="bg-white shadow rounded-xl p-2 lg:p-4 flex flex-col min-h-[200px] 2xl:min-h-[250px] 3xl:min-h-[300px]">
          <h2 className="text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl 3xl:text-5xl font-semibold">
            <FaChartPie className="text-purple-500" /> Outstanding Project
            Status
          </h2>
          <canvas id="statusPie" className="flex-1"></canvas>
        </div>
      </div>
      {/* Utilization + Top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-xl p-2 lg:p-4 flex flex-col min-h-[400px] gap-2">
          <h2 className="text-xl lg:text-2xl xl:text-3xl 3xl:text-4xl font-semibold flex items-center gap-4">
            <FaUsersCog className="text-blue-500" /> Work Orders This Month
          </h2>
          {workOrdersThisMonth.length === 0 ? (
            <p className="text-center text-gray-500 mt-2">
              No work orders this month.
            </p>
          ) : (
            <div className="table-wrapper">
              <div className="table-inner">
                <HotTable
                  data={workOrdersThisMonth.slice(0, 10)}
                  colHeaders={[
                    "WO Code",
                    "WO Date",
                    "Project Name",
                    "Client Name",
                    "Created By",
                    "PIC Names",
                  ]}
                  columns={[
                    {
                      data: "wo_kode_no",
                      title: "WO Code",
                      type: "text",
                      editor: false,
                      width: 200,
                    },
                    {
                      data: "wo_date",
                      title: "WO Date",
                      type: "date",
                      dateFormat: "YYYY-MM-DD",
                      editor: false,
                      width: 180,
                      renderer: dateRenderer,
                    },
                    {
                      data: "project_name",
                      title: "Project Name",
                      type: "text",
                      editor: false,
                      width: 250,
                    },
                    {
                      data: "client_name",
                      title: "Client Name",
                      type: "text",
                      editor: false,
                      width: 250,
                      renderer: (instance, td, row, col, prop, value) => {
                        td.innerText = value || "-";
                        return td;
                      },
                    },
                    {
                      data: "created_by",
                      title: "Created By",
                      type: "text",
                      editor: false,
                      width: 180,
                    },
                    {
                      data: "pic_names",
                      title: "PIC Names",
                      type: "text",
                      editor: false,
                      width: 200,
                    },
                  ]}
                  stretchH="all"
                  height={largeTableHeight}
                  licenseKey="non-commercial-and-evaluation"
                  className="ht-theme-horizon"
                  manualColumnResize
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-xl p-2 lg:p-4 flex flex-col min-h-[400px]">
          <h2 className="text-xl lg:text-2xl xl:text-3xl 3xl:text-4xl font-semibold flex items-center gap-4">
            <FaProjectDiagram className="text-blue-500" /> Top 5 Overdue
            Projects
          </h2>
          {stats.top5Overdue.length === 0 ? (
            <p className="text-center text-gray-500 mt-2">
              No overdue projects.
            </p>
          ) : (
            <div className="table-wrapper">
              <div className="table-inner">
                <HotTable
                  data={stats.top5Overdue}
                  colHeaders={[
                    "PN Number",
                    "Project Name",
                    "Client Name",
                    "PIC",
                    "Target Date",
                    "Delay (days)",
                    "Status",
                  ]}
                  columns={[
                    {
                      data: "pn_number",
                      type: "text",
                      editor: false,
                      width: 150,
                    },
                    {
                      data: "project_name",
                      type: "text",
                      editor: false,
                      width: 200,
                    },
                    {
                      data: "client_name",
                      title: "Client Name",
                      type: "text",
                      editor: false,
                      width: 200,
                      renderer: (instance, td, row, col, prop, value) => {
                        td.innerText = value || "-";
                        return td;
                      },
                    },
                    { data: "pic", type: "text", editor: false, width: 150 },
                    {
                      data: "target_dates",
                      type: "date",
                      dateFormat: "YYYY-MM-DD",
                      editor: false,
                      width: 180,
                      renderer: (instance, td, row, col, prop, value) => {
                        const displayValue = value ? formatDate(value) : "";
                        td.innerHTML = displayValue;
                        return td;
                      },
                    },
                    {
                      data: "delay_days",
                      type: "numeric",
                      editor: false,
                      width: 120,
                    },
                    { data: "status", type: "text", editor: false, width: 120 },
                  ]}
                  stretchH="all"
                  height={largeTableHeight}
                  licenseKey="non-commercial-and-evaluation"
                  className="ht-theme-horizon"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Upcoming Projects */}
      <div className="bg-white shadow rounded-xl p-2 lg:p-4 flex flex-col min-h-[200px]">
        <h2 className="text-xl lg:text-2xl xl:text-3xl 3xl:text-4xl font-semibold flex items-center gap-4">
          <FaCalendarAlt className="text-indigo-500" /> Upcoming Projects (Next
          30 days)
        </h2>
        <div className="flex-1 mt-2">
          {stats.upcomingProjects.length === 0 ? (
            <p className="text-center text-gray-500 mt-2">
              No upcoming projects in the next 30 days.
            </p>
          ) : (
            <div className="table-wrapper">
              <div className="table-inner">
                <HotTable
                  data={stats.upcomingProjects.slice(0, 5)}
                  colHeaders={[
                    "PN Number",
                    "Project Name",
                    "Client Name",
                    "Target Date",
                    "Status",
                  ]}
                  columns={[
                    { data: "pn_number", type: "text", width: 150 },
                    { data: "project_name", type: "text", width: 200 },
                    {
                      data: "client_name",
                      title: "Client Name",
                      type: "text",
                      editor: false,
                      width: 200,
                      renderer: (instance, td, row, col, prop, value) => {
                        td.innerText = value || "-";
                        return td;
                      },
                    },
                    {
                      data: "target_dates",
                      type: "date",
                      dateFormat: "YYYY-MM-DD",
                      width: 180,
                      renderer: (instance, td, row, col, prop, value) => {
                        const displayValue = value ? formatDate(value) : "";
                        td.innerHTML = displayValue;
                        return td;
                      },
                    },
                    { data: "status", type: "text", width: 120 },
                  ]}
                  stretchH="all"
                  height={tableHeight}
                  className="ht-theme-horizon"
                  licenseKey="non-commercial-and-evaluation"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "95%",
            maxWidth: 1600,
            maxHeight: "85%",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 6,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Typography id="modal-title" variant="h5" component="h2">
              {modalTitle}
            </Typography>
            <IconButton onClick={() => setModalOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          {modalData.length === 0 ? (
            <Typography
              id="modal-description"
              textAlign="center"
              color="textSecondary"
            >
              No data available for this category. Please check the Projects or
              Work Orders page for full details.
            </Typography>
          ) : (
            <div className="table-wrapper" style={{ height: "100%" }}>
              <div className="table-inner">
                <HotTable
                  data={modalData}
                  colHeaders={modalColumns.map((c) => c.title)}
                  columns={modalColumns}
                  height={700}
                  stretchH="all"
                  manualColumnResize={true}
                  licenseKey="non-commercial-and-evaluation"
                  className="ht-theme-horizon"
                />
              </div>
            </div>
          )}
        </Box>
      </Modal>
    </div>
  );
}
