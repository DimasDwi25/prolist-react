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
import { formatValue } from "../../utils/formatValue";

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
const DashboardCharts = ({
  stats,
  updating,
  enableTarget,
  targetMode,
  targetQuotation,
  targetSales,
  monthlyTargets,
  setEnableTarget,
  setTargetMode,
  setTargetQuotation,
  setTargetSales,
  setMonthlyTargets,
}) => {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);

  const renderCharts = useCallback((data, targets) => {
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
    const datasets = [
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
    ];

    // Tambahkan target datasets jika enabled
    if (targets.enableTarget) {
      if (targets.targetMode === "yearly") {
        if (targets.targetQuotation > 0) {
          datasets.push({
            label: "Target Quotation",
            data: Array(data.months.length).fill(targets.targetQuotation),
            borderColor: "#ef4444",
            borderDash: [5, 5],
            fill: false,
            tension: 0,
          });
        }
        if (targets.targetSales > 0) {
          datasets.push({
            label: "Target Sales",
            data: Array(data.months.length).fill(targets.targetSales),
            borderColor: "#f59e0b",
            borderDash: [5, 5],
            fill: false,
            tension: 0,
          });
        }
      } else if (targets.targetMode === "monthly") {
        if (targets.monthlyTargets.quotation.some((v) => v > 0)) {
          datasets.push({
            label: "Target Quotation",
            data: targets.monthlyTargets.quotation,
            borderColor: "#ef4444",
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
          });
        }
        if (targets.monthlyTargets.sales.some((v) => v > 0)) {
          datasets.push({
            label: "Target Sales",
            data: targets.monthlyTargets.sales,
            borderColor: "#f59e0b",
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
          });
        }
      }
    }

    lineChartRef.current = new Chart(document.getElementById("lineChart"), {
      type: "line",
      data: {
        labels: data.months,
        datasets: datasets,
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        animation: { duration: 800, easing: "easeOutQuart" },
      },
    });
  }, []);

  useEffect(() => {
    if (stats?.months?.length > 0)
      renderCharts(stats, {
        enableTarget,
        targetMode,
        targetQuotation,
        targetSales,
        monthlyTargets,
      });
  }, [
    stats,
    renderCharts,
    enableTarget,
    targetMode,
    targetQuotation,
    targetSales,
    monthlyTargets,
  ]);

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
              Quote Ammounts & Booking Sales
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

      {/* Target Settings */}
      <div className="bg-white shadow rounded-xl p-4 mb-4 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="enableTarget"
            checked={enableTarget}
            onChange={(e) => setEnableTarget(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="enableTarget"
            className="text-lg font-semibold text-gray-700"
          >
            Set Target
          </label>
        </div>

        {enableTarget && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="targetMode"
                  value="yearly"
                  checked={targetMode === "yearly"}
                  onChange={(e) => setTargetMode(e.target.value)}
                />
                Per Tahun
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="targetMode"
                  value="monthly"
                  checked={targetMode === "monthly"}
                  onChange={(e) => setTargetMode(e.target.value)}
                />
                Per Bulan
              </label>
            </div>

            {targetMode === "yearly" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Quotation
                  </label>
                  <input
                    type="text"
                    value={formatValue(targetQuotation)
                      .formatted.replace("Rp", "")
                      .trim()}
                    onChange={(e) => {
                      const numValue = e.target.value.replace(/[^\d]/g, "");
                      setTargetQuotation(Number(numValue));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Sales
                  </label>
                  <input
                    type="text"
                    value={formatValue(targetSales)
                      .formatted.replace("Rp", "")
                      .trim()}
                    onChange={(e) => {
                      const numValue = e.target.value.replace(/[^\d]/g, "");
                      setTargetSales(Number(numValue));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">
                    Target Quotation per Bulan
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {monthlyTargets.quotation.map((val, idx) => (
                      <div key={idx}>
                        <label className="block text-xs text-gray-500 mb-1">
                          {new Date(0, idx).toLocaleString("id-ID", {
                            month: "short",
                          })}
                        </label>
                        <input
                          type="text"
                          value={formatValue(val)
                            .formatted.replace("Rp", "")
                            .trim()}
                          onChange={(e) => {
                            const numValue = e.target.value.replace(
                              /[^\d]/g,
                              ""
                            );
                            const newTargets = { ...monthlyTargets };
                            newTargets.quotation[idx] = Number(numValue);
                            setMonthlyTargets(newTargets);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">
                    Target Sales per Bulan
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {monthlyTargets.sales.map((val, idx) => (
                      <div key={idx}>
                        <label className="block text-xs text-gray-500 mb-1">
                          {new Date(0, idx).toLocaleString("id-ID", {
                            month: "short",
                          })}
                        </label>
                        <input
                          type="text"
                          value={formatValue(val)
                            .formatted.replace("Rp", "")
                            .trim()}
                          onChange={(e) => {
                            const numValue = e.target.value.replace(
                              /[^\d]/g,
                              ""
                            );
                            const newTargets = { ...monthlyTargets };
                            newTargets.sales[idx] = Number(numValue);
                            setMonthlyTargets(newTargets);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
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

  // State untuk target
  const [enableTarget, setEnableTarget] = useState(() => {
    try {
      const saved = localStorage.getItem("marketingTargets");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.enable ?? false;
      }
    } catch (e) {
      console.error("Error loading enableTarget from localStorage:", e);
    }
    return false;
  });
  const [targetMode, setTargetMode] = useState(() => {
    try {
      const saved = localStorage.getItem("marketingTargets");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.mode ?? "yearly";
      }
    } catch (e) {
      console.error("Error loading targetMode from localStorage:", e);
    }
    return "yearly";
  });
  const [targetQuotation, setTargetQuotation] = useState(() => {
    try {
      const saved = localStorage.getItem("marketingTargets");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.quotation ?? 0;
      }
    } catch (e) {
      console.error("Error loading targetQuotation from localStorage:", e);
    }
    return 0;
  });
  const [targetSales, setTargetSales] = useState(() => {
    try {
      const saved = localStorage.getItem("marketingTargets");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.sales ?? 0;
      }
    } catch (e) {
      console.error("Error loading targetSales from localStorage:", e);
    }
    return 0;
  });
  const [monthlyTargets, setMonthlyTargets] = useState(() => {
    try {
      const saved = localStorage.getItem("marketingTargets");
      if (saved) {
        const parsed = JSON.parse(saved);
        return (
          parsed.monthly ?? {
            quotation: Array(12).fill(0),
            sales: Array(12).fill(0),
          }
        );
      }
    } catch (e) {
      console.error("Error loading monthlyTargets from localStorage:", e);
    }
    return {
      quotation: Array(12).fill(0),
      sales: Array(12).fill(0),
    };
  });

  // Save target ke localStorage setiap kali state berubah
  useEffect(() => {
    const data = {
      enable: enableTarget,
      mode: targetMode,
      quotation: targetQuotation,
      sales: targetSales,
      monthly: monthlyTargets,
    };
    localStorage.setItem("marketingTargets", JSON.stringify(data));
  }, [enableTarget, targetMode, targetQuotation, targetSales, monthlyTargets]);

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
          title: "Quote Ammounts",
          value: new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(stats.totalQuotationValue),
          color: "green",
          icon: <FaMoneyBillWave size={22} />,
          mask: true, // nilai sensitif default hide
        },
        {
          title: "Booking Sales",
          value: new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(stats.totalSalesValue),
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

      <DashboardCharts
        stats={stats}
        updating={updating}
        enableTarget={enableTarget}
        targetMode={targetMode}
        targetQuotation={targetQuotation}
        targetSales={targetSales}
        monthlyTargets={monthlyTargets}
        setEnableTarget={setEnableTarget}
        setTargetMode={setTargetMode}
        setTargetQuotation={setTargetQuotation}
        setTargetSales={setTargetSales}
        setMonthlyTargets={setMonthlyTargets}
        formatRp={(num) =>
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(num)
        }
      />
    </div>
  );
}
