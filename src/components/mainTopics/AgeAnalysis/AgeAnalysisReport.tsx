import React, { useRef } from 'react';
import { Debtor, FormData, Area, BillCycleOption } from './types';
import { CUSTOMER_TYPE_OPTIONS } from './utils';
import AgeAnalysisTable from './AgeAnalysisTable';

interface AgeAnalysisReportProps {
  debtors: Debtor[];
  formData: FormData;
  areas: Area[];
  billCycleOptions: BillCycleOption[];
  reportLoading: boolean;
  reportError: string | null;
  onDownloadCSV: () => void;
  onPrintPDF: () => void;
  onBackToForm: () => void;
}

const AgeAnalysisReport: React.FC<AgeAnalysisReportProps> = ({
  debtors,
  formData,
  areas,
  billCycleOptions,
  reportLoading,
  reportError,
  onDownloadCSV,
  onPrintPDF,
  onBackToForm
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const getCustomerTypeDisplay = () => {
    return CUSTOMER_TYPE_OPTIONS.find(t => t.value === formData.custType)?.display || '';
  };

  const getBillCycleDisplay = () => {
    return billCycleOptions.find(b => b.code === formData.billCycle)?.display || '';
  };

  const getAreaDisplay = () => {
    const area = areas.find(a => a.AreaCode === formData.areaCode);
    return area ? `${area.AreaName} (${area.AreaCode})` : '';
  };


  return (
    <div className="mt-8" ref={printRef}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-[#7A0000]">
          Debtors Age Analysis – {getCustomerTypeDisplay()} Customers
        </h3>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={onDownloadCSV}
            className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
            disabled={!debtors.length}
          >
            CSV
          </button>
          <button 
            onClick={onPrintPDF}
            className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
            disabled={!debtors.length}
          >
            PDF
          </button>
          <button 
            onClick={onBackToForm}
            className="px-3 py-1 bg-[#7A0000] hover:bg-[#A52A2A] rounded text-sm text-white"
          >
            Back to Form
          </button>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">
        Bill Cycle: {getBillCycleDisplay()} - {formData.timePeriod}
      </p>
      <p className="text-sm text-gray-600 mb-4">
        Area: {getAreaDisplay()}
      </p>
      
      {reportLoading && (
        <div className="text-center py-8 text-[#7A0000] text-sm animate-pulse">
          Loading report data...
        </div>
      )}
      
      {reportError && (
        <div className="mt-6 text-red-600 bg-red-100 border border-red-300 p-4 rounded text-sm">
          <strong>Error:</strong> {reportError}
        </div>
      )}
      
      {!reportLoading && !reportError && debtors.length > 0 && (
        <AgeAnalysisTable
          debtors={debtors}
          formData={formData}
          areas={areas}
          billCycleOptions={billCycleOptions}
          reportLoading={reportLoading}
          reportError={reportError}
        />
      )}
    </div>
  );
};

export default AgeAnalysisReport; 