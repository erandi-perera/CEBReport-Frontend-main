import React, { useRef } from "react";
import { FaDownload, FaPrint } from "react-icons/fa";
import { ChevronLeft } from "lucide-react";

interface TrialBalanceData {
  AcCd: string;
  GlName: string;
  TitleFlag: string;
  OpSbal: number;
  DrSamt: number;
  CrSamt: number;
  ClSbal: number;
  CctName: string;
}

interface TrialData {
  costctr: string;
  year: number | null;
  month: string;
  deptName: string;
}

interface TrialBalanceModalProps {
  trialModalOpen: boolean;
  closeTrialModal: () => void;
  trialData: TrialData;
  trialBalanceData: TrialBalanceData[];
  trialLoading: boolean;
  trialError: string | null;
  maroon: string;
  maroonBg: string;
  formatNumber: (num: number) => string;
  getCategory: (acCd: string) => string;
  calculateTotals: () => any;
  downloadAsCSV: () => void;
  printPDF: () => void;
  goBack: () => void; // <-- new prop
}

const TrialBalanceModal: React.FC<TrialBalanceModalProps> = ({
  trialModalOpen,
  closeTrialModal,
  trialData,
  trialBalanceData,
  trialLoading,
  trialError,
  maroon,
  maroonBg,
  formatNumber,
  getCategory,
  calculateTotals,
  downloadAsCSV,
  printPDF,
  goBack
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { categoryTotals, grandTotals } = calculateTotals();

  // Get category icon and description
  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'Assets': return '🏦';
      case 'Expenditure': return '💸';
      case 'Liabilities': return '📋';
      case 'Revenue': return '💰';
      default: return '📊';
    }
  };

  const getCategoryDescription = (category: string): string => {
    switch (category) {
      case 'Assets': return 'ASSETS';
      case 'Expenditure': return 'EXPENDITURE';
      case 'Liabilities': return 'LIABILITIES';
      case 'Revenue': return 'REVENUE';
      default: return 'OTHER';
    }
  };
  if (!trialModalOpen) return null;
  return (
    <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4" ref={printRef}>
        <div className="p-5 border-b no-print">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-800">
                MONTHLY TRIAL BALANCE - {trialData.month.toUpperCase()}/{trialData.year || 'N/A'}
              </h2>
              <h3 className={`text-sm ${maroon}`}>
                Cost Center- {trialData.costctr} - {trialData.deptName}
              </h3>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={downloadAsCSV}
                className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              >
                <FaDownload className="w-3 h-3" /> CSV
              </button>
              <button
                onClick={printPDF}
                className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
              >
                <FaPrint className="w-3 h-3" /> PDF
              </button>
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-4 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Date Selection
              </button>
              <button
                onClick={closeTrialModal}
                className={`px-3 py-1.5 text-xs ${maroonBg} text-white rounded hover:brightness-110`} 
              >
                Back To Home
              </button>
            </div>
          </div>
          {trialError && (
            <div className="text-red-600 text-xs mt-2 text-center">
              {trialError.includes("JSON.parse") ? "Data format error" : trialError}
            </div>
          )}
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-grow print:overflow-visible" id="trial-balance-table">
          {trialLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mr-3"></div>
              <span className={`${maroon} text-sm`}>Loading...</span>
            </div>
          ) : trialBalanceData.length === 0 ? (
            <div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded text-sm text-center">
              No data found
            </div>
          ) : (
            <div className="w-full overflow-x-auto text-xs">
              <table className="w-full print-table">
                <thead>
                  <tr className={`${maroon} font-medium border-b`}>
                    <th className="px-1 py-0.5 text-left w-[10%] print:hidden">Code</th>
                    <th className="px-1 py-0.5 text-left w-[40%] description-cell">Description/Name</th>
                    <th className="px-1 py-0.5 text-right w-[15%]">Opening Balance</th>
                    <th className="px-1 py-0.5 text-right w-[15%]">Debit Amount</th>
                    <th className="px-1 py-0.5 text-right w-[15%]">Credit Amount</th>
                    <th className="px-1 py-0.5 text-right w-[15%]">Closing Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalanceData.map((row, index) => {
                    const currentCategory = getCategory(row.AcCd);
                    const prevCategory = index > 0 ? getCategory(trialBalanceData[index - 1].AcCd) : null;
                    const showCategoryHeader = currentCategory !== prevCategory;
                    const nextCategory = index < trialBalanceData.length - 1 ? getCategory(trialBalanceData[index + 1].AcCd) : null;
                    const showCategoryTotal = currentCategory !== nextCategory;
                    return (
                      <React.Fragment key={index}>
                        {showCategoryHeader && (
                          <tr className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-b-2 border-[#7A0000]">
                            <td colSpan={6} className="px-3 py-2 font-bold text-center text-[#7A0000] text-sm">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-lg">{getCategoryIcon(currentCategory)}</span>
                                <span>{getCategoryDescription(currentCategory)}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-1 py-0.5 font-mono print:hidden">{row.AcCd}</td>
                          <td className="px-1 py-0.5 truncate description-cell pr-2">{row.GlName.trim()}</td>
                          <td className="px-1 py-0.5 text-right font-mono">{formatNumber(row.OpSbal)}</td>
                          <td className="px-1 py-0.5 text-right font-mono">{formatNumber(row.DrSamt)}</td>
                          <td className="px-1 py-0.5 text-right font-mono">{formatNumber(row.CrSamt)}</td>
                          <td className="px-1 py-0.5 text-right font-mono">{formatNumber(row.ClSbal)}</td>
                        </tr>
                        {showCategoryTotal && (
                          <tr className="bg-gradient-to-r from-gray-200 to-gray-300 font-bold border-t-2 border-[#7A0000]">
                            <td className="px-2 py-1 text-xs print:hidden" colSpan={1}>Total {getCategoryDescription(currentCategory)}</td>
                            <td className="px-2 py-1 text-xs" colSpan={1}></td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(categoryTotals[row.AcCd.charAt(0).toUpperCase()].opening)}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(categoryTotals[row.AcCd.charAt(0).toUpperCase()].debit)}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(categoryTotals[row.AcCd.charAt(0).toUpperCase()].credit)}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(categoryTotals[row.AcCd.charAt(0).toUpperCase()].closing)}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`${maroon} font-medium border-t`}>
                    <td className="px-1 py-0.5 text-xs print:hidden" colSpan={1}>Grand Total</td>
                    <td className="px-1 py-0.5 text-xs" colSpan={1}></td>
                    <td className="px-1 py-0.5 text-right font-mono">{formatNumber(grandTotals.opening)}</td>
                    <td className="px-1 py-0.5 text-right font-mono">{formatNumber(grandTotals.debit)}</td>
                    <td className="px-1 py-0.5 text-right font-mono">{formatNumber(grandTotals.credit)}</td>
                    <td className="px-1 py-0.5 text-right font-mono">{formatNumber(grandTotals.closing)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <div className="p-5 border-t no-print flex flex-col items-center">
          <div className="text-xs text-gray-500">
            Generated on: {new Date().toLocaleDateString()} | CEB@2025
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalanceModal;
