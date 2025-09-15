import React from "react";
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
  areas?: any[];
  regionCodes?: any[];
  provinceCodes?: any[];
  billCycleOptions?: any[];
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
  chartColors,
  areas = [],
  regionCodes = [],
  provinceCodes = [],
  billCycleOptions = []
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

  // Function to get cycle display with month and year
  const getCycleDisplayName = () => {
    const cycleOption = billCycleOptions.find(option => option.code === formData.cycle);
    if (cycleOption) {
      return `${cycleOption.display} - ${formData.cycle}`;
    }
    return formData.cycle;
  };

  // Function to get the display name for area/region/province
  const getLocationDisplayName = () => {
    if (formData.option === "A") {
      const area = areas.find(area => area.AreaCode === formData.areaCode);
      return area ? `Area - ${area.AreaName} (${formData.areaCode})` : `Area - ${formData.areaCode}`;
    } else if (formData.option === "P") {
      const province = provinceCodes.find(province => province.code === formData.areaCode);
      return province ? `Province - ${province.name} (${formData.areaCode})` : `Province - ${formData.areaCode}`;
    } else if (formData.option === "D") {
      const region = regionCodes.find(region => region.code === formData.areaCode);
      return region ? `Region - ${region.name} (${formData.areaCode})` : `Region - ${formData.areaCode}`;
    } else if (formData.option === "E") {
      return "Entire CEB";
    }
    return "";
  };

  // Logic for dynamic Area/Province/Division/Entire CEB label
  const locationLabel = getLocationDisplayName();

  return (
    <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4">
        <div className="p-5 border-b no-print">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-base font-bold text-gray-800">
                DEBTORS SUMMARY - (Cycle: {getCycleDisplayName()})
              </h2>
              {/* Dynamically show Area, Province, Division, or Entire CEB */}
              {locationLabel && (
                <h3 className="text-sm text-[#7A0000]">{locationLabel}</h3>
              )}
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              <button
                onClick={downloadAsCSV}
                className="px-4 py-1.5 bg-white border border-gray-300 text-xs rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export CSV
              </button>
              <button
                onClick={printPDF}
                className="px-4 py-1.5 bg-white border border-gray-300 text-xs rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z"
                  />
                </svg>
                Print PDF
              </button>
              <button onClick={() => setShowModal(false)} className="px-4 py-1.5 bg-[#7A0000] hover:bg-[#A52A2A] text-xs rounded-md text-white flex items-center"
              >
                Back to Form
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

        {/* <div className="p-5 border-t no-print flex flex-col items-center">
          <div className="text-xs text-gray-500">
            Generated on: {new Date().toLocaleDateString()} | CEB@2025
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default DebtorsModal;