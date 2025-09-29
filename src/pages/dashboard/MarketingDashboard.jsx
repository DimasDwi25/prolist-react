import React, { useEffect, useState, useRef, useCallback } from "react";
import Chart from "chart.js/auto";
import {
  FaFileInvoice,
  FaProjectDiagram,
  FaClock,
  FaMoneyBillWave,
  FaChartLine,
  FaEye,
  FaEyeSlash,
  FaChartBar,
  FaChartPie,
} from "react-icons/fa";
import api from "../../api/api";
import LoadingScreen from "../../components/loading/loadingScreen"; // import component loading

const colorMap = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
};

const DashboardCard = ({ title, value, color, icon, mask, showAll }) => {
  const [show, setShow] = useState(false);
  const colors = colorMap[color] || colorMap.blue;
  const isVisible = showAll !== null ? showAll : show;

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 p-3 rounded-full ${colors.bg}`}>
          <div className={colors.text}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <h2 className="text-lg font-semibold text-gray-800 truncate">
            {mask ? (isVisible ? value : "••••••••") : value}
          </h2>
        </div>
      </div>
      {mask && showAll === null && (
        <button
          onClick={() => setShow(!show)}
          className="mt-3 text-xs font-medium text-gray-400 rounded transition flex items-center gap-1"
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>
      )}
    </div>
  );
};

export default function MarketingDashboard() {
  const [stats, setStats] = useState(null); // awalnya null
  const [loading, setLoading] = useState(true);
  const [toggleAllNominal] = useState(null);

  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);

  const formatRp = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(num);

  const renderCharts = useCallback((data) => {
    if (barChartRef.current) barChartRef.current.destroy();
    if (pieChartRef.current) pieChartRef.current.destroy();
    if (lineChartRef.current) lineChartRef.current.destroy();

    barChartRef.current = new Chart(document.getElementById("barChart"), {
      type: "bar",
      data: {
        labels: ["Quotation", "Sales"],
        datasets: [
          {
            data: [data.totalQuotationValue, data.totalSalesValue],
            backgroundColor: ["#3b82f6", "#a78bfa"],
            borderRadius: 6, // dikurangi
            barThickness: 30, // lebih tipis
            categoryPercentage: 0.6, // jarak antar kategori lebih rapat
            barPercentage: 0.8, // lebar batang relatif
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        layout: {
          padding: 10, // padding lebih kecil
        },
        scales: {
          x: {
            ticks: { font: { size: 10 } }, // font lebih kecil
          },
          y: {
            ticks: { font: { size: 10 } },
            beginAtZero: true,
          },
        },
      },
    });

    pieChartRef.current = new Chart(document.getElementById("statusPieChart"), {
      type: "pie",
      data: {
        labels: data.labels,
        datasets: [{ data: data.data, backgroundColor: data.colors }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "right" } },
      },
    });

    lineChartRef.current = new Chart(document.getElementById("lineChart"), {
      type: "line",
      data: {
        labels: data.months,
        datasets: [
          {
            label: "Quotation",
            data: data.quotationPerMonthData,
            borderColor: "#3b82f6",
            fill: true,
            backgroundColor: "rgba(59,130,246,0.1)",
            tension: 0.3,
          },
          {
            label: "Sales",
            data: data.salesPerMonthData,
            borderColor: "#10b981",
            fill: true,
            backgroundColor: "rgba(16,185,129,0.1)",
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }, []);

  useEffect(() => {
    api
      .get("/marketing")
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ API error:", err.response?.data || err.message);
        setLoading(false);
        if (err.response?.status === 401) window.location.href = "/login";
      });
  }, []);

  useEffect(() => {
    if (stats?.months?.length > 0) renderCharts(stats);
  }, [stats, renderCharts]);

  if (loading || !stats) return <LoadingScreen />; // tampilkan loading

  const hideSensitive = stats.role === "marketing_estimator";

  const cardsRow1 = [
    {
      title: "Total Quotation",
      value: stats.totalQuotation,
      color: "blue",
      icon: <FaFileInvoice size={22} />,
    },
    {
      title: "Total Project",
      value: stats.totalProject,
      color: "orange",
      icon: <FaProjectDiagram size={22} />,
    },
    {
      title: "Outstanding Quotation",
      value: stats.outstandingQuotation,
      color: "yellow",
      icon: <FaClock size={22} />,
    },
  ];

  const cardsRow2 = !hideSensitive
    ? [
        {
          title: "Total Quotation Value",
          value: formatRp(stats.totalQuotationValue),
          color: "green",
          icon: <FaMoneyBillWave size={22} />,
          mask: true,
        },
        {
          title: "Total Sales Value",
          value: formatRp(stats.totalSalesValue),
          color: "purple",
          icon: <FaChartLine size={22} />,
          mask: true,
        },
      ]
    : [];

  return (
    <div className="w-[100%] mx-auto p-4 lg:p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {cardsRow1.map((c, i) => (
          <DashboardCard
            key={i}
            {...c}
            showAll={null}
            compact={true} // optional prop untuk styling compact
          />
        ))}
      </div>

      {cardsRow2.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {cardsRow2.map((c, i) => (
            <DashboardCard
              key={i}
              {...c}
              showAll={toggleAllNominal}
              compact={true}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaChartBar className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              Quotation & Sales Value
            </h2>
          </div>
          <canvas id="barChart" className="h-60"></canvas>
        </div>

        <div
          className="bg-white shadow rounded-xl p-4 
     flex flex-col 
     h-72 sm:h-80 md:h-96 lg:h-[28rem] w-full"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <FaChartPie className="text-purple-500 text-lg" />
            <h2 className="text-sm font-semibold text-gray-700">
              Quotation Status Distribution
            </h2>
          </div>

          {/* Chart container */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square">
              <canvas id="statusPieChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FaChartLine className="text-green-500" />
          <h2 className="text-sm font-semibold text-gray-700">
            Monthly Trend (Quotation & Sales)
          </h2>
        </div>
        <canvas id="lineChart" className="h-60"></canvas>
      </div>
    </div>
  );
}
