import { useState } from "react";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import CustomAreaChart from "../../../../shared/CustomAreaChart";
import CustomBarChart from "../../../../shared/CustomBarChart";
import type { BulkCustomerTransDetail } from "../../../../../interfaces/chartTypes";

type Props = {
  data: BulkCustomerTransDetail[];
};

const BillingChart = ({ data }: Props) => {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  const handleViewReport = () => {
    navigate("/report/billing-payment/bulk-report");
  };

  const renderChart = () => {
    if (chartType === "area") {
      return (
        <CustomAreaChart
          data={data}
          xAxisKey="year"
          dataKey="units"
          name="Units"
          unit="kWh"
        />
      );
    } else {
      return (
        <CustomBarChart
          data={data}
          xAxisKey="year"
          dataKey="units"
          name="Units"
          unit="kWh"
        />
      );
    }
  };

  return (
    data && (
      <div className="w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col relative group">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Professional Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 py-3 flex-shrink-0 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  Transaction
                </h3>
                <p className="text-blue-100 text-xs">Bulk customer</p>
              </div>
            </div>

            {/* Chart Type Selector */}
            <div className="flex items-center gap-1">
              <span className="text-blue-100 text-xs font-medium">Type:</span>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as "bar" | "area")}
                className="px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white focus:ring-1 focus:ring-white/50 focus:border-white outline-none transition-all duration-200 backdrop-blur-sm"
              >
                <option value="bar" className="text-gray-800">
                  Bar
                </option>
                <option value="area" className="text-gray-800">
                  Area
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 p-3 min-h-0">
          <div className="w-full h-full">{renderChart()}</div>
        </div>

        {/* Data Insights Bar - After Chart */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-2 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-blue-600">
                  Rs.{" "}
                  {data
                    .reduce((sum, item) => sum + (item.amount || 0), 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Avg:</span>
                <span className="font-semibold text-green-600">
                  Rs.{" "}
                  {(
                    data.reduce((sum, item) => sum + (item.amount || 0), 0) /
                      data.length || 0
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Max:</span>
                <span className="font-semibold text-purple-600">
                  Rs.{" "}
                  {Math.max(...data.map((item) => item.amount || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-2 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600 text-xs">
                {data.length} records
              </span>
            </div>
            <button
              onClick={handleViewReport}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium rounded hover:from-blue-700 hover:to-blue-800 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow flex items-center gap-1 group"
            >
              <BsBoxArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              View Report
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default BillingChart;
