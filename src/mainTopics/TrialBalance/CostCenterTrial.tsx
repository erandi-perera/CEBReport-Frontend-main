import React, { useEffect, useState, useRef } from "react";
import { FaSearch, FaSyncAlt, FaEye, FaTimes, FaPrint, FaDownload } from "react-icons/fa";

interface CostCenter {
  compId: string;
  CompName: string;
}

interface Department {
  DeptId: string;
  DeptName: string;
}

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

const CostCenterTrial: React.FC<{ title?: string }> = ({ title = "Cost Center Details" }) => {
  // Main state
  const [data, setData] = useState<CostCenter[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filtered, setFiltered] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Department modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCompName, setSelectedCompName] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  // Trial balance modal state
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [trialData, setTrialData] = useState({
    costctr: "",
    year: new Date().getFullYear(),
    month: "January",
    deptName: ""
  });

  // Trial balance table state
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData[]>([]);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  // Print ref
  const printRef = useRef<HTMLDivElement>(null);

  // Colors
  const maroon = "text-[#7A0000]";
  const maroonBg = "bg-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  // Fetch cost centers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/misapi/api/trialbalance/companies/level/70");
        const txt = await res.text();
        const parsed = JSON.parse(txt);
        const rawData = Array.isArray(parsed) ? parsed : parsed.data || [];

        const final: CostCenter[] = rawData.map((item: any) => ({
          compId: item.CompId,
          CompName: item.CompName,
        }));

        setData(final);
        setFiltered(final);
        setLastUpdated(new Date());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter cost centers
  useEffect(() => {
    const f = data.filter(
      (c) =>
        (!searchId || c.compId.toLowerCase().includes(searchId.toLowerCase())) &&
        (!searchName || c.CompName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFiltered(f);
    setPage(1);
  }, [searchId, searchName, data]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Fetch departments for selected cost center
  const viewDetails = async (compId: string, compName: string) => {
    setSelectedCompName(compName);
    setDeptLoading(true);
    setModalOpen(true);

    try {
      const res = await fetch(`/misapi/api/trialbalance/departments/${compId}`);
      const txt = await res.text();
      const parsed = JSON.parse(txt);
      const rawData = Array.isArray(parsed) ? parsed : parsed.data || [];

      const deptList: Department[] = rawData.map((d: any) => ({
        DeptId: d.DeptId,
        DeptName: d.DeptName,
      }));

      setDepartments(deptList);
    } catch (e) {
      console.error("Failed to load departments:", e);
      setDepartments([]);
    } finally {
      setDeptLoading(false);
    }
  };

  // Fetch trial balance data
  const fetchTrialBalanceData = async () => {
    setTrialLoading(true);
    setTrialError(null);
    
    try {
      const monthNum = monthToNumber(trialData.month);
      const apiUrl = `/misapi/api/trialbalance/${trialData.costctr}/${trialData.year}/${monthNum}`;

      const response = await fetch(apiUrl, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
      }

      const jsonData = await response.json();
      
      // Handle different response formats
      let trialBalanceArray: TrialBalanceData[] = [];
      
      if (Array.isArray(jsonData)) {
        trialBalanceArray = jsonData;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        trialBalanceArray = jsonData.data;
      } else if (jsonData.result && Array.isArray(jsonData.result)) {
        trialBalanceArray = jsonData.result;
      } else if (jsonData.AcCd) { // Single record
        trialBalanceArray = [jsonData];
      }
      
      setTrialBalanceData(trialBalanceArray);
    } catch (error: any) {
      console.error("API Error:", error);
      setTrialError(error.message.includes("JSON.parse") 
        ? "Invalid data format received from server" 
        : error.message);
    } finally {
      setTrialLoading(false);
    }
  };

  useEffect(() => {
    if (trialModalOpen && trialData.costctr && trialData.year && trialData.month) {
      fetchTrialBalanceData();
    }
  }, [trialModalOpen, trialData]);

  // Helper functions
  const monthToNumber = (monthName: string): number => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
      "13th Period",
    ];
    return monthName === "13th Period" ? 13 : months.indexOf(monthName) + 1;
  };

  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
  };

  const handleSelection = (dept: Department, year: number, month: string) => {
    setTrialData({
      costctr: dept.DeptId,
      year,
      month,
      deptName: dept.DeptName
    });
    setTrialModalOpen(true);
    setModalOpen(false);
  };

  const closeDepartmentModal = () => {
    setModalOpen(false);
    setSelectedCompName(null);
    setDepartments([]);
  };

  const closeTrialModal = () => {
    setTrialModalOpen(false);
    setTrialBalanceData([]);
  };

  // Simple number formatting without thousands
  const formatNumber = (num: number): string => {
    if (isNaN(num)) return "0.00";
    
    // Format with thousand separators and 2 decimal places
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(num));
    
    // Add parentheses for negative numbers
    return num < 0 ? `(${formatted})` : formatted;
  };

  const getCategory = (acCd: string): string => {
    const firstChar = acCd.charAt(0).toUpperCase();
    switch (firstChar) {
      case 'A': return 'Assets';
      case 'E': return 'Expenditure';
      case 'L': return 'Liabilities';
      case 'R': return 'Revenue';
      default: return 'Other';
    }
  };

  const calculateTotals = () => {
    const categories = ['A', 'E', 'L', 'R'];
    const categoryTotals: Record<string, {
      opening: number;
      debit: number;
      credit: number;
      closing: number;
      count: number;
    }> = {};

    categories.forEach(cat => {
      categoryTotals[cat] = {
        opening: 0,
        debit: 0,
        credit: 0,
        closing: 0,
        count: 0
      };
    });

    trialBalanceData.forEach(row => {
      const firstChar = row.AcCd.charAt(0).toUpperCase();
      if (categories.includes(firstChar)) {
        categoryTotals[firstChar].opening += row.OpSbal || 0;
        categoryTotals[firstChar].debit += row.DrSamt || 0;
        categoryTotals[firstChar].credit += row.CrSamt || 0;
        categoryTotals[firstChar].closing += row.ClSbal || 0;
        categoryTotals[firstChar].count += 1;
      }
    });

    const grandTotals = {
      opening: Object.values(categoryTotals).reduce((sum, cat) => sum + cat.opening, 0),
      debit: Object.values(categoryTotals).reduce((sum, cat) => sum + cat.debit, 0),
      credit: Object.values(categoryTotals).reduce((sum, cat) => sum + cat.credit, 0),
      closing: Object.values(categoryTotals).reduce((sum, cat) => sum + cat.closing, 0),
      count: trialBalanceData.length
    };

    return { categoryTotals, grandTotals };
  };

  // Download as CSV function
  const downloadAsCSV = () => {
    if (!trialBalanceData || trialBalanceData.length === 0) return;
    
    const csvRows = [
      ["Account", "Description", "Opening", "Debit", "Credit", "Closing", "Category"],
      ...trialBalanceData.map((row) => [
        row.AcCd,
        row.GlName.trim(),
        row.OpSbal?.toString() ?? "0.00",
        row.DrSamt?.toString() ?? "0.00",
        row.CrSamt?.toString() ?? "0.00",
        row.ClSbal?.toString() ?? "0.00",
        getCategory(row.AcCd)
      ]),
    ];
    
    const csvContent = csvRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TrialBalance_${trialData.costctr}_${trialData.month}_${trialData.year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print PDF function with improved styling
  const printPDF = () => {
    if (!printRef.current) return;
    
    // Create a print-specific stylesheet
    const printStyles = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-section, #print-section * {
          visibility: visible;
        }
        #print-section {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          font-size: 10px !important;
          padding: 0;
          margin: 0;
        }
        .print-table {
          width: 100% !important;
          border-collapse: collapse;
        }
        .print-table th, .print-table td {
          padding: 2px 4px !important;
          line-height: 1.2;
        }
        .description-cell {
          max-width: 180px !important;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
          text-align: center;
          margin-bottom: 10px;
        }
        .print-header {
          margin-bottom: 5px;
          font-weight: bold;
        }
        .print-subheader {
          margin-bottom: 10px;
          font-size: 11px;
        }
        .print-footer {
          margin-top: 10px;
          font-size: 9px;
        }
        @page {
          size: auto;
          margin: 10mm;
        }
      }
      .print-only {
        display: none;
      }
    `;

    // Create a style element
    const styleElement = document.createElement("style");
    styleElement.innerHTML = printStyles;
    
    // Clone the printable content
    const printContents = printRef.current.cloneNode(true);
    
    // Create a new div for printing
    const printSection = document.createElement("div");
    printSection.id = "print-section";
    
    // Add print header
    const printHeader = document.createElement("div");
    printHeader.className = "print-only";
    printHeader.innerHTML = `
      <div class="print-header">MONTHLY TRIAL BALANCE - ${trialData.month.toUpperCase()}/${trialData.year}</div>
      <div class="print-subheader">Cost Center: ${trialData.costctr} - ${trialData.deptName}</div>
    `;
    printSection.appendChild(printHeader);
    
    // Add the table content
    printSection.appendChild(printContents);
    
    // Add print footer
    const printFooter = document.createElement("div");
    printFooter.className = "print-only print-footer";
    printFooter.textContent = `Generated on: ${new Date().toLocaleDateString()} | CEB@2025`;
    printSection.appendChild(printFooter);
    
    // Add the print styles
    printSection.appendChild(styleElement);
    
    // Add to document
    document.body.appendChild(printSection);
    
    // Print
    window.print();
    
    // Clean up
    document.body.removeChild(printSection);
  };

  const DepartmentModal = () => {
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<string>("January");
    const [searchId, setSearchId] = useState("");
    const [searchName, setSearchName] = useState("");
    const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

    const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
      "13th Period",
    ];

    useEffect(() => {
      const filtered = departments.filter(
        (dept) =>
          (!searchId || dept.DeptId.toLowerCase().includes(searchId.toLowerCase())) &&
          (!searchName || dept.DeptName.toLowerCase().includes(searchName.toLowerCase()))
      );
      setFilteredDepartments(filtered);
    }, [searchId, searchName, departments]);

    const clearFilters = () => {
      setSearchId("");
      setSearchName("");
    };

    const handleConfirm = () => {
      if (selectedDept) {
        handleSelection(selectedDept, selectedYear, selectedMonth);
      }
    };

    if (!modalOpen) return null;

    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 relative max-h-[90vh] overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${maroon}`}>
              {selectedDept
                ? `Dept ID: ${selectedDept.DeptId} — ${selectedDept.DeptName}`
                : `Departments of ${selectedCompName}`}
            </h3>
            <button onClick={closeDepartmentModal} className="text-gray-500 hover:text-red-500">
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {!selectedDept ? (
            <>
              <div className="flex flex-wrap gap-3 justify-end mb-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={searchId}
                    placeholder="Search by Dept ID"
                    onChange={(e) => setSearchId(e.target.value)}
                    className="pl-8 pr-3 py-1.5 w-48 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
                  />
                </div>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={searchName}
                    placeholder="Search by Dept Name"
                    onChange={(e) => setSearchName(e.target.value)}
                    className="pl-8 pr-3 py-1.5 w-48 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
                  />
                </div>
                {(searchId || searchName) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                  >
                    <FaSyncAlt className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {deptLoading ? (
                <div className="text-center p-4 text-sm text-gray-500 animate-pulse">
                  Loading departments...
                </div>
              ) : filteredDepartments.length === 0 ? (
                <div className="text-center p-4 text-sm text-gray-600 bg-gray-100 rounded">
                  {departments.length === 0 ? "No departments found." : "No departments match your search."}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-gray-700 text-sm">
                      <thead className={`${maroonBg} text-white sticky top-0`}>
                        <tr>
                          <th className="px-4 py-2 w-1/4">Dept ID</th>
                          <th className="px-4 py-2 w-1/2">Dept Name</th>
                          <th className="px-4 py-2 w-1/4 text-center">Select</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDepartments.map((dept, i) => (
                          <tr key={dept.DeptId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-2 truncate">{dept.DeptId}</td>
                            <td className="px-4 py-2 truncate">{dept.DeptName}</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => setSelectedDept(dept)}
                                className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 transition"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                <div className="grid grid-cols-7 gap-2 max-h-32 overflow-y-auto mb-4">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`text-xs py-1 rounded cursor-pointer border transition-colors duration-150
                      ${selectedYear === year
                        ? "bg-[#7A0000] text-white border-[#7A0000]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                      style={{ minWidth: "40px" }}
                    >
                      {year}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {months.map((month) => (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className={`text-xs py-1 rounded cursor-pointer border transition-colors duration-150
                      ${selectedMonth === month
                        ? "bg-[#7A0000] text-white border-[#7A0000]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                      style={{ minWidth: "50px" }}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDept(null)}
                  className="bg-gray-500 text-white py-2 px-6 rounded hover:brightness-110 text-sm"
                >
                  Back to Departments
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-[#7A0000] text-white py-2 px-6 rounded hover:brightness-110 text-sm"
                >
                  Confirm Selection
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const TrialBalanceModal = () => {
    const { categoryTotals, grandTotals } = calculateTotals();

    if (!trialModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
        <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4" ref={printRef}>
          <div className="p-5 border-b no-print">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">
                  MONTHLY TRIAL BALANCE - {trialData.month.toUpperCase()}/{trialData.year}
                </h2>
                <h3 className={`text-sm ${maroon}`}>
                  Cost Center- {trialData.costctr} - {trialData.deptName}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadAsCSV}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 text-xs"
                >
                  <FaDownload className="w-3 h-3" /> Export CSV
                </button>
                <button
                  onClick={printPDF}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 text-xs"
                >
                  <FaPrint className="w-3 h-3" /> Print PDF
                </button>
              </div>
            </div>
            {trialError && (
              <div className="text-red-600 text-xs mt-2 text-center">
                {trialError.includes("JSON.parse") ? "Data format error" : trialError}
              </div>
            )}
          </div>
          
          <div className="print-only hidden">
            <div className="print-header">MONTHLY TRIAL BALANCE - {trialData.month.toUpperCase()}/{trialData.year}</div>
            <div className="print-subheader">Cost Center: {trialData.costctr} - {trialData.deptName}</div>
          </div>
          
          <div className="px-6 py-5 overflow-y-auto flex-grow" id="trial-balance-table">
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
                      <th className="px-1 py-0.5 text-left w-[10%]">Account</th>
                      <th className="px-1 py-0.5 text-left w-[30%] description-cell">Description</th>
                      <th className="px-1 py-0.5 text-right w-[15%]">Opening</th>
                      <th className="px-1 py-0.5 text-right w-[15%]">Debit</th>
                      <th className="px-1 py-0.5 text-right w-[15%]">Credit</th>
                      <th className="px-1 py-0.5 text-right w-[15%]">Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalanceData.map((row, index) => {
                      const currentCategory = getCategory(row.AcCd);
                      const prevCategory = index > 0 ? getCategory(trialBalanceData[index-1].AcCd) : null;
                      const showCategoryHeader = currentCategory !== prevCategory;
                      const nextCategory = index < trialBalanceData.length - 1 ? getCategory(trialBalanceData[index+1].AcCd) : null;
                      const showCategoryTotal = currentCategory !== nextCategory;

                      return (
                        <React.Fragment key={index}>
                          {showCategoryHeader && (
                            <tr className="bg-gray-100 border-t border-b border-gray-300">
                              <td colSpan={6} className="px-2 py-1 font-medium">
                                {currentCategory}
                              </td>
                            </tr>
                          )}
                          <tr className="border-b hover:bg-gray-50">
                            <td className="px-1 py-0.5 font-mono">{row.AcCd}</td>
                            <td className="px-1 py-0.5 truncate description-cell pr-2">
                              {row.GlName.trim()}
                            </td>
                            <td className="px-1 py-0.5 text-right font-mono">
                              {formatNumber(row.OpSbal)}
                            </td>
                            <td className="px-1 py-0.5 text-right font-mono">
                              {formatNumber(row.DrSamt)}
                            </td>
                            <td className="px-1 py-0.5 text-right font-mono">
                              {formatNumber(row.CrSamt)}
                            </td>
                            <td className="px-1 py-0.5 text-right font-mono">
                              {formatNumber(row.ClSbal)}
                            </td>
                          </tr>
                          {showCategoryTotal && (
                            <tr className="bg-gray-100 font-medium border-t">
                              <td className="px-1 py-0.5 text-xs" colSpan={2}>
                                Total {currentCategory}
                              </td>
                              <td className="px-1 py-0.5 text-right font-mono">
                                {formatNumber(categoryTotals[row.AcCd.charAt(0).toUpperCase()].opening)}
                              </td>
                              <td className="px-1 py-0.5 text-right font-mono">
                                {formatNumber(categoryTotals[row.AcCd.charAt(0).toUpperCase()].debit)}
                              </td>
                              <td className="px-1 py-0.5 text-right font-mono">
                                {formatNumber(categoryTotals[row.AcCd.charAt(0).toUpperCase()].credit)}
                              </td>
                              <td className="px-1 py-0.5 text-right font-mono">
                                {formatNumber(categoryTotals[row.AcCd.charAt(0).toUpperCase()].closing)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className={`${maroon} font-medium border-t`}>
                      <td className="px-1 py-0.5 text-xs" colSpan={2}>
                        Grand Total
                      </td>
                      <td className="px-1 py-0.5 text-right font-mono">
                        {formatNumber(grandTotals.opening)}
                      </td>
                      <td className="px-1 py-0.5 text-right font-mono">
                        {formatNumber(grandTotals.debit)}
                      </td>
                      <td className="px-1 py-0.5 text-right font-mono">
                        {formatNumber(grandTotals.credit)}
                      </td>
                      <td className="px-1 py-0.5 text-right font-mono">
                        {formatNumber(grandTotals.closing)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
          
          <div className="p-5 border-t no-print flex flex-col items-center">
            <button
              onClick={closeTrialModal}
              className={`px-4 py-1.5 text-sm ${maroonBg} text-white rounded hover:brightness-110 mb-2`} 
            >
              Close Report
            </button>
            <div className="text-xs text-gray-500">
              Generated on: {new Date().toLocaleDateString()} | CEB@2025
            </div>
          </div>
          
          <div className="print-only hidden text-center text-xs mt-4">
            Generated on: {new Date().toLocaleDateString()} | CEB@2025
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${maroon}`}>
          {title}
          <span className="ml-2 text-xs text-gray-500">(Total: {filtered.length})</span>
        </h2>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400">Last updated: {lastUpdated.toLocaleString()}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-end mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchId}
            placeholder="Search by ID"
            onChange={(e) => setSearchId(e.target.value)}
            className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition"
          />
        </div>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchName}
            placeholder="Search by Name"
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition"
          />
        </div>
        {(searchId || searchName) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <FaSyncAlt className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading cost centers...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-gray-600 bg-gray-100 p-4 rounded">No cost centers found.</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full table-fixed text-left text-gray-700 text-sm">
                <thead className={`${maroonBg} text-white sticky top-0`}>
                  <tr>
                    <th className="px-4 py-2 w-1/4">ID</th>
                    <th className="px-4 py-2 w-1/2">Name</th>
                    <th className="px-4 py-2 w-1/4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(({ compId, CompName }, i) => (
                    <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 truncate">{compId}</td>
                      <td className="px-4 py-2 truncate">{CompName}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => viewDetails(compId, CompName)}
                          className={`px-3 py-1 ${maroonGrad} text-white rounded-md text-xs font-medium hover:brightness-110 transition shadow`}
                        >
                          <FaEye className="inline-block mr-1 w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 mt-3">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {Math.ceil(filtered.length / pageSize)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(filtered.length / pageSize)}
              className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}

      <DepartmentModal />
      <TrialBalanceModal />
    </div>
  );
};

export default CostCenterTrial;