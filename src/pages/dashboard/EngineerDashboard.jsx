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
import api from "../../api/api";
import LoadingScreen from "../../components/loading/loadingScreen";
import { FaUsersCog, FaCalendarAlt } from "react-icons/fa";
import { formatDate } from "../../utils/FormatDate";

const DashboardCard = ({ title, value, color, icon }) => {
  return (
    <div
      className={`bg-white shadow rounded-xl p-3 sm:p-4 lg:p-6 xl:p-8 flex flex-col justify-center kpi-card`}
    >
      {/* Value + Icon */}
      <div className="flex items-center justify-between">
        <div className={`font-bold ${color.text} kpi-value`}>{value}</div>
        <div className={`${color.bg} p-2 sm:p-3 lg:p-4 rounded-lg`}>
          {React.cloneElement(icon, {
            size: 28,
            className: "icon-size",
          })}
        </div>
      </div>

      {/* Title */}
      <p className="mt-3 text-gray-600 kpi-title">{title}</p>
    </div>
  );
};

export default function EngineerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const utilizationChartRef = useRef(null);

  const renderCharts = useCallback((data) => {
    if (lineChartRef.current) lineChartRef.current.destroy();
    if (pieChartRef.current) pieChartRef.current.destroy();
    if (utilizationChartRef.current) utilizationChartRef.current.destroy();

    // Line Chart Completion Trend
    lineChartRef.current = new Chart(document.getElementById("lineChart"), {
      type: "line",
      data: {
        labels: data.months,
        datasets: [
          {
            label: "Completed Projects",
            font: {
              size: window.innerWidth > 2500 ? 18 : 12, // auto-scale
            },
            data: data.completedProjects,
            borderColor: "#10b981",
            fill: true,
            backgroundColor: "rgba(16,185,129,0.1)",
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
            font: { size: window.innerWidth > 2500 ? 16 : 12 },
          },
        },
        y: {
          ticks: {
            font: { size: window.innerWidth > 2500 ? 16 : 12 },
          },
        },
      },
    });

    // Pie Chart Status Distribution
    pieChartRef.current = new Chart(document.getElementById("statusPie"), {
      type: "pie",
      data: {
        labels: data.statusLabels,
        font: {
          size: window.innerWidth > 2500 ? 18 : 12, // auto-scale
        },
        datasets: [
          {
            data: data.statusCounts,
            backgroundColor: ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"],
          },
        ],
      },
      options: { responsive: true, plugins: { legend: { position: "right" } } },
      scales: {
        x: {
          ticks: {
            font: { size: window.innerWidth > 2500 ? 16 : 12 },
          },
        },
        y: {
          ticks: {
            font: { size: window.innerWidth > 2500 ? 16 : 12 },
          },
        },
      },
    });

    // Bar Chart Utilization
    utilizationChartRef.current = new Chart(
      document.getElementById("utilizationBar"),
      {
        type: "bar",
        data: {
          labels: data.utilization?.map((u) => u.role) || [],
          font: {
            size: window.innerWidth > 2500 ? 18 : 12, // auto-scale
          },
          datasets: [
            {
              label: "Mandays (This Month)",
              data: data.utilization?.map((u) => u.used) || [],
              backgroundColor: ["rgba(59,130,246,0.7)", "rgba(245,158,11,0.7)"],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } },
          scales: {
            x: {
              ticks: {
                font: { size: window.innerWidth > 2500 ? 16 : 12 },
              },
            },
            y: {
              ticks: {
                font: { size: window.innerWidth > 2500 ? 16 : 12 },
              },
            },
          },
        },
      }
    );
  }, []);

  useEffect(() => {
    api
      .get("/engineer/dashboard")
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ API error:", err.response?.data || err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (stats) renderCharts(stats);

    return () => {
      if (lineChartRef.current) lineChartRef.current.destroy();
      if (pieChartRef.current) pieChartRef.current.destroy();
      if (utilizationChartRef.current) utilizationChartRef.current.destroy();
    };
  }, [stats, renderCharts]);

  if (loading || !stats) return <LoadingScreen />;

  const cards = [
    {
      title: "Project Outstanding (Overdue)",
      value: stats.projectOverdue,
      color: { bg: "bg-red-100", text: "text-red-600" },
      icon: <FaExclamationTriangle size={22} />,
    },
    {
      title: "Due This Month",
      value: stats.projectDueThisMonth,
      color: { bg: "bg-yellow-100", text: "text-yellow-600" },
      icon: <FaClock size={22} />,
    },
    {
      title: "On Track Projects (Not Overdue)",
      value: stats.projectOnTrack,
      color: { bg: "bg-green-100", text: "text-green-600" },
      icon: <FaCheckCircle size={22} />,
    },
    {
      title: "Work Orders (This Month)",
      value: stats.totalWorkOrders,
      color: { bg: "bg-blue-100", text: "text-blue-600" },
      icon: <FaUsersCog size={22} />,
    },
  ];

  return (
    <div className="w-full p-4 lg:p-6 space-y-12 bg-gray-50">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <DashboardCard key={i} {...c} />
        ))}
      </div>

      {/* Chart */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6
                    h-auto lg:h-[30vh]"
      >
        <div className="bg-white shadow rounded-xl p-6 flex flex-col min-h-[250px]">
          <h2 className="text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold">
            <FaChartLine className="text-green-500" /> Completion Trend
          </h2>
          <canvas id="lineChart" className="flex-1"></canvas>
        </div>
        <div className="bg-white shadow rounded-xl p-6 flex flex-col min-h-[250px]">
          <h2 className="text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold">
            <FaChartPie className="text-purple-500" /> Status Distribution
          </h2>
          <canvas id="statusPie" className="flex-1"></canvas>
        </div>
      </div>
      {/* Utilization + Top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-xl p-6 flex flex-col min-h-[200px] gap-4">
          <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
            <FaUsersCog className="text-blue-500" /> Utilization (Mandays)
          </h2>
          <canvas id="utilizationBar" className="flex-1 mt-2"></canvas>
        </div>

        <div className="bg-white shadow rounded-xl p-6 flex flex-col col-span-2 min-h-[300px]">
          <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
            <FaProjectDiagram className="text-blue-500" /> Top 5 Overdue
            Projects
          </h2>
          <HotTable
            data={stats.top5Overdue}
            colHeaders={[
              "PN Number",
              "Project Name",
              "PIC",
              "Target Date",
              "Delay (days)",
              "Status",
            ]}
            columns={[
              { data: "pn_number", type: "text", editor: false },
              { data: "project_name", type: "text", editor: false },
              { data: "pic", type: "text", editor: false },
              {
                data: "target_dates",
                type: "date",
                dateFormat: "YYYY-MM-DD",
                editor: false,
                renderer: (instance, td, row, col, prop, value) => {
                  const displayValue = value ? formatDate(value) : "";
                  td.innerHTML = displayValue;
                  return td;
                },
              },
              { data: "delay_days", type: "numeric", editor: false },
              { data: "status", type: "text", editor: false },
            ]}
            stretchH="all"
            height={300}
            licenseKey="non-commercial-and-evaluation"
            className="hot-table"
          />
        </div>
      </div>
      {/* Upcoming Projects */}
      <div className="bg-white shadow rounded-xl p-6 flex flex-col min-h-[200px]">
        <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
          <FaCalendarAlt className="text-indigo-500" /> Upcoming Projects (Next
          30 days)
        </h2>
        <div className="flex-1 mt-4 overflow-auto">
          <HotTable
            data={stats.upcomingProjects}
            colHeaders={["PN Number", "Project Name", "Target Date", "Status"]}
            columns={[
              { data: "pn_number", type: "text" },
              { data: "project_name", type: "text" },
              {
                data: "target_dates",
                type: "date",
                dateFormat: "YYYY-MM-DD",
                renderer: (instance, td, row, col, prop, value) => {
                  const displayValue = value ? formatDate(value) : "";
                  td.innerHTML = displayValue;
                  return td;
                },
              },
              { data: "status", type: "text" },
            ]}
            stretchH="all"
            height={200}
            className="hot-table"
            licenseKey="non-commercial-and-evaluation"
          />
        </div>
      </div>
    </div>
  );
}
