import React from "react";
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DebtorsTable from "./DebtorsTable";
import DebtorsPieChart from "./DebtorsPieChart";
import DebtorsBarChart from "./DebtorsBarChart";
import CustomTooltip from "./CustomTooltip";

interface DebtorsModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  data: any;
  formData: any;
  error: string | null;
  loading: boolean;
  columns: any[];
  formatCurrency: (value: number | undefined) => string;
  calculateTotals: (data: any[]) => any;
  preparePieChartData: (data: any[]) => any[];
  prepareBarChartData: (data: any[]) => any[];
  downloadAsCSV: () => void;
  printPDF: () => void;
  chartColors: string[];
}

const DebtorsModal: React.FC<DebtorsModalProps> = ({
  showModal,
  setShowModal,
  data,
  formData,
  error,
  loading,
  columns,
  formatCurrency,
  calculateTotals,
  preparePieChartData,
  prepareBarChartData,
  downloadAsCSV,
  printPDF,
  chartColors
}) => {
  if (!showModal) return null;

  const hasOrdinary = data.ordinary.length > 0 && formData.showOrdinary;
  const hasBulk = data.bulk.length > 0 && formData.showBulk;
  const showCharts = (hasOrdinary && !hasBulk) || (!hasOrdinary && hasBulk); // Hide if both are selected

  const ordinaryTotal = hasOrdinary ? calculateTotals(data.ordinary) : null;
  const bulkTotal = hasBulk ? calculateTotals(data.bulk) : null;

  const ordinaryPieData = hasOrdinary ? preparePieChartData(data.ordinary) : null;
  const bulkPieData = hasBulk ? preparePieChartData(data.bulk) : null;

  const ordinaryBarData = hasOrdinary ? prepareBarChartData(data.ordinary) : null;
  const bulkBarData = hasBulk ? prepareBarChartData(data.bulk) : null;

  // Logic for dynamic Area/Province/Division/Entire CEB label
  let locationLabel = "";
  if (formData.option === "A") {
    locationLabel = `Area - ${formData.areaCode}`;
  } else if (formData.option === "P") {
    locationLabel = `Province - ${formData.areaCode}`;
  } else if (formData.option === "D") {
    locationLabel = `Division - ${formData.areaCode}`;
  } else if (formData.option === "E") {
    locationLabel = "Entire CEB";
  }

  return (
    <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4">
        <div className="p-5 border-b no-print">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-base font-bold text-gray-800">
                DEBTORS SUMMARY - (Cycle: {formData.cycle})
              </h2>
              {/* Dynamically show Area, Province, Division, or Entire CEB */}
              {locationLabel && (
                <h3 className="text-sm text-[#7A0000]">{locationLabel}</h3>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={downloadAsCSV} className="px-3 py-1.5 border text-xs border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700">
                Export CSV
              </button>
              <button onClick={printPDF} className="px-3 py-1.5 border text-xs border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700">
                Print PDF
              </button>
            </div>
          </div>
          {error && <div className="text-red-600 text-xs mt-2 text-center">{error}</div>}
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mr-3"></div>
              <span className="text-[#7A0000] text-sm">Loading...</span>
            </div>
          ) : !hasOrdinary && !hasBulk ? (
            <div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded text-sm text-center">
              No data found
            </div>
          ) : (
            <div className="w-full overflow-x-auto text-xs">
              {hasOrdinary && (
                <>
                  <DebtorsTable
                    data={data.ordinary}
                    columns={columns}
                    totalRow={ordinaryTotal}
                  
                    title="Ordinary Debtors"
                    tableKeyPrefix="ordinary"
                  />
                  {showCharts && ordinaryPieData && (
                    <DebtorsPieChart
                      data={ordinaryPieData}
                      title="Total Ordinary Debtors Distribution"
                      chartColors={chartColors}
                      formatCurrency={formatCurrency}
                    />
                  )}
                  {showCharts && ordinaryBarData && (
                    <DebtorsBarChart
                      data={ordinaryBarData}
                      title="Ordinary Debtors Monthly Breakdown"
                      chartColors={chartColors}
                      formatCurrency={formatCurrency}
                      CustomTooltip={(props) => <CustomTooltip {...props} formatCurrency={formatCurrency} />}
                      showGovSeparator={true}
                    />
                  )}
                </>
              )}

              {hasBulk && (
                <>
                  <DebtorsTable
                    data={data.bulk}
                    columns={columns}
                    totalRow={bulkTotal}
                    
                    title="Bulk Debtors"
                    tableKeyPrefix="bulk"
                  />
                  {showCharts && bulkPieData && (
                    <DebtorsPieChart
                      data={bulkPieData}
                      title="Total Bulk Debtors Distribution"
                      chartColors={chartColors}
                      formatCurrency={formatCurrency}
                    />
                  )}
                  {showCharts && bulkBarData && (
                    <DebtorsBarChart
                      data={bulkBarData}
                      title="Bulk Debtors Monthly Breakdown"
                      chartColors={chartColors}
                      formatCurrency={formatCurrency}
                      CustomTooltip={(props) => <CustomTooltip {...props} formatCurrency={formatCurrency} />}
                      showGovSeparator={true}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t no-print flex flex-col items-center">
          <button onClick={() => setShowModal(false)} className="px-4 py-1.5 text-sm bg-[#7A0000] text-white rounded hover:brightness-110 mb-2">
            Close Report
          </button>
          <div className="text-xs text-gray-500">
            Generated on: {new Date().toLocaleDateString()} | CEB@2025
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtorsModal;
