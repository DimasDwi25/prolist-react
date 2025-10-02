import React, { useState, useEffect, useRef, useCallback } from "react";
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
import FilterBar from "../../components/filter/FilterBar";
import LoadingScreen from "../../components/loading/loadingScreen";

// Warna card
const colorMap = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
};

const DashboardCard = ({ title, value, color, icon, mask, updating }) => {
  const [show, setShow] = useState(false); // default hide
  const colors = colorMap[color] || colorMap.blue;
  const isVisible = show; // default false, toggle saat klik

  return (
    <div
      className={`bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between relative overflow-hidden`}
    >
      {updating && (
        <div className="absolute inset-0 bg-white bg-opacity-70 animate-pulse z-10 rounded-xl" />
      )}
      <div className="flex items-center gap-3 mb-2">
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

      {/* Toggle eye di bawah value */}
      {mask && (
        <button
          onClick={() => setShow(!show)}
          className="mt-2 text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1 transition"
        >
          {isVisible ? <FaEyeSlash /> : <FaEye />}{" "}
          <span>{isVisible ? "" : ""}</span>
        </button>
      )}
    </div>
  );
};

// Hook fetch data
const useMarketingStats = (initialFilter) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    const fetchData = async () => {
      if (stats) setUpdating(true);
      else setLoading(true);

      try {
        let url = `/marketing?year=${filter.year}&range_type=${filter.rangeType}`;
        if (filter.rangeType === "monthly" && filter.month)
          url += `&month=${filter.month}`;
        if (filter.rangeType === "custom" && filter.from && filter.to)
          url += `&from_date=${filter.from}&to_date=${filter.to}`;

        const res = await api.get(url);
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setUpdating(false);
      }
    };

    fetchData();
  }, [filter]);

  return { stats, loading, updating, filter, setFilter };
};

// Chart dengan fade-in animation
const DashboardCharts = ({ stats, updating }) => {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);

  const renderCharts = useCallback((data) => {
    // Destroy chart jika sudah ada
    if (barChartRef.current) barChartRef.current.destroy();
    if (pieChartRef.current) pieChartRef.current.destroy();
    if (lineChartRef.current) lineChartRef.current.destroy();

    // Bar chart
    barChartRef.current = new Chart(document.getElementById("barChart"), {
      type: "bar",
      data: {
        labels: ["Quotation", "Sales"],
        datasets: [
          {
            data: [data.totalQuotationValue, data.totalSalesValue],
            backgroundColor: ["#3b82f6", "#a78bfa"],
            borderRadius: 6,
            barThickness: 30,
            categoryPercentage: 0.6,
            barPercentage: 0.8,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        animation: { duration: 800, easing: "easeOutQuart" },
      },
    });

    // Pie chart
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
        animation: { duration: 800, easing: "easeOutQuart" },
      },
    });

    // Line chart
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
            tension: 0.4,
          },
          {
            label: "Sales",
            data: data.salesPerMonthData,
            borderColor: "#10b981",
            fill: true,
            backgroundColor: "rgba(16,185,129,0.1)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        animation: { duration: 800, easing: "easeOutQuart" },
      },
    });
  }, []);

  useEffect(() => {
    if (stats?.months?.length > 0) renderCharts(stats);
  }, [stats, renderCharts]);

  return (
    <div
      className={`transition-opacity duration-500 ${
        updating ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-xl p-4 relative">
          {updating && (
            <div className="absolute inset-0 bg-white bg-opacity-70 animate-pulse rounded-xl z-10" />
          )}
          <div className="flex items-center gap-2 mb-3">
            <FaChartBar className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              Quotation & Sales Value
            </h2>
          </div>
          <canvas id="barChart" className="h-60"></canvas>
        </div>

        <div className="bg-white shadow rounded-xl p-4 flex flex-col h-72 sm:h-80 md:h-96 lg:h-[28rem] w-full relative">
          {updating && (
            <div className="absolute inset-0 bg-white bg-opacity-70 animate-pulse rounded-xl z-10" />
          )}
          <div className="flex items-center gap-2 mb-3">
            <FaChartPie className="text-purple-500 text-lg" />
            <h2 className="text-sm font-semibold text-gray-700">
              Quotation Status Distribution
            </h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square">
              <canvas id="statusPieChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-4 relative mt-4">
        {updating && (
          <div className="absolute inset-0 bg-white bg-opacity-70 animate-pulse rounded-xl z-10" />
        )}
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
};

// Main dashboard
export default function MarketingDashboard() {
  const { stats, loading, updating, setFilter } = useMarketingStats({
    year: new Date().getFullYear(),
    rangeType: "monthly",
    month: null,
    from: "",
    to: "",
  });

  const formatRp = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(num);

  if (loading) return <LoadingScreen />;

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
          mask: true, // nilai sensitif default hide
        },
        {
          title: "Total Sales Value",
          value: formatRp(stats.totalSalesValue),
          color: "purple",
          icon: <FaChartLine size={22} />,
          mask: true, // nilai sensitif default hide
        },
      ]
    : [];

  return (
    <div className="w-full mx-auto p-4 lg:p-6 space-y-6">
      <FilterBar stats={stats} onFilter={setFilter} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {cardsRow1.map((c, i) => (
          <DashboardCard key={i} {...c} updating={updating} />
        ))}
      </div>

      {cardsRow2.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {cardsRow2.map((c, i) => (
            <DashboardCard key={i} {...c} updating={updating} />
          ))}
        </div>
      )}

      <DashboardCharts stats={stats} updating={updating} />
    </div>
  );
}
