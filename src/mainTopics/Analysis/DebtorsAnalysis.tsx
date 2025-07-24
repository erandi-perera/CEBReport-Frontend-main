import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DebtorsForm from "../../components/mainTopics/AnalysisDebtors/DebtorsForm";
import DebtorsModal from "../../components/mainTopics/AnalysisDebtors/DebtorsModal";

interface DebtorSummary {
  Type: string;
  CustType: string;
  TotDebtors: number;
  Month01: number;
  Month02: number;
  Month03: number;
  Month04: number;
  ErrorMessage: string | null;
}

const DebtorsAnalysis: React.FC = () => {
  // Colors
  const maroon = "text-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";
  const chartColors = [
  '#1E3A8A', // Navy Blue for Month 1 (Bar & Pie)
  '#10B981', // Emerald Green for Month 2 (Bar & Pie)
  '#F59E0B', // Amber for Month 3 (Bar & Pie)
  '#6366F1', // Indigo for Month 4 (Bar & Pie)
  '#3B82F6', // Sky Blue for Pie
  '#6B7280', // Gray for Pie
  '#9CA3AF', // Light Gray for Pie
  '#D97706'  // Orange for Pie
];


  // Main state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    ordinary: DebtorSummary[];
    bulk: DebtorSummary[];
  }>({ ordinary: [], bulk: [] });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    option: "A",
    cycle: "",
    areaCode: "",
    showOrdinary: true,
    showBulk: true
  });
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const getCodeLabel = () => {
    const labels = { P: "Province Code", D: "Region Code", A: "Area Code" };
    return labels[formData.option as keyof typeof labels] || "Area Code";
  };

  const getCodePlaceholder = () => {
    const placeholders = { P: "e.g. 1", D: "e.g. R1", A: "e.g. 57" };
    return placeholders[formData.option as keyof typeof placeholders] || "e.g. 57";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined) return "0.00";
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return value < 0 ? `(${formatted})` : formatted;
  };

  // Calculate totals for a given data array
  const calculateTotals = (data: DebtorSummary[]) => {
    return data.reduce((acc, row) => {
      acc.TotDebtors = (acc.TotDebtors || 0) + (row.TotDebtors || 0);
      acc.Month01 = (acc.Month01 || 0) + (row.Month01 || 0);
      acc.Month02 = (acc.Month02 || 0) + (row.Month02 || 0);
      acc.Month03 = (acc.Month03 || 0) + (row.Month03 || 0);
      acc.Month04 = (acc.Month04 || 0) + (row.Month04 || 0);
      return acc;
    }, {
      Type: "Total",
      CustType: "",
      TotDebtors: 0,
      Month01: 0,
      Month02: 0,
      Month03: 0,
      Month04: 0,
      ErrorMessage: null
    });
  };

  // Data fetching
  const fetchDebtorsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { option, cycle, areaCode, showOrdinary, showBulk } = formData;
      if (!cycle) throw new Error("Please enter Cycle Number");
      
      if (!showOrdinary && !showBulk) {
        throw new Error("Please select at least one debtor type");
      }

      const results = {
        ordinary: [] as DebtorSummary[],
        bulk: [] as DebtorSummary[]
      };

      if (showOrdinary) {
        let ordinaryUrl = `/misapi/api/debtors/summary?opt=${option}&cycle=${cycle}`;
        if (option !== "E" && !areaCode) throw new Error(`Please enter ${getCodeLabel()}`);
        if (option !== "E") ordinaryUrl += `&areaCode=${areaCode}`;

        const ordinaryResponse = await fetch(ordinaryUrl);
        if (!ordinaryResponse.ok) throw new Error(`HTTP error! status: ${ordinaryResponse.status}`);
        const ordinaryResult = await ordinaryResponse.json();
        if (ordinaryResult.ErrorMessage) throw new Error(ordinaryResult.ErrorMessage);
        
        results.ordinary = Array.isArray(ordinaryResult) ? ordinaryResult : ordinaryResult.data || [];
      }

      if (showBulk) {
        let bulkUrl = `/misapi/api/debtorsbulk/summary?opt=${option}&cycle=${cycle}`;
        if (option !== "E" && !areaCode) throw new Error(`Please enter ${getCodeLabel()}`);
        if (option !== "E") bulkUrl += `&areaCode=${areaCode}`;

        const bulkResponse = await fetch(bulkUrl);
        if (!bulkResponse.ok) throw new Error(`HTTP error! status: ${bulkResponse.status}`);
        const bulkResult = await bulkResponse.json();
        if (bulkResult.ErrorMessage) throw new Error(bulkResult.ErrorMessage);
        
        results.bulk = Array.isArray(bulkResult) ? bulkResult : bulkResult.data || [];
      }

      setData(results);
      setShowModal(true);
    } catch (err: any) {
      setError(err.message || "Failed to fetch debtors data");
      setData({ ordinary: [], bulk: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDebtorsData();
  };

  // Table configuration
 const columns = [
  { label: "Customer Type", accessor: "CustType", className: "text-left w-[20%]" },
  { label: "Total Debtors (LKR)", accessor: "TotDebtors", className: "text-right w-[16%]", format: formatCurrency },
  { label: "01 Month  (LKR)", accessor: "Month01", className: "text-right w-[16%]", format: formatCurrency },
  { label: "02 Months (LKR)", accessor: "Month02", className: "text-right w-[16%]", format: formatCurrency },
  { label: "03 Months (LKR)", accessor: "Month03", className: "text-right w-[16%]", format: formatCurrency },
  { label: "04 Months  (LKR)", accessor: "Month04", className: "text-right w-[16%]", format: formatCurrency },
];

  // Chart preparation functions
  const preparePieChartData = (data: DebtorSummary[]) => {
    return data.map(item => ({
      name: item.CustType,
      value: Math.abs(item.TotDebtors || 0)
    }));
  };

  const prepareBarChartData = (data: DebtorSummary[]) => {
    const barData = data.map(item => ({
      name: item.CustType,
      'Month 01': Math.abs(item.Month01 || 0),
      'Month 02': Math.abs(item.Month02 || 0),
      'Month 03': Math.abs(item.Month03 || 0),
      'Month 04': Math.abs(item.Month04 || 0),
      isGovernment: item.CustType.toLowerCase().includes('government')
    }));
    // Sort government items first
    return barData.sort((a, b) => 
      a.isGovernment === b.isGovernment ? 0 : a.isGovernment ? -1 : 1
    );
  };

  // Export functions
  const downloadAsCSV = () => {
    const combinedData = [...(formData.showOrdinary ? data.ordinary : []), ...(formData.showBulk ? data.bulk : [])];
    if (!combinedData.length) return;
    
    const headers = ["Type", "Customer Type", "Total Debtors (LKR)", "Month 01 (LKR)", "Month 02 (LKR)", "Month 03 (LKR)", "Month 04 (LKR)"];
    const rows = combinedData.map(row => [
      row.Type,
      row.CustType,
      row.TotDebtors ?? 0,
      row.Month01 ?? 0,
      row.Month02 ?? 0,
      row.Month03 ?? 0,
      row.Month04 ?? 0
    ]);
    
    // Add totals row
    if (formData.showOrdinary && data.ordinary.length > 0) {
      const ordinaryTotal = calculateTotals(data.ordinary);
      rows.push(["Ordinary Total", "", ordinaryTotal.TotDebtors, ordinaryTotal.Month01, ordinaryTotal.Month02, ordinaryTotal.Month03, ordinaryTotal.Month04]);
    }
    
    if (formData.showBulk && data.bulk.length > 0) {
      const bulkTotal = calculateTotals(data.bulk);
      rows.push(["Bulk Total", "", bulkTotal.TotDebtors, bulkTotal.Month01, bulkTotal.Month02, bulkTotal.Month03, bulkTotal.Month04]);
    }
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DebtorsAnalysis_${formData.option}_Cycle${formData.cycle}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Debtors Summary</title>
          <style>
            body { font-family: Arial; font-size: 10px; margin: 10mm; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 4px; border: 1px solid #ddd; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .header { font-weight: bold; margin-bottom: 5px; }
            .subheader { margin-bottom: 10px; }
            .footer { margin-top: 10px; font-size: 9px; }
            .total-row { font-weight: bold; background-color: #f5f5f5; }
            th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
            .chart-container { width: 100%; margin: 20px 0; }
            .chart-title { font-weight: bold; text-align: center; margin-bottom: 10px; }
            .chart-divider { border-left: 1px solid #ddd; margin: 0 20px; }
          </style>
        </head>
        <body>
          <div class="header">DEBTORS SUMMARY - ${formData.option} (Cycle: ${formData.cycle})</div>
          ${formData.areaCode ? `<div class="subheader">${getCodeLabel()}: ${formData.areaCode}</div>` : ''}
          ${printRef.current.innerHTML}
          <div class="footer">Generated on: ${new Date().toLocaleDateString()} | CEB@2025</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
      <DebtorsForm
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        loading={loading}
        maroon={maroon}
        maroonGrad={maroonGrad}
        navigate={navigate}
        getCodeLabel={getCodeLabel}
        getCodePlaceholder={getCodePlaceholder}
      />
      {error && <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-xs">{error}</div>}
      <div ref={printRef}>
        <DebtorsModal
          showModal={showModal}
          setShowModal={setShowModal}
          data={data}
          formData={formData}
          error={error}
          loading={loading}
          columns={columns}
          formatCurrency={formatCurrency}
          calculateTotals={calculateTotals}
          preparePieChartData={preparePieChartData}
          prepareBarChartData={prepareBarChartData}
          downloadAsCSV={downloadAsCSV}
          printPDF={printPDF}
          chartColors={chartColors}
        />
      </div>
    </div>
  );
};

export default DebtorsAnalysis;