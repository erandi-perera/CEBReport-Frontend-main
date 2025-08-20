import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DebtorsModal from "../../components/mainTopics/AnalysisDebtors/DebtorsModal";

interface Area {
  AreaCode: string;
  AreaName: string;
  ErrorMessage?: string | null;
}


interface BillCycleOption {
  display: string;
  code: string;
}

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
    '#1E3A8A', '#10B981', '#F59E0B', '#6366F1',
    '#3B82F6', '#6B7280', '#9CA3AF', '#D97706'
  ];

  // Region codes constant
  const regionCodes = [
    { code: "R1", name: "Region 01" },
    { code: "R2", name: "Region 02" },
    { code: "R3", name: "Region 03" },
    { code: "R4", name: "Region 04" }
  ];

  // Province codes constant
  const provinceCodes = [
    { code: "1", name: "Western Province North" },
    { code: "2", name: "Western Province South" },
    { code: "3", name: "Colombo City" },
    { code: "4", name: "Northern Province" },
    { code: "5", name: "Central Province" },
    { code: "6", name: "Uva Province" },
    { code: "7", name: "Eastern Province" },
    { code: "8", name: "North Western Province" },
    { code: "9", name: "Sabaragamuwa Province" },
    { code: "A", name: "North Central Province" },
    { code: "B", name: "Southern Province" },
    { code: "C", name: "Western Province South 2" },
    { code: "D", name: "North Western Province 2" },
    { code: "E", name: "Central Province 2" },
    { code: "F", name: "Southern Province 2" }
  ];

  // Main state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({
    ordinary: [] as DebtorSummary[],
    bulk: [] as DebtorSummary[]
  });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    option: "A",
    cycle: "",
    areaCode: "",
    showOrdinary: true,
    showBulk: true
  });
  const [areas, setAreas] = useState<Area[]>([]);
  const [billCycleOptions, setBillCycleOptions] = useState<BillCycleOption[]>([]);
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const generateBillCycleOptions = (billCycles: string[], maxCycle: string): BillCycleOption[] => {
    const maxCycleNum = parseInt(maxCycle);
    return billCycles.map((cycle, index) => ({
      display: cycle,
      code: (maxCycleNum - index).toString()
    }));
  };

  const fetchWithErrorHandling = async (url: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
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

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        // Fetch areas
        const areaData = await fetchWithErrorHandling("/misapi/api/areas");
        setAreas(areaData.data || []);
        if (areaData.data?.length > 0) {
          setFormData(prev => ({ ...prev, areaCode: areaData.data[0].AreaCode }));
        }

        // Fetch bill cycles using the same method as AgeAnalysis
        const maxCycleData = await fetchWithErrorHandling("/misapi/api/billcycle/max");
        if (maxCycleData.data && maxCycleData.data.BillCycles?.length > 0) {
          const options = generateBillCycleOptions(
            maxCycleData.data.BillCycles,
            maxCycleData.data.MaxBillCycle
          );
          setBillCycleOptions(options);
          setFormData(prev => ({ ...prev, cycle: options[0].code }));
        } else {
          setBillCycleOptions([]);
          setFormData(prev => ({ ...prev, cycle: "" }));
        }
      } catch (err: any) {
        setError("Error loading data: " + (err.message || err.toString()));
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const getCodeLabel = () => {
    const labels = { P: "Province Code", D: "Region Code", A: "Area Code" };
    return labels[formData.option as keyof typeof labels] || "Area Code";
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    // If option changes, reset areaCode to appropriate default
    if (name === 'option') {
      let defaultAreaCode = "";
      if (value === "D") {
        defaultAreaCode = "R1"; // Default to first region
      } else if (value === "P") {
        defaultAreaCode = "1"; // Default to first province
      } else if (value === "A" && areas.length > 0) {
        defaultAreaCode = areas[0].AreaCode;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        areaCode: defaultAreaCode
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return "0.00";
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return value < 0 ? `(${formatted})` : formatted;
  };

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

  const fetchDebtorsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { option, cycle, areaCode, showOrdinary, showBulk } = formData;
      if (!cycle) throw new Error("Please select a Bill Cycle");
      
      if (!showOrdinary && !showBulk) {
        throw new Error("Please select at least one debtor type");
      }

      const results = {
        ordinary: [] as DebtorSummary[],
        bulk: [] as DebtorSummary[]
      };

      if (showOrdinary) {
        let ordinaryUrl = `/misapi/api/debtors/summary?opt=${option}&cycle=${cycle}`;
        if (option !== "E" && !areaCode) throw new Error(`Please select an ${getCodeLabel()}`);
        if (option !== "E") ordinaryUrl += `&areaCode=${areaCode}`;

        const ordinaryResponse = await fetch(ordinaryUrl);
        if (!ordinaryResponse.ok) throw new Error(`HTTP error! status: ${ordinaryResponse.status}`);
        const ordinaryResult = await ordinaryResponse.json();
        if (ordinaryResult.ErrorMessage) throw new Error(ordinaryResult.ErrorMessage);
        
        results.ordinary = Array.isArray(ordinaryResult) ? ordinaryResult : ordinaryResult.data || [];
      }

      if (showBulk) {
        let bulkUrl = `/misapi/api/debtorsbulk/summary?opt=${option}&cycle=${cycle}`;
        if (option !== "E" && !areaCode) throw new Error(`Please select an ${getCodeLabel()}`);
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
    return barData.sort((a, b) => 
      a.isGovernment === b.isGovernment ? 0 : a.isGovernment ? -1 : 1
    );
  };

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

  // Function to render the appropriate dropdown based on selected option
  const renderCodeDropdown = () => {
    if (formData.option === "E") return null;

    if (formData.option === "D") {
      // Region Code dropdown
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Region Code
          </label>
          <select
            name="areaCode"
            value={formData.areaCode}
            onChange={handleInputChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
            style={{ maxHeight: '200px', fontSize: '12px' }}
            required
          >
            {regionCodes.map(region => (
              <option key={region.code} value={region.code} className="text-xs py-1">
                {region.name} ({region.code})
              </option>
            ))}
          </select>
        </div>
      );
    } else if (formData.option === "P") {
      // Province Code dropdown
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Province Code
          </label>
          <select
            name="areaCode"
            value={formData.areaCode}
            onChange={handleInputChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
            style={{ maxHeight: '200px', fontSize: '12px' }}
            required
          >
            {provinceCodes.map(province => (
              <option key={province.code} value={province.code} className="text-xs py-1">
                {province.name} ({province.code})
              </option>
            ))}
          </select>
        </div>
      );
    } else {
      // Area Code dropdown (for Area option only)
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {getCodeLabel()}
          </label>
          <select
            name="areaCode"
            value={formData.areaCode}
            onChange={handleInputChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
            style={{ maxHeight: '200px', fontSize: '12px' }}
            required
          >
            {areas.map(area => (
              <option key={area.AreaCode} value={area.AreaCode} className="text-xs py-1">
                {area.AreaName} ({area.AreaCode})
              </option>
            ))}
          </select>
        </div>
      );
    }
  };

  // Loading state for initial data
  if (initialLoading) {
    return (
      <div className={`text-center py-8 ${maroon} text-sm animate-pulse font-sans`}>
        Loading initial data...
      </div>
    );
  }

  // Error state for initial data
  if (error && !showModal) {
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
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
      {/* Form Section */}
      <div className="mb-8">
        <h2 className={`text-xl font-bold mb-4 ${maroon}`}>Debtors Analysis</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Analysis Option</label>
              <select
                name="option"
                value={formData.option}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
                style={{ maxHeight: '200px', fontSize: '12px' }}
              >
                <option value="A">Area</option>
                <option value="D">Region</option>
                <option value="P">Province</option>
                <option value="E">All CEB</option>
              </select>
            </div>

            {/* Bill Cycle Dropdown - Fixed */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bill Cycle</label>
              <select
                name="cycle"
                value={formData.cycle}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
                style={{ maxHeight: '200px', fontSize: '12px' }}
                required
              >
                {billCycleOptions.map(option => (
                  <option key={option.code} value={option.code} className="text-xs py-1">
                    {option.display} - {option.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Code Dropdown */}
            {renderCodeDropdown()}

            {/* Debtor Type Checkboxes */}
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="showOrdinary"
                  checked={formData.showOrdinary}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-[#7A0000] focus:ring-[#7A0000] w-3 h-3"
                />
                <span className="ml-2 text-xs text-gray-700">Show Ordinary Debtors</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="showBulk"
                  checked={formData.showBulk}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-[#7A0000] focus:ring-[#7A0000] w-3 h-3"
                />
                <span className="ml-2 text-xs text-gray-700">Show Bulk Debtors</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7A0000]"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !formData.cycle || (formData.option !== "E" && !formData.areaCode)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium text-white ${maroonGrad} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7A0000] disabled:opacity-50`}
            >
              {loading ? "Processing..." : "Generate Report"}
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && showModal && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
          {error}
        </div>
      )}

      {/* Modal Section */}
      <div ref={printRef}>
        <DebtorsModal
          showModal={showModal}
          setShowModal={setShowModal}
          data={data}
          formData={formData}
          error={error}
          loading={loading}
          columns={[
            { label: "Customer Type", accessor: "CustType", className: "text-left w-[20%]" },
            { label: "Total Debtors (LKR)", accessor: "TotDebtors", className: "text-right w-[16%]", format: formatCurrency },
            { label: "01 Month (LKR)", accessor: "Month01", className: "text-right w-[16%]", format: formatCurrency },
            { label: "02 Months (LKR)", accessor: "Month02", className: "text-right w-[16%]", format: formatCurrency },
            { label: "03 Months (LKR)", accessor: "Month03", className: "text-right w-[16%]", format: formatCurrency },
            { label: "04 Months (LKR)", accessor: "Month04", className: "text-right w-[16%]", format: formatCurrency },
          ]}
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