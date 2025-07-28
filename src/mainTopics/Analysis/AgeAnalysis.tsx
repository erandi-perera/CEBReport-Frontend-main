import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Interfaces
interface Area {
  AreaCode: string;
  AreaName: string;
  ErrorMessage?: string | null;
}


interface BillCycleOption {
  display: string;
  code: string;
}

interface CustomerTypeOption {
  display: string;
  value: string;
}

interface Debtor {
  AreaName: string;
  AccountNumber: string;
  TariffCode: string;
  OutstandingBalance: number;
  FirstName: string;
  LastName: string;
  Address1: string;
  Address2: string;
  Address3: string;
  Month0: number;
  Month1: number;
  Month2: number;
  Month3: number;
  Month4: number;
  Month5: number;
  Month6: number;
  Months7_9: number;
  Months10_12: number;
  Months13_24: number;
  Months25_36: number;
  Months37_48: number;
  Months49_60: number;
  Months61Plus: number;
  ErrorMessage: string | null;
}

interface ApiResponse<T> {
  data: T;
  errorMessage: string | null;
}

const AgeAnalysis: React.FC = () => {
  // Colors and styling
  const maroon = "text-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";
  const chartColors = [
    '#1E3A8A', '#10B981', '#F59E0B', '#6366F1', 
    '#3B82F6', '#6B7280', '#9CA3AF', '#D97706'
  ];

  // Hooks
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [areas, setAreas] = useState<Area[]>([]);
  const [billCycleOptions, setBillCycleOptions] = useState<BillCycleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Constants
  const timePeriods = [
    { value: "0-6", label: "0 - 6 Months" },
    { value: "7-12", label: "7 - 12 Months" },
    { value: "1-2", label: "1 - 2 Years" },
    { value: "2-3", label: "2 - 3 Years" },
    { value: "3-4", label: "3 - 4 Years" },
    { value: "4-5", label: "4 - 5 Years" },
    { value: ">5", label: "above 5 Years" },
    { value: "All", label: "All" },
  ];

  const customerTypeOptions: CustomerTypeOption[] = [
    { display: "Active", value: "A" },
    { display: "Government", value: "G" },
    { display: "Finalized", value: "F" },
  ];

  const [formData, setFormData] = useState({
    custType: "A",
    billCycle: "",
    areaCode: "",
    timePeriod: "All"
  });

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

  // Effects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch areas
        const areaData = await fetchWithErrorHandling("/debtorsage/api/areas");
        setAreas(areaData.data || []);
        if (areaData.data?.length > 0) {
          setFormData(prev => ({ ...prev, areaCode: areaData.data[0].AreaCode }));
        }

        // Fetch bill cycles
        const maxCycleData = await fetchWithErrorHandling("/debtorsage/api/billcycle/max");
        if (maxCycleData.data && maxCycleData.data.BillCycles?.length > 0) {
          const options = generateBillCycleOptions(
            maxCycleData.data.BillCycles,
            maxCycleData.data.MaxBillCycle
          );
          setBillCycleOptions(options);
          setFormData(prev => ({ ...prev, billCycle: options[0].code }));
        } else {
          setBillCycleOptions([]);
          setFormData(prev => ({ ...prev, billCycle: "" }));
        }
      } catch (err: any) {
        setError("Error loading data: " + (err.message || err.toString()));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Event handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.areaCode || !formData.billCycle || !formData.custType) return;

    setReportLoading(true);
    setReportError(null);
    setDebtors([]);
    
    try {
      let ageRange = "";
      switch (formData.timePeriod) {
        case "0-6": ageRange = "Months0_6"; break;
        case "7-12": ageRange = "Months7_12"; break;
        case "1-2": ageRange = "Years1_2"; break;
        case "2-3": ageRange = "Years2_3"; break;
        case "3-4": ageRange = "Years3_4"; break;
        case "4-5": ageRange = "Years4_5"; break;
        case ">5": ageRange = "Years5Plus"; break;
        case "All": ageRange = "All"; break;
        default: ageRange = "All";
      }

      const url = `/debtorsage/api/debtors?custType=${formData.custType}&billCycle=${formData.billCycle}&areaCode=${formData.areaCode}&ageRange=${ageRange}`;
      const data = await fetchWithErrorHandling(url);
      if (data.errorMessage) {
        throw new Error(data.errorMessage);
      }
      const resultData = data.data || [];
      if (!Array.isArray(resultData)) {
        if (resultData.ErrorMessage) {
          throw new Error(resultData.ErrorMessage);
        }
        setDebtors([resultData]);
      } else {
        setDebtors(resultData);
      }
      setShowReport(true);
      // Scroll to report after a small delay to allow rendering
      setTimeout(() => {
        if (reportContainerRef.current) {
          reportContainerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      setReportError("Error fetching report: " + (err.message || err.toString()));
    } finally {
      setReportLoading(false);
    }
  };

 const downloadAsCSV = () => {
  if (!debtors.length) return;
  
  // Create headers based on the selected time period
  let headers = [
    "Account Number", 
    "Name", 
    "Address", 
    "Tariff Code", 
    "Outstanding Balance"
  ];

  // Add columns based on the selected time period
  if (formData.timePeriod === "0-6") {
    headers.push(
      "Month 0",
      "Month 1",
      "Month 2",
      "Month 3",
      "Month 4",
      "Month 5",
      "Month 6"
    );
  } else if (formData.timePeriod === "7-12") {
    headers.push(
      "Months 7-9",
      "Months 10-12"
    );
  } else if (formData.timePeriod === "1-2") {
    headers.push("1-2 Years");
  } else if (formData.timePeriod === "2-3") {
    headers.push("2-3 Years");
  } else if (formData.timePeriod === "3-4") {
    headers.push("3-4 Years");
  } else if (formData.timePeriod === "4-5") {
    headers.push("4-5 Years");
  } else if (formData.timePeriod === ">5") {
    headers.push("5+ Years");
  } else if (formData.timePeriod === "All") {
    headers.push(
      "0-6 Months",
      "7-12 Months",
      "1-2 Years",
      "2-3 Years",
      "3-4 Years",
      "4-5 Years",
      "5+ Years"
    );
  }

  // Create rows with proper formatting
  const rows = debtors.map(debtor => {
    const row = [
      debtor.AccountNumber,
      `${debtor.FirstName} ${debtor.LastName}`.trim(),
      [debtor.Address1, debtor.Address2, debtor.Address3]
        .filter(part => part && part.trim() !== '')
        .join(', '),
      debtor.TariffCode,
      formatCurrency(debtor.OutstandingBalance)
    ];

    // Add values based on the selected time period
    if (formData.timePeriod === "0-6") {
      row.push(
        formatCurrency(debtor.Month0),
        formatCurrency(debtor.Month1),
        formatCurrency(debtor.Month2),
        formatCurrency(debtor.Month3),
        formatCurrency(debtor.Month4),
        formatCurrency(debtor.Month5),
        formatCurrency(debtor.Month6)
      );
    } else if (formData.timePeriod === "7-12") {
      row.push(
        formatCurrency(debtor.Months7_9),
        formatCurrency(debtor.Months10_12)
      );
    } else if (formData.timePeriod === "1-2") {
      row.push(formatCurrency(debtor.Months13_24));
    } else if (formData.timePeriod === "2-3") {
      row.push(formatCurrency(debtor.Months25_36));
    } else if (formData.timePeriod === "3-4") {
      row.push(formatCurrency(debtor.Months37_48));
    } else if (formData.timePeriod === "4-5") {
      row.push(formatCurrency(debtor.Months49_60));
    } else if (formData.timePeriod === ">5") {
      row.push(formatCurrency(debtor.Months61Plus));
    } else if (formData.timePeriod === "All") {
      row.push(
        formatCurrency(debtor.Month0 + debtor.Month1 + debtor.Month2 + 
                      debtor.Month3 + debtor.Month4 + debtor.Month5 + debtor.Month6),
        formatCurrency(debtor.Months7_9 + debtor.Months10_12),
        formatCurrency(debtor.Months13_24),
        formatCurrency(debtor.Months25_36),
        formatCurrency(debtor.Months37_48),
        formatCurrency(debtor.Months49_60),
        formatCurrency(debtor.Months61Plus)
      );
    }

    return row;
  });

  // Add a totals row
  if (debtors.length > 1) {
    const totals = [
      "", "", "", "", "TOTAL:",
      ...headers.slice(5).map((_, i) => {
        const colIndex = i + 5;
        return formatCurrency(
          debtors.reduce((sum, debtor) => {
            if (formData.timePeriod === "0-6") {
              const months = [debtor.Month0, debtor.Month1, debtor.Month2, 
                             debtor.Month3, debtor.Month4, debtor.Month5, debtor.Month6];
              return sum + (colIndex < 12 ? months[colIndex - 5] : 0);
            } else if (formData.timePeriod === "7-12") {
              const periods = [debtor.Months7_9, debtor.Months10_12];
              return sum + (colIndex < 7 ? periods[colIndex - 5] : 0);
            } else if (formData.timePeriod === "1-2") {
              return sum + debtor.Months13_24;
            } else if (formData.timePeriod === "2-3") {
              return sum + debtor.Months25_36;
            } else if (formData.timePeriod === "3-4") {
              return sum + debtor.Months37_48;
            } else if (formData.timePeriod === "4-5") {
              return sum + debtor.Months49_60;
            } else if (formData.timePeriod === ">5") {
              return sum + debtor.Months61Plus;
            } else if (formData.timePeriod === "All") {
              const values = [
                debtor.Month0 + debtor.Month1 + debtor.Month2 + 
                debtor.Month3 + debtor.Month4 + debtor.Month5 + debtor.Month6,
                debtor.Months7_9 + debtor.Months10_12,
                debtor.Months13_24,
                debtor.Months25_36,
                debtor.Months37_48,
                debtor.Months49_60,
                debtor.Months61Plus
              ];
              return sum + (colIndex < 12 ? values[colIndex - 5] : 0);
            }
            return sum;
          }, 0)
        );
      })
    ];
    rows.push(totals);
  }

  // Create CSV content with proper formatting
  let csvContent = [
    `"Age Analysis Report - ${customerTypeOptions.find(t => t.value === formData.custType)?.display} Customers"`,
    `"Bill Cycle: ${billCycleOptions.find(b => b.code === formData.billCycle)?.display} - ${formData.timePeriod}"`,
    `"Area: ${areas.find(a => a.AreaCode === formData.areaCode)?.AreaName} (${formData.areaCode})"`,
    "",
    headers.map(h => `"${h}"`).join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `AgeAnalysis_${formData.custType}_Cycle${formData.billCycle}_Area${formData.areaCode}_${new Date().toISOString().slice(0, 10)}.csv`;
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
          <title>Age Analysis Report</title>
          <style>
            body { font-family: Arial; font-size: 10px; margin: 10mm; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 4px; border: 1px solid #ddd; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .header { font-weight: bold; margin-bottom: 5px; color: #7A0000; }
            .subheader { margin-bottom: 10px; }
            .footer { margin-top: 10px; font-size: 9px; }
            .total-row { font-weight: bold; background-color: #f5f5f5; }
            th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">AGE ANALYSIS REPORT - ${customerTypeOptions.find(t => t.value === formData.custType)?.display} (Cycle: ${formData.billCycle})</div>
          <div class="subheader">Area: ${areas.find(a => a.AreaCode === formData.areaCode)?.AreaName} (${formData.areaCode})</div>
          <div class="subheader">Time Period: ${timePeriods.find(t => t.value === formData.timePeriod)?.label}</div>
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
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return value < 0 ? `(${formatted})` : formatted;
  };

  const getFullName = (debtor: Debtor): string => {
    return `${debtor.FirstName} ${debtor.LastName}`.trim();
  };

  const getFullAddress = (debtor: Debtor): string => {
    return [debtor.Address1, debtor.Address2, debtor.Address3]
      .filter(part => part && part.trim() !== '')
      .join(', ');
  };

  const handleBack = () => {
    setShowReport(false);
    setDebtors([]);
    setReportError(null);
  };

  const renderForm = () => (
    <>
      <h2 className={`text-xl font-bold mb-6 ${maroon}`}>Age Analysis</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Type Dropdown */}
          <div className="flex flex-col">
            <label className={`${maroon} text-xs font-medium mb-1`}>Select Customer Type:</label>
            <select
              name="custType"
              value={formData.custType}
              onChange={handleInputChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent mb-1"
            >
              {customerTypeOptions.map((type) => (
                <option key={type.value} value={type.value} className="text-xs py-1">
                  {type.display} - {type.value}
                </option>
              ))}
            </select>
          </div>

          {/* Bill Cycle Dropdown */}
          <div className="flex flex-col">
            <label className={`${maroon} text-xs font-medium mb-1`}>Select Bill Cycle:</label>
            <select
              name="billCycle"
              value={formData.billCycle}
              onChange={handleInputChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
              required
            >
              {billCycleOptions.map((option) => (
                <option key={option.code} value={option.code} className="text-xs py-1">
                  {option.display} - {option.code}
                </option>
              ))}
            </select>
          </div>

          {/* Area Dropdown */}
          <div className="flex flex-col">
            <label className={`${maroon} text-xs font-medium mb-1`}>Select Area:</label>
            <select
              name="areaCode"
              value={formData.areaCode}
              onChange={handleInputChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
              required
            >
              {areas.map((area) => (
                <option key={area.AreaCode} value={area.AreaCode} className="text-xs py-1">
                  {area.AreaName} ({area.AreaCode})
                </option>
              ))}
            </select>
          </div>

          {/* Time Period Dropdown */}
          <div className="flex flex-col">
            <label className={`${maroon} text-xs font-medium mb-1`}>Select Time Period:</label>
            <select
              name="timePeriod"
              value={formData.timePeriod}
              onChange={handleInputChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
              required
            >
              {timePeriods.map((period) => (
                <option key={period.value} value={period.value} className="text-xs py-1">
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* View Report Button */}
        <div className="w-full mt-6 flex justify-end">
          <button
            type="submit"
            disabled={reportLoading || !formData.areaCode || !formData.billCycle || !formData.custType}
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
            ) : "View Report"}
          </button>
        </div>
      </form>
    </>
  );

  const renderReportTable = () => {
    if (!debtors.length && !reportLoading && !reportError) return null;
    return (
      <div className="mt-8" ref={printRef}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-[#7A0000]">
            Debtors Age Analysis – {customerTypeOptions.find(t => t.value === formData.custType)?.display} Customers
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={downloadAsCSV}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              disabled={!debtors.length}
            >
              Export CSV
            </button>
            <button 
              onClick={printPDF}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              disabled={!debtors.length}
            >
              Print PDF
            </button>
            <button 
              onClick={handleBack}
              className="px-3 py-1 bg-[#7A0000] hover:bg-[#A52A2A] rounded text-sm text-white"
            >
              Back to Form
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Bill Cycle: {billCycleOptions.find(b => b.code === formData.billCycle)?.display} - {formData.timePeriod}
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Area: {areas.find(a => a.AreaCode === formData.areaCode)?.AreaName} ({formData.areaCode})
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Account Number</th>
                  <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Name</th>
                  <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Address</th>
                  <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Tariff</th>
                  <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Outstanding Balance</th>
                  {formData.timePeriod === "0-6" && (
                    <>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Month 1</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Month 2</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Month 3</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Month 4</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Month 5</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">Month 6</th>
                    </>
                  )}
                  {formData.timePeriod === "7-12" && (
                    <>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">7 Months</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">8 Months</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">9 Months</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">10 Months</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">11 Months</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">12 Months</th>
                    </>
                  )}
                  {formData.timePeriod === "1-2" && (
                    <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">1-2 Years</th>
                  )}
                  {formData.timePeriod === "2-3" && (
                    <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">2-3 Years</th>
                  )}
                  {formData.timePeriod === "3-4" && (
                    <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">3-4 Years</th>
                  )}
                  {formData.timePeriod === "4-5" && (
                    <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">4-5 Years</th>
                  )}
                  {formData.timePeriod === ">5" && (
                    <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">5+ Years</th>
                  )}
                  {formData.timePeriod === "All" && (
                    <>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">0-6 Months</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">7-12 Months</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">1-2 Years</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">2-3 Years</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">3-4 Years</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">4-5 Years</th>
                      <th className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100">5+ Years</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {debtors.map((debtor, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-2 py-1">{debtor.AccountNumber}</td>
                    <td className="border border-gray-300 px-2 py-1">{getFullName(debtor)}</td>
                    <td className="border border-gray-300 px-2 py-1">{getFullAddress(debtor)}</td>
                    <td className="border border-gray-300 px-2 py-1">{debtor.TariffCode}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.OutstandingBalance)}</td>
                    {formData.timePeriod === "0-6" && (
                      <>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Month0)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Month1)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Month2)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Month3)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Month4)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Month5)}</td>
                      </>
                    )}
                    {formData.timePeriod === "7-12" && (
                      <>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months7_9)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months7_9)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months7_9)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months10_12)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months10_12)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months10_12)}</td>
                      </>
                    )}
                    {formData.timePeriod === "1-2" && (
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months13_24)}</td>
                    )}
                    {formData.timePeriod === "2-3" && (
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months25_36)}</td>
                    )}
                    {formData.timePeriod === "3-4" && (
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months37_48)}</td>
                    )}
                    {formData.timePeriod === "4-5" && (
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months49_60)}</td>
                    )}
                    {formData.timePeriod === ">5" && (
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months61Plus)}</td>
                    )}
                    {formData.timePeriod === "All" && (
                      <>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {formatCurrency(debtor.Month0 + debtor.Month1 + debtor.Month2 + debtor.Month3 + debtor.Month4 + debtor.Month5 + debtor.Month6)}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {formatCurrency(debtor.Months7_9 + debtor.Months10_12)}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months13_24)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months25_36)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months37_48)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months49_60)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(debtor.Months61Plus)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Main render
  if (loading) {
    return (
      <div className={`text-center py-8 ${maroon} text-sm animate-pulse font-sans`}>
        Loading initial data...
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

export default AgeAnalysis;