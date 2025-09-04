import React, { useState, useEffect, useRef } from "react";

// Interfaces
interface BillCycleOption {
  display: string;
  code: string;
  isSynthetic?: boolean; // Flag to identify frontend-generated cycles
}




const TariffBlockWiseConsumption: React.FC = () => {
  // Colors and styling
  const maroon = "text-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  // Hooks
  const printRef = useRef<HTMLDivElement>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [billCycleOptions, setBillCycleOptions] = useState<BillCycleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Report type options
  const reportTypeOptions = [
    { value: "ordinary", label: "Ordinary", api: "/CEBINFO_API_2025/api/tariffBlockwiseOrdinaryData" },
    { value: "bulk", label: "Bulk", api: "/CEBINFO_API_2025/api/tariffBlockwiseBulkData" },
    { value: "ordinary-block", label: "Ordinary Tariff Block Wise Analysis", api: "/CEBINFO_API_2025/api/tariffBlockWiseData" }
  ];

  const [formData, setFormData] = useState({
    reportType: "ordinary",
    billCycle: ""
  });

  // Generate 60 months of bill cycles (24 from API + 36 synthetic)
  const generateBillCycleOptions = (billCycles: string[], maxCycle: string): BillCycleOption[] => {
    const maxCycleNum = parseInt(maxCycle);
    const apiCycles = billCycles.map((cycle, index) => ({
      display: cycle,
      code: (maxCycleNum - index).toString(),
      isSynthetic: false
    }));
    
    // Generate additional synthetic cycles if needed
    const totalCyclesNeeded = 60;
    const cyclesToGenerate = Math.max(0, totalCyclesNeeded - apiCycles.length);
    const syntheticCycles: BillCycleOption[] = [];
    
    if (cyclesToGenerate > 0) {
      const lastApiCycleNum = apiCycles.length > 0 ? parseInt(apiCycles[apiCycles.length - 1].code) : maxCycleNum;
      
      for (let i = 1; i <= cyclesToGenerate; i++) {
        const cycleNum = lastApiCycleNum - i;
        const date = new Date();
        date.setMonth(date.getMonth() - (apiCycles.length + i - 1));
        
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear().toString().slice(-2);
        const display = `${monthName}-${year}`;
        
        syntheticCycles.push({
          display,
          code: cycleNum.toString(),
          isSynthetic: true
        });
      }
    }
    
    return [...apiCycles, ...syntheticCycles];
  };

  const fetchWithErrorHandling = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.errorMessage) {
            errorMsg = errorData.errorMessage;
          }
        } catch (e) {
          errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  };

  // Effects
  useEffect(() => {
    const fetchBillCycles = async () => {
      setLoading(true);
      setError(null);
      try {
        const maxCycleData = await fetchWithErrorHandling("/misapi/api/billcycle/max");
        
        // Handle cases where API might return empty or incomplete data
        const apiCycles = maxCycleData.data?.BillCycles || [];
        const apiMaxCycle = maxCycleData.data?.MaxBillCycle || "0";
        
        // Generate 60 months of cycles (API + synthetic)
        const options = generateBillCycleOptions(apiCycles, apiMaxCycle);
        
        setBillCycleOptions(options);
        
        // Set initial bill cycle to the first option (API or synthetic)
        setFormData(prev => ({
          ...prev,
          billCycle: options[0]?.code || ""
        }));
      } catch (err: any) {
        setError("Error loading bill cycles: " + (err.message || err.toString()));
        
        // Fallback: Generate 60 synthetic cycles if API fails completely
        const date = new Date();
        const syntheticOptions = Array.from({ length: 60 }, (_, i) => {
          const cycleDate = new Date(date);
          cycleDate.setMonth(cycleDate.getMonth() - i);
          const monthName = cycleDate.toLocaleString('default', { month: 'short' });
          const year = cycleDate.getFullYear().toString().slice(-2);
          return {
            display: `${monthName}-${year}`,
            code: (60 - i).toString(),
            isSynthetic: true
          };
        });
        
        setBillCycleOptions(syntheticOptions);
        setFormData(prev => ({
          ...prev,
          billCycle: syntheticOptions[0]?.code || ""
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchBillCycles();
  }, []);

  // Event handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!formData.billCycle || !formData.reportType) return;

    setReportLoading(true);
    setReportError(null);
    setReportData([]);
    
    try {
      const selectedReport = reportTypeOptions.find(r => r.value === formData.reportType);
      if (!selectedReport) throw new Error("Invalid report type selected");

      let data;
      
      try {
        // First try POST request with body
        const postBody = {
          billCycle: formData.billCycle
        };
        
        console.log("Making API call to:", selectedReport.api, "with body:", postBody);
        
        data = await fetchWithErrorHandling(selectedReport.api, {
          method: 'POST',
          body: JSON.stringify(postBody)
        });
        
        console.log("API Response:", data);
      } catch (postError: any) {
        console.log("POST request failed, trying GET:", postError.message);
        
        // If POST fails, try GET with query parameters
        try {
          const url = `${selectedReport.api}?billCycle=${formData.billCycle}`;
          data = await fetchWithErrorHandling(url, { method: 'GET' });
        } catch (getError: any) {
          console.log("GET request failed, trying different parameter format:", getError.message);
          
          // Try alternative parameter formats
          try {
            const altUrl = `${selectedReport.api}/${formData.billCycle}`;
            data = await fetchWithErrorHandling(altUrl, { method: 'GET' });
          } catch (altError: any) {
            // Try POST without body
            try {
              const postUrl = `${selectedReport.api}?billCycle=${formData.billCycle}`;
              data = await fetchWithErrorHandling(postUrl, { method: 'POST' });
            } catch (finalError: any) {
              throw new Error(`All request methods failed. Last error: ${finalError.message}`);
            }
          }
        }
      }
      
      if (data.errorMessage) {
        throw new Error(data.errorMessage);
      }

      console.log("Full API Response for debugging:", JSON.stringify(data, null, 2));
      
      let resultData = [];
      if (formData.reportType === "ordinary") {
        resultData = data.data?.OrdList || data.OrdList || [];
      } else if (formData.reportType === "bulk") {
        resultData = data.data?.BulkList || data.BulkList || [];
      } else if (formData.reportType === "ordinary-block") {
        // FIXED: Added the specific key that your API is returning
        resultData = data.data?.OrdBlockwiseList || 
                    data.OrdBlockwiseList ||
                    data.data?.BlockList || 
                    data.BlockList || 
                    data.data?.OrdBlockList || 
                    data.OrdBlockList ||
                    data.data?.TariffBlockList || 
                    data.TariffBlockList ||
                    data.data?.tariffBlockList || 
                    data.tariffBlockList ||
                    data.data?.blockList ||
                    data.blockList ||
                    data.data?.list ||
                    data.list ||
                    data.data?.Data ||
                    data.Data ||
                    data.data?.results ||
                    data.results ||
                    [];
                    
        // If still empty, check if data itself is an array
        if (!resultData || resultData.length === 0) {
          if (Array.isArray(data.data)) {
            resultData = data.data;
          } else if (Array.isArray(data)) {
            resultData = data;
          }
        }
                    
        console.log("All possible data paths checked");
        console.log("data.data:", data.data);
        console.log("data:", data);
        console.log("Final extracted result data:", resultData);
        console.log("Result data length:", resultData?.length);
      }

      // Debug: Log the complete structure to understand the response
      if (formData.reportType === "ordinary-block") {
        console.log("=== DEBUGGING ORDINARY-BLOCK API RESPONSE ===");
        console.log("Complete response keys:", Object.keys(data));
        if (data.data) {
          console.log("data.data keys:", Object.keys(data.data));
          console.log("data.data type:", typeof data.data);
          console.log("data.data is array?:", Array.isArray(data.data));
        }
        console.log("Response structure:");
        console.log(JSON.stringify(data, null, 2));
      }

      // If resultData is not an array, wrap it in an array
      if (!Array.isArray(resultData)) {
        if (resultData && typeof resultData === 'object') {
          resultData = [resultData];
        } else {
          resultData = [];
        }
      }

      console.log("Final resultData before setState:", resultData);
      console.log("Final resultData length:", resultData.length);

      setReportData(resultData);
      setShowReport(true);
      
      // Scroll to report after a small delay
      setTimeout(() => {
        if (reportContainerRef.current) {
          reportContainerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      setReportError("Error fetching report: " + (err.message || err.toString()));
      console.error("Full error details:", err);
    } finally {
      setReportLoading(false);
    }
  };

  const downloadAsCSV = () => {
    if (!reportData.length) return;
    
    let headers: string[] = [];
    let filename = "";
    
    // Set headers based on report type and actual data structure
    if (formData.reportType === "ordinary") {
      // Check if the ordinary data has range field (meaning it's block-wise structure)
      if (reportData[0]?.range !== undefined) {
        headers = ["Tariff", "Range", "No of Accounts", "KWH Units", "KWH Charge", "Fixed Charge", "Tax", "FAC", "Payments"];
      } else {
        // Traditional ordinary structure
        headers = ["Tariff", "No of Accounts", "KWH Units", "KWH Charge", "Fuel Charge", "Tax Charge", "Fixed Charge", "Total Charge"];
      }
      filename = "Ordinary_Tariff_Report";
    } else if (formData.reportType === "bulk") {
      headers = ["Tariff", "No of Accounts", "KWO Units", "KWD Units", "KWP Units", "KWH Units", "KVA Units", 
                 "KWO Charge", "KWD Charge", "KWP Charge", "KWH Charge", "KVA Charge", "Fixed Charge", "Tax Charge", "FAC Charge", "Payments"];
      filename = "Bulk_Tariff_Report";
    } else if (formData.reportType === "ordinary-block") {
      // Always use block structure headers for ordinary-block
      headers = ["Tariff", "Range", "No of Accounts", "KWH Units", "KWH Charge", "Fixed Charge", "Tax", "FAC", "Payments"];
      filename = "Ordinary_Block_Tariff_Report";
    }

    // Create CSV content
    const csvContent = [
      `"${reportTypeOptions.find(r => r.value === formData.reportType)?.label} Report"`,
      `"Bill Cycle: ${billCycleOptions.find(b => b.code === formData.billCycle)?.display}"`,
      "",
      headers.map(h => `"${h}"`).join(","),
      ...reportData.map(row => {
        if (formData.reportType === "ordinary") {
          // Handle both traditional and block-wise ordinary data
          if (row.range !== undefined) {
            // Block-wise ordinary data
            return [
              row.tariff,
              row.range || "",
              row.noAccts,
              row.kwhUnits,
              formatCurrency(row.kwhCharge),
              formatCurrency(row.fixedCharge),
              formatCurrency(row.tax || row.taxCharge || 0),
              formatCurrency(row.fac || row.facCharge || 0),
              formatCurrency(row.payments)
            ].map(cell => `"${cell}"`).join(",");
          } else {
            // Traditional ordinary data
            return [
              row.tariff?.trim(),
              row.noAccts,
              row.kwhUnits,
              formatCurrency(row.kwhCharge),
              formatCurrency(row.fuelCharge),
              formatCurrency(row.taxCharge),
              formatCurrency(row.fixedCharge),
              formatCurrency(row.Charge)
            ].map(cell => `"${cell}"`).join(",");
          }
        } else if (formData.reportType === "bulk") {
          return [
            row.tariff,
            row.noAccts,
            row.kwoUnits,
            row.kwdUnits,
            row.kwpUnits,
            row.kwhUnits,
            row.kvaUnits,
            formatCurrency(row.kwoCharge),
            formatCurrency(row.kwdCharge),
            formatCurrency(row.kwpCharge),
            formatCurrency(row.kwhCharge),
            formatCurrency(row.kvaCharge),
            formatCurrency(row.fixedCharge),
            formatCurrency(row.taxCharge),
            formatCurrency(row.facCharge),
            formatCurrency(row.payments)
          ].map(cell => `"${cell}"`).join(",");
        } else if (formData.reportType === "ordinary-block") {
          // Always use block structure for ordinary-block
          return [
            row.tariff,
            row.range || "",
            row.noAccts,
            row.kwhUnits,
            formatCurrency(row.kwhCharge),
            formatCurrency(row.fixedCharge),
            formatCurrency(row.tax || row.taxCharge || 0),
            formatCurrency(row.fac || row.facCharge || 0),
            formatCurrency(row.payments)
          ].map(cell => `"${cell}"`).join(",");
        }
        return "";
      })
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_Cycle${formData.billCycle}_${new Date().toISOString().slice(0, 10)}.csv`;
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
          <title>${reportTypeOptions.find(r => r.value === formData.reportType)?.label} Report</title>
          <style>
            body { font-family: Arial; font-size: 10px; margin: 10mm; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 4px; border: 1px solid #ddd; }
            .text-right { text-align: right; }
            .header { font-weight: bold; margin-bottom: 5px; color: #7A0000; }
            .subheader { margin-bottom: 10px; }
            .footer { margin-top: 10px; font-size: 9px; }
            th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">${reportTypeOptions.find(r => r.value === formData.reportType)?.label.toUpperCase()} REPORT</div>
          <div class="subheader">Bill Cycle: ${billCycleOptions.find(b => b.code === formData.billCycle)?.display}</div>
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

  // UI helpers
  const formatCurrency = (value: number): string => {
    if (value === null || value === undefined) return "0.00";
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return value < 0 ? `(${formatted})` : formatted;
  };

  const handleClose = () => {
    setShowReport(false);
    setReportData([]);
    setReportError(null);
  };

  const renderForm = () => (
    <>
      <h2 className={`text-xl font-bold mb-6 ${maroon}`}>Tariff Block Wise Consumption</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tariff Type Radio Buttons */}
        <div className="flex flex-col">
          <label className={`${maroon} text-xs font-medium mb-2`}>Tariff Type</label>
          <div className="space-y-2">
            {reportTypeOptions.map((type) => (
              <label key={type.value} className="flex items-center text-xs">
                <input
                  type="radio"
                  name="reportType"
                  value={type.value}
                  checked={formData.reportType === type.value}
                  onChange={handleInputChange}
                  className="mr-2 text-[#7A0000] focus:ring-[#7A0000]"
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        {/* Bill Cycle Dropdown */}
        <div className="flex flex-col">
          <label className={`${maroon} text-xs font-medium mb-1`}>Bill Cycle</label>
          <select
            name="billCycle"
            value={formData.billCycle}
            onChange={handleInputChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
            required
          >
            {billCycleOptions.map((option) => (
              <option 
                key={option.code} 
                value={option.code} 
                className="text-xs py-1"
              >
                {option.display} - {option.code}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select a bill cycle to view report data
          </p>
        </div>
      </div>

      {/* Search Button */}
      <div className="w-full mt-6 flex justify-end">
        <button
          onClick={handleSearch}
          disabled={reportLoading || !formData.billCycle || !formData.reportType}
          className={`
            px-6 py-2 rounded-md font-medium transition-opacity duration-300 shadow
            ${maroonGrad} text-white
            ${reportLoading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}
          `}
        >
          {reportLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : "Search"}
        </button>
      </div>
    </>
  );

  const renderReportTable = () => {
    if (!reportData.length && !reportLoading && !reportError) return null;

    return (
      <div className="mt-8" ref={printRef}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-[#7A0000]">
            {reportTypeOptions.find(r => r.value === formData.reportType)?.label} Report
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={downloadAsCSV}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              disabled={!reportData.length}
            >
              Export CSV
            </button>
            <button 
              onClick={printPDF}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              disabled={!reportData.length}
            >
              Print PDF
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Bill Cycle: {billCycleOptions.find(b => b.code === formData.billCycle)?.display}
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

        {!reportLoading && !reportError && reportData.length > 0 && (
          <div className="overflow-x-auto">
            {/* Ordinary Report Table */}
            {formData.reportType === "ordinary" && (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">Tariff</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Range</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">No Accts</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWH Units</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWH Charge Rs.</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Fixed Charge</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Tax</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Fac</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-2 py-1">{row.tariff}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{row.range || ""}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{parseInt(row.noAccts || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{parseFloat(row.kwhUnits || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.kwhCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.fixedCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.tax || row.taxCharge || 0)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.fac || row.facCharge || 0)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.payments)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Bulk Report Table */}
            {formData.reportType === "bulk" && (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">Tariff</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">No Accts</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWO Units</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWD Units</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWP Units</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWH Units</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KVA Units</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWO Charge</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWD Charge</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWP Charge</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWH Charge</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KVA Charge</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Fixed Charge</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Tax Charge</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">FAC Charge</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-2 py-1">{row.tariff}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{parseInt(row.noAccts || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{parseFloat(row.kwoUnits || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{parseFloat(row.kwdUnits || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{parseFloat(row.kwpUnits || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{parseFloat(row.kwhUnits || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{parseFloat(row.kvaUnits || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.kwoCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.kwdCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.kwpCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.kwhCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.kvaCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.fixedCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.taxCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.facCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.payments)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Ordinary Block Report Table - Fixed to always show block structure */}
            {formData.reportType === "ordinary-block" && (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">Tariff</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Range</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">No Accts</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWH Units</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">KWH Charge Rs.</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Fixed Charge</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Tax</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">FAC</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-2 py-1">{row.tariff}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{row.range || ""}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{parseInt(row.noAccts || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{parseFloat(row.kwhUnits || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.kwhCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.fixedCharge)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.tax || row.taxCharge || 0)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.fac || row.facCharge || 0)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(row.payments)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Show No Data Message */}
        {!reportLoading && !reportError && reportData.length === 0 && showReport && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No data available for the selected bill cycle and report type.
          </div>
        )}

        {/* Close Button */}
        {showReport && (
          <div className="mt-6 flex justify-center">
            <button 
              onClick={handleClose}
              className="px-6 py-2 bg-[#7A0000] hover:bg-[#A52A2A] rounded text-white font-medium"
            >
              Close Report
            </button>
          </div>
        )}
      </div>
    );
  };

  // Main render
  if (loading) {
    return (
      <div className={`text-center py-8 ${maroon} text-sm animate-pulse font-sans`}>
        Loading bill cycle data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-100 border border-red-300 p-4 rounded text-sm">
        <strong>Error:</strong> {error}
        <button 
          onClick={() => setError(null)}
          className="float-right text-red-800 font-bold"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans`}>
      {/* Always render form (will be hidden when report is shown) */}
      <div className={showReport ? "hidden" : ""}>
        {renderForm()}
      </div>

      {/* Show any report errors even when form is visible */}
      {!showReport && reportError && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
          {reportError}
        </div>
      )}

      {/* Report container with scrollable content */}
      {showReport && (
        <div 
          ref={reportContainerRef}
          className="mt-4 border border-gray-300 rounded-lg overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
        >
          {renderReportTable()}
        </div>
      )}
    </div>
  );
};

export default TariffBlockWiseConsumption;