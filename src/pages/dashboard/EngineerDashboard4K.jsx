import React, { useEffect, useState, useCallback } from "react";
import Chart from "chart.js/auto";
import {
  FaProjectDiagram,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChartPie,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../api/api";
import { clearAuth } from "../../utils/storage";
import LoadingScreen from "../../components/loading/loadingScreen";
import { FaUsersCog, FaCalendarAlt } from "react-icons/fa";
import { formatDate } from "../../utils/FormatDate";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import { Close, Visibility } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";

const dateRenderer = (instance, td, row, col, prop, value) => {
  td.innerText = formatDate(value);
  return td;
};

const DashboardCard = ({ title, value, color, onViewClick }) => {
  const displayValue = value === 0 ? "No data" : value || "No data available";
  return (
    <div
      className="shadow rounded-xl p-6 lg:p-8 xl:p-10 2xl:p-12 3xl:p-16 flex flex-col justify-center items-center kpi-card relative hover:shadow-lg transition-shadow duration-300 h-64 lg:h-80 xl:h-96 2xl:h-[28rem] 3xl:h-[32rem]"
      style={{ backgroundColor: color.bgColor }}
    >
      {/* Value */}
      <div className="flex items-center justify-center flex-1">
        <div
          className="font-bold kpi-value text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl"
          style={{ color: color.textColor }}
        >
          {displayValue}
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center justify-center flex-1">
        <p
          className="kpi-title text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl text-center"
          style={{ color: color.textColor }}
        >
          {title}
        </p>
      </div>

      {/* View Button */}
      {onViewClick && (
        <IconButton
          onClick={onViewClick}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: color.textColor,
            "&:hover": { color: color.textColor, opacity: 0.8 },
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPageOverdue, setCurrentPageOverdue] = useState(1);
  const [currentPageUpcoming, setCurrentPageUpcoming] = useState(1);
  const totalSlides = 2;

  const renderCharts = useCallback((data) => {
    // Destroy existing charts if they exist
    const lineCanvas = document.getElementById("lineChart");
    const pieCanvas = document.getElementById("statusPie");

    if (lineCanvas) {
      const existingLineChart = Chart.getChart(lineCanvas);
      if (existingLineChart) {
        existingLineChart.destroy();
      }
    }

    if (pieCanvas) {
      const existingPieChart = Chart.getChart(pieCanvas);
      if (existingPieChart) {
        existingPieChart.destroy();
      }
    }

    // Smooth Area Chart Completion Trend
    new Chart(lineCanvas, {
      type: "line",
      data: {
        labels: data.months,
        datasets: [
          {
            label: "On Time",
            data: data.onTimeProjects,
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.3)",
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
          {
            label: "Late",
            data: data.lateProjects,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.3)",
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        backgroundColor: "white",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 32, color: "gray" },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              font: { size: 20, color: "gray" },
            },
            grid: {
              color: "rgba(128, 128, 128, 0.2)",
            },
          },
          y: {
            ticks: {
              font: { size: 20, color: "gray" },
              stepSize: 1,
            },
            beginAtZero: true,
            grid: {
              color: "rgba(128, 128, 128, 0.2)",
            },
          },
        },
      },
    });

    // Donut Chart Status Distribution
    new Chart(pieCanvas, {
      type: "doughnut",
      data: {
        labels: [
          "Overdue",
          "Due This Month",
          "Outstanding Projects (Not Overdue)",
        ],
        datasets: [
          {
            data: data.statusCounts,
            backgroundColor: ["#ef4444", "#fbbf24", "#10b981"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: {
                size: 32,
                color: "gray",
              },
            },
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
    if (stats && currentSlide === 0) renderCharts(stats);
  }, [stats, renderCharts, currentSlide]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 10000); // Auto-slide every 10 seconds
    return () => clearInterval(interval);
  }, [totalSlides]);

  // Auto-pagination for slide 1
  useEffect(() => {
    if (currentSlide === 1) {
      const interval = setInterval(() => {
        const totalPagesOverdue = Math.ceil(
          (stats?.top5Overdue?.length || 0) / 10
        );
        const totalPagesUpcoming = Math.ceil(
          (stats?.upcomingProjects?.length || 0) / 10
        );
        setCurrentPageOverdue((prev) => (prev % totalPagesOverdue) + 1);
        setCurrentPageUpcoming((prev) => (prev % totalPagesUpcoming) + 1);
      }, 5000); // Auto-switch every 5 seconds
      return () => clearInterval(interval);
    }
  }, [currentSlide, stats]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  if (loading || !stats) return <LoadingScreen />;

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
      color: { bgColor: "#ef4444", textColor: "#ffffff" },
      onViewClick: () => handleViewClick("overdue"),
    },
    {
      title: "Due This Month",
      value: stats.projectDueThisMonth,
      color: { bgColor: "#fbbf24", textColor: "#000000" },
      onViewClick: () => handleViewClick("dueThisMonth"),
    },
    {
      title: "Project Outstanding (Not Overdue)",
      value: stats.projectOnTrack,
      color: { bgColor: "#10b981", textColor: "#ffffff" },
      onViewClick: () => handleViewClick("onTrack"),
    },
    {
      title: "Total Outstanding Projects",
      value: stats.totalOutstandingProjects,
      color: { bgColor: "#0074A8", textColor: "#ffffff" },
    },
    {
      title: "Work Orders (This Month)",
      value: stats.totalWorkOrders,
      color: { bgColor: "#0074A8", textColor: "#ffffff" },
      onViewClick: () => handleViewClick("workOrders"),
    },
  ];

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-300"
      >
        <FaChevronLeft size={32} className="text-gray-600" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-300"
      >
        <FaChevronRight size={32} className="text-gray-600" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index === currentSlide ? "bg-blue-500" : "bg-gray-400"
            }`}
          />
        ))}
      </div>

      {/* Carousel Slides */}
      {currentSlide === 0 && (
        <div className="flex-1 flex flex-col p-4">
          {/* KPI Cards */}
          <div className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {cards.map((c, i) => (
                <DashboardCard key={i} {...c} />
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-white to-gray-100 shadow rounded-xl p-4 flex flex-col">
              <h2 className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl font-semibold mb-4 flex-shrink-0 text-gray-800">
                <FaChartLine className="text-gray-800" /> Completion Trend
              </h2>
              <div className="flex-1 flex justify-center items-center">
                <canvas id="lineChart" className="w-full h-full"></canvas>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-100 shadow rounded-xl p-4 flex flex-col">
              <h2 className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl font-semibold mb-4 flex-shrink-0 text-gray-800">
                <FaChartPie className="text-gray-800" /> Outstanding Project
                Status
              </h2>
              <div className="flex-1">
                <canvas id="statusPie" className="w-full h-full"></canvas>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentSlide === 1 && (
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Top Overdue Projects */}
          <div className="bg-white shadow rounded-xl p-4 flex flex-col flex-1">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl font-semibold mb-4 flex items-center gap-4">
              <FaProjectDiagram className="text-red-500" /> Top Overdue Projects
            </h2>
            {stats.top5Overdue.length === 0 ? (
              <p className="text-center text-gray-500 flex-1 flex items-center justify-center text-2xl">
                No overdue projects.
              </p>
            ) : (
              <div
                className="flex-1"
                style={{ height: "1000px", marginTop: "20px" }}
              >
                <DataGrid
                  rows={stats.top5Overdue
                    .slice(
                      (currentPageOverdue - 1) * 10,
                      currentPageOverdue * 10
                    )
                    .map((row, index) => ({ id: index, ...row }))}
                  columns={[
                    {
                      field: "pn_number",
                      headerName: "PN Number",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value || "-"}
                        </div>
                      ),
                    },
                    {
                      field: "project_name",
                      headerName: "Project Name",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value || "-"}
                        </div>
                      ),
                    },
                    {
                      field: "client_name",
                      headerName: "Client Name",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value || "-"}
                        </div>
                      ),
                    },
                    {
                      field: "pic",
                      headerName: "PIC",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value || "-"}
                        </div>
                      ),
                    },
                    {
                      field: "target_dates",
                      headerName: "Target Date",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value ? formatDate(params.value) : "-"}
                        </div>
                      ),
                    },
                    {
                      field: "delay_days",
                      headerName: "Delay (days)",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value || "-"}
                        </div>
                      ),
                    },
                    {
                      field: "status",
                      headerName: "Status",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value || "-"}
                        </div>
                      ),
                    },
                  ]}
                  pageSize={10}
                  rowsPerPageOptions={[10]}
                  disableSelectionOnClick
                  sx={{
                    fontSize: "32px",
                    "& .MuiDataGrid-cell": {
                      fontSize: "32px",
                      padding: "24px",
                      alignItems: "center",
                    },
                    "& .MuiDataGrid-columnHeader": {
                      fontSize: "32px",
                      padding: "16px",
                      alignItems: "center",
                    },
                    "& .MuiDataGrid-row": {
                      marginBottom: "16px",
                    },
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            )}
          </div>

          {/* Upcoming Projects */}
          <div className="bg-white shadow rounded-xl p-4 flex flex-col flex-1">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl font-semibold mb-4 flex items-center gap-4">
              <FaCalendarAlt className="text-indigo-500" /> Upcoming Projects
              (Next 30 days)
            </h2>
            {stats.upcomingProjects.length === 0 ? (
              <p className="text-center text-gray-500 flex-1 flex items-center justify-center text-2xl">
                No upcoming projects in the next 30 days.
              </p>
            ) : (
              <div
                className="flex-1"
                style={{ height: "1000px", marginTop: "20px" }}
              >
                <DataGrid
                  rows={stats.upcomingProjects
                    .slice(
                      (currentPageUpcoming - 1) * 10,
                      currentPageUpcoming * 10
                    )
                    .map((row, index) => ({ id: index, ...row }))}
                  columns={[
                    {
                      field: "pn_number",
                      headerName: "PN Number",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value || "-"}
                        </div>
                      ),
                    },
                    {
                      field: "project_name",
                      headerName: "Project Name",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value || "-"}
                        </div>
                      ),
                    },
                    {
                      field: "client_name",
                      headerName: "Client Name",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value || "-"}
                        </div>
                      ),
                    },
                    {
                      field: "target_dates",
                      headerName: "Target Date",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value ? formatDate(params.value) : "-"}
                        </div>
                      ),
                    },
                    {
                      field: "status",
                      headerName: "Status",
                      flex: 1,
                      renderCell: (params) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            fontSize: "32px",
                          }}
                        >
                          {params.value || "-"}
                        </div>
                      ),
                    },
                  ]}
                  pageSize={10}
                  rowsPerPageOptions={[10]}
                  disableSelectionOnClick
                  sx={{
                    fontSize: "32px",
                    "& .MuiDataGrid-cell": {
                      fontSize: "32px",
                      padding: "24px",
                      alignItems: "center",
                    },
                    "& .MuiDataGrid-columnHeader": {
                      fontSize: "32px",
                      padding: "16px",
                      alignItems: "center",
                    },
                    "& .MuiDataGrid-row": {
                      marginBottom: "16px",
                    },
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

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
                  height="auto"
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
