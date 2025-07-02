import React from "react";
import { SalesRecord } from "../../../redux/slices/SalesSlice";
import {
  FaListOl,
  FaFileDownload,
  FaPrint,
  FaChartBar,
  FaCalendarAlt,
  FaCalculator,
} from "react-icons/fa";

interface SalesReportTableProps {
  data: SalesRecord[] | null;
  title: string;
  loading: boolean;
}

const SalesReportTable: React.FC<SalesReportTableProps> = ({
  data,
  title,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-blue-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Loading sales data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-gray-600 bg-gray-50 border border-gray-200 p-4 rounded">
        No sales data available for the selected criteria.
      </div>
    );
  }

  // Safely get all unique keys from the data for dynamic column generation
  const allKeys = Array.from(
    new Set(
      data
        .filter(
          (item) => item && typeof item === "object" && !Array.isArray(item)
        )
        .flatMap((item) => Object.keys(item))
    )
  ).filter((key) => key !== "id"); // Exclude id if it exists

  // If no valid keys found, show error
  if (allKeys.length === 0) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded">
        Invalid data format received from the API.
      </div>
    );
  }

  // Function to format column headers
  const formatHeader = (key: string) => {
    const headerMap: { [key: string]: string } = {
      tariff: "Tariff",
      noAccts: "No. of Accounts",
      kwhUnits: "KWH Units",
      kwhCharge: "KWH Charge",
      fuelCharge: "Fuel Charge",
      taxCharge: "Tax Charge",
      fixedCharge: "Fixed Charge",
      Charge: "Total Charge",
      kwoUnits: "KWO Units",
      kwdUnits: "KWD Units",
      kwpUnits: "KWP Units",
      kvaUnits: "KVA Units",
      kwoCharge: "KWO Charge",
      kwdCharge: "KWD Charge",
      kwpCharge: "KWP Charge",
      kvaCharge: "KVA Charge",
      facCharge: "FAC Charge",
      payments: "Payments",
    };

    return (
      headerMap[key] ||
      key
        .replace(/([A-Z])/g, " $1") // Add space before capital letters
        .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
        .trim()
    );
  };

  // Function to format cell values
  const formatCellValue = (value: any, key: string) => {
    if (value === null || value === undefined) return "-";

    // Handle numeric values (charges, units, etc.)
    if (typeof value === "number") {
      // Format currency values
      if (key.toLowerCase().includes("charge") || key === "payments") {
        return `Rs. ${value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
      // Format unit values
      if (key.toLowerCase().includes("units") || key === "noAccts") {
        return value.toLocaleString("en-US");
      }
      return value.toLocaleString("en-US");
    }

    if (typeof value === "string") {
      // Check if it's a date string
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
      // Trim whitespace from tariff strings
      if (key === "tariff") {
        return value.trim();
      }
      return value;
    }

    return String(value);
  };

  // Filter data to only include valid objects
  const validData = data.filter(
    (item) => item && typeof item === "object" && !Array.isArray(item)
  );

  // Download as Excel (CSV)
  const downloadAsCSV = () => {
    if (!validData || validData.length === 0) return;

    const csvRows = [
      allKeys.map((key) => formatHeader(key)),
      ...validData.map((row) =>
        allKeys.map((key) => {
          const value = row[key];
          if (typeof value === "number") {
            return value.toString();
          }
          return value || "";
        })
      ),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((row) => row.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${title.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print as PDF
  const printPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 bg-white rounded-lg shadow border border-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <FaChartBar className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 tracking-tight">
            {title}
          </h2>
          <span className="ml-2 text-xs text-gray-500 font-normal">
            Records:{" "}
            <span className="text-gray-700 font-semibold">
              {validData.length}
            </span>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={printPDF}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200 hover:bg-gray-200 transition"
          >
            <FaPrint className="w-3 h-3" /> Print PDF
          </button>
          <button
            onClick={downloadAsCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200 hover:bg-gray-200 transition"
          >
            <FaFileDownload className="w-3 h-3" /> Download Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 shadow-sm border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <FaCalculator className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Total Records
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {validData.length}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 shadow-sm border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <FaListOl className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Tariff Categories
            </span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {new Set(validData.map((item) => item.tariff)).size}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 shadow-sm border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <FaCalendarAlt className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              Generated
            </span>
          </div>
          <div className="text-sm font-semibold text-purple-900">
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-1">
          <FaListOl className="text-gray-400 w-4 h-4" /> Sales Data
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {allKeys.map((key) => (
                  <th
                    key={key}
                    className={`px-3 py-2 border-b text-left font-medium text-gray-700 ${
                      key.toLowerCase().includes("charge") || key === "payments"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {formatHeader(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validData.map((row, index) => (
                <tr
                  key={index}
                  className={
                    index % 2 === 0
                      ? "bg-white hover:bg-gray-50 transition"
                      : "bg-gray-50 hover:bg-gray-100 transition"
                  }
                >
                  {allKeys.map((key) => (
                    <td
                      key={key}
                      className={`px-3 py-2 border-b text-gray-700 ${
                        key.toLowerCase().includes("charge") ||
                        key === "payments"
                          ? "text-right font-medium"
                          : "text-left"
                      }`}
                    >
                      {formatCellValue(row[key], key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 rounded-b-lg">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Showing {validData.length} records</span>
          <span className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesReportTable;
