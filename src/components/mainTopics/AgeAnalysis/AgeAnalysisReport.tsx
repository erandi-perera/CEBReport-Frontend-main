import React, { useRef } from 'react';
import { Debtor, FormData, Area, BillCycleOption } from './types';
import { CUSTOMER_TYPE_OPTIONS } from './utils';
import AgeAnalysisTable from './AgeAnalysisTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

  const downloadAsPDF = () => {
    if (!debtors.length) return;

    const doc = new jsPDF();
    doc.text(`Debtors Age Analysis - ${getCustomerTypeDisplay()} Customers`, 14, 20);
    doc.text(`Bill Cycle: ${getBillCycleDisplay()} - ${formData.timePeriod}`, 14, 30);
    doc.text(`Area: ${getAreaDisplay()}`, 14, 40);

    // Define table columns based on time period
    let tableColumn: string[] = [
      "Account Number",
      "Name",
      "Address",
      "Tariff Code",
      "Outstanding Balance"
    ];

    // Add columns based on the selected time period
    if (formData.timePeriod === "0-6") {
      tableColumn.push(
        "Month 0",
        "Month 1",
        "Month 2",
        "Month 3",
        "Month 4",
        "Month 5",
        "Month 6"
      );
    } else if (formData.timePeriod === "7-12") {
      tableColumn.push("Months 7-9", "Months 10-12");
    } else if (formData.timePeriod === "1-2") {
      tableColumn.push("1-2 Years");
    } else if (formData.timePeriod === "2-3") {
      tableColumn.push("2-3 Years");
    } else if (formData.timePeriod === "3-4") {
      tableColumn.push("3-4 Years");
    } else if (formData.timePeriod === "4-5") {
      tableColumn.push("4-5 Years");
    } else if (formData.timePeriod === ">5") {
      tableColumn.push("5+ Years");
    } else if (formData.timePeriod === "All") {
      tableColumn.push(
        "0-6 Months",
        "7-12 Months",
        "1-2 Years",
        "2-3 Years",
        "3-4 Years",
        "4-5 Years",
        "5+ Years"
      );
    }

    const tableRows = debtors.map((debtor) => {
      const row = [
        debtor.AccountNumber,
        `${debtor.FirstName} ${debtor.LastName}`.trim(),
        [debtor.Address1, debtor.Address2, debtor.Address3].filter(a => a && a.trim()).join(', '),
        debtor.TariffCode,
        debtor.OutstandingBalance.toString()
      ];

      // Add values based on the selected time period
      if (formData.timePeriod === "0-6") {
        row.push(
          debtor.Month0.toString(),
          debtor.Month1.toString(),
          debtor.Month2.toString(),
          debtor.Month3.toString(),
          debtor.Month4.toString(),
          debtor.Month5.toString(),
          debtor.Month6.toString()
        );
      } else if (formData.timePeriod === "7-12") {
        row.push(debtor.Months7_9.toString(), debtor.Months10_12.toString());
      } else if (formData.timePeriod === "1-2") {
        row.push(debtor.Months13_24.toString());
      } else if (formData.timePeriod === "2-3") {
        row.push(debtor.Months25_36.toString());
      } else if (formData.timePeriod === "3-4") {
        row.push(debtor.Months37_48.toString());
      } else if (formData.timePeriod === "4-5") {
        row.push(debtor.Months49_60.toString());
      } else if (formData.timePeriod === ">5") {
        row.push(debtor.Months61Plus.toString());
      } else if (formData.timePeriod === "All") {
        row.push(
          debtor.Month0.toString(),
          (debtor.Month1 + debtor.Month2 + debtor.Month3 + debtor.Month4 + debtor.Month5 + debtor.Month6 + debtor.Months7_9 + debtor.Months10_12).toString(),
          debtor.Months13_24.toString(),
          debtor.Months25_36.toString(),
          debtor.Months37_48.toString(),
          debtor.Months49_60.toString(),
          debtor.Months61Plus.toString()
        );
      }

      return row;
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 6 },
      headStyles: { fillColor: [122, 0, 0] }, // Maroon color
    });

    doc.save(`Debtors_Age_Analysis_${getCustomerTypeDisplay()}_${formData.timePeriod}.pdf`);
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
            onClick={downloadAsPDF}
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