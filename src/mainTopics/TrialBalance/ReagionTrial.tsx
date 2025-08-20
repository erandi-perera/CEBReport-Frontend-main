import React, { useEffect, useState } from "react";
import { FaSearch, FaSyncAlt, FaEye, FaDownload, FaPrint, FaTimes } from "react-icons/fa";

interface Region {
  compId: string;
  CompName: string;
}

interface TrialBalanceData {
  AccountCode: string;
  AccountName: string;
  TitleFlag: string;
  CostCenter: string;
  CompanyName: string;
  DepartmentId: string;
  OpeningBalance: number;
  DebitAmount: number;
  CreditAmount: number;
  ClosingBalance: number;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: TrialBalanceData[];
}

const RegionWiseTrial: React.FC = () => {
  // Main state
  const [regions, setRegions] = useState<Region[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Selection state
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // Trial balance state
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [trialData, setTrialData] = useState<ApiResponse | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  // Colors
  const maroon = "text-[#7A0000]";
  const maroonBg = "bg-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  // Available years and months
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, ..., 12]

  // Paginated regions
  const paginatedRegions = filteredRegions.slice((page - 1) * pageSize, page * pageSize);

  // Calculate totals for the trial balance data
  const calculateTotals = () => {
    if (!trialData || !trialData.data || trialData.data.length === 0) {
      return {
        OpeningBalance: 0,
        DebitAmount: 0,
        CreditAmount: 0,
        ClosingBalance: 0
      };
    }

    return trialData.data.reduce(
      (acc, item) => {
        return {
          OpeningBalance: acc.OpeningBalance + (item.OpeningBalance || 0),
          DebitAmount: acc.DebitAmount + (item.DebitAmount || 0),
          CreditAmount: acc.CreditAmount + (item.CreditAmount || 0),
          ClosingBalance: acc.ClosingBalance + (item.ClosingBalance || 0)
        };
      },
      { OpeningBalance: 0, DebitAmount: 0, CreditAmount: 0, ClosingBalance: 0 }
    );
  };

  // Fetch regions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/misapi/api/trialbalance/companies/level/70");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const txt = await res.text();
        const parsed = JSON.parse(txt);
        const rawData = Array.isArray(parsed) ? parsed : parsed.data || [];
        
        const regionsData: Region[] = rawData.map((item: any) => ({
          compId: item.CompId,
          CompName: item.CompName,
        }));
        
        setRegions(regionsData);
        setFilteredRegions(regionsData);
        setLastUpdated(new Date());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter regions
  useEffect(() => {
    const f = regions.filter(
      (r) =>
        (!searchId || r.compId.toLowerCase().includes(searchId.toLowerCase())) &&
        (!searchName || r.CompName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFilteredRegions(f);
    setPage(1);
  }, [searchId, searchName, regions]);

  // View date selection for selected region
  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setShowDateSelection(true);
  };

  // Fetch trial balance data
  const fetchTrialBalanceData = async () => {
    if (!selectedRegion) return;
    
    setTrialLoading(true);
    setTrialError(null);
    try {
      const apiUrl = `/reagion/api/regionwisetrial?companyId=${selectedRegion.compId}&month=${selectedMonth}&year=${selectedYear}`;
      
      const response = await fetch(apiUrl, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
      }
      
      const jsonData: ApiResponse = await response.json();
      
      if (!jsonData.success) {
        throw new Error("API request was not successful");
      }
      
      setTrialData(jsonData);
      setTrialModalOpen(true);
      setShowDateSelection(false);
    } catch (error: any) {
      setTrialError(error.message.includes("JSON.parse") ? "Invalid data format received from server" : error.message);
    } finally {
      setTrialLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
  };

  const closeTrialModal = () => {
    setTrialModalOpen(false);
    setTrialData(null);
    setSelectedRegion(null);
  };

  const getMonthName = (monthNum: number): string => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthNum - 1] || "";
  };

  const formatNumber = (num: number | null): string => {
    if (num === null) return "-";
    const absNum = Math.abs(num);
    const formatted = new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(absNum);
    
    return num < 0 ? `(${formatted})` : formatted;
  };

  // Download as CSV function
  const downloadAsCSV = () => {
    if (!trialData || !trialData.data || trialData.data.length === 0) return;
    
    const totals = calculateTotals();
    
    // Create headers
    const headers = [
      "Account Code", 
      "Account Name", 
      "Title Flag",
      "Cost Center",
      "Company Name",
      "Department ID",
      "Opening Balance",
      "Debit Amount",
      "Credit Amount",
      "Closing Balance"
    ];
    
    // Create data rows
    const dataRows = trialData.data.map(item => [
      `"${item.AccountCode.trim()}"`,
      `"${item.AccountName.trim()}"`,
      `"${item.TitleFlag}"`,
      `"${item.CostCenter.trim()}"`,
      `"${item.CompanyName.trim()}"`,
      `"${item.DepartmentId}"`,
      item.OpeningBalance,
      item.DebitAmount,
      item.CreditAmount,
      item.ClosingBalance
    ]);
    
    // Add totals row
    dataRows.push([
      '"TOTAL"',
      '""',
      '""',
      '""',
      '""',
      '""',
      totals.OpeningBalance,
      totals.DebitAmount,
      totals.CreditAmount,
      totals.ClosingBalance
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...dataRows.map(row => row.join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RegionTrialBalance_${selectedRegion?.compId}_${getMonthName(selectedMonth)}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print PDF function
  const printPDF = () => {
    if (!trialData || !trialData.data || trialData.data.length === 0) return;

    const totals = calculateTotals();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate table rows HTML
    let tableRowsHTML = trialData.data.map(item => `
      <tr>
        <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${item.AccountCode.trim()}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${item.AccountName.trim()}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${item.TitleFlag}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${item.CostCenter.trim()}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${item.CompanyName.trim()}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${item.DepartmentId}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(item.OpeningBalance)}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(item.DebitAmount)}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(item.CreditAmount)}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold;">${formatNumber(item.ClosingBalance)}</td>
      </tr>
    `).join('');

    // Add totals row
    tableRowsHTML += `
      <tr style="font-weight: bold; background-color: #f5f5f5;">
        <td style="padding: 6px; border: 1px solid #ddd;">TOTAL</td>
        <td style="padding: 6px; border: 1px solid #ddd;"></td>
        <td style="padding: 6px; border: 1px solid #ddd;"></td>
        <td style="padding: 6px; border: 1px solid #ddd;"></td>
        <td style="padding: 6px; border: 1px solid #ddd;"></td>
        <td style="padding: 6px; border: 1px solid #ddd;"></td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(totals.OpeningBalance)}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(totals.DebitAmount)}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(totals.CreditAmount)}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(totals.ClosingBalance)}</td>
      </tr>
    `;

    // Create the HTML content for printing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Region Trial Balance - ${getMonthName(selectedMonth)} ${selectedYear}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 12px;
            color: #333;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #7A0000;
            padding-bottom: 15px;
          }
          
          .header h1 {
            color: #7A0000;
            font-size: 18px;
            margin: 0;
            font-weight: bold;
          }
          
          .header h2 {
            color: #7A0000;
            font-size: 14px;
            margin: 5px 0;
          }
          
          .header-info {
            margin-top: 10px;
            font-size: 12px;
            color: #666;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th {
            background-color: #7A0000;
            color: white;
            font-weight: bold;
            text-align: center;
            padding: 8px;
            border: 1px solid #7A0000;
          }
          
          td {
            padding: 6px;
            border: 1px solid #ddd;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          
          @media print {
            body { margin: 0; }
            .header { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>REGION WISE TRIAL BALANCE - ${getMonthName(selectedMonth).toUpperCase()} ${selectedYear}</h1>
          <h2>Region: ${selectedRegion?.compId} - ${selectedRegion?.CompName}</h2>
          <div class="header-info">
            Generated on: ${new Date().toLocaleDateString()} | Total Records: ${trialData.count}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Title Flag</th>
              <th>Cost Center</th>
              <th>Company Name</th>
              <th>Department ID</th>
              <th>Opening Balance</th>
              <th>Debit Amount</th>
              <th>Credit Amount</th>
              <th>Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleDateString()} | CEB@2025</p>
        </div>
      </body>
      </html>
    `;

    // Write content to the new window and print
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  // Region Table Component
  const RegionTable = () => (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${maroon}`}>
          Region Details
          <span className="ml-2 text-xs text-gray-500">(Total: {filteredRegions.length})</span>
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
            placeholder="Search by Code"
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
          <p className="mt-2 text-gray-600">Loading regions...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      {!loading && !error && filteredRegions.length === 0 && (
        <div className="text-gray-600 bg-gray-100 p-4 rounded">No regions found.</div>
      )}
      {!loading && !error && filteredRegions.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full table-fixed text-left text-gray-700 text-sm">
                <thead className={`${maroonGrad} text-white sticky top-0`}>
                  <tr>
                    <th className="px-4 py-2 w-1/4">Region Code</th>
                    <th className="px-4 py-2 w-1/2">Region Name</th>
                    <th className="px-4 py-2 w-1/4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRegions.map((region, i) => (
                    <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 truncate">{region.compId}</td>
                      <td className="px-4 py-2 truncate">{region.CompName}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleRegionSelect(region)}
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
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {Math.ceil(filteredRegions.length / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(filteredRegions.length / pageSize), p + 1))}
              disabled={page >= Math.ceil(filteredRegions.length / pageSize)}
              className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  );

  // Date Selection Modal
  const DateSelectionModal = () => {
    if (!selectedRegion || !showDateSelection) return null;

    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 relative max-h-[90vh] overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${maroon}`}>
              Select Period for ${selectedRegion.CompName}
            </h3>
            <button 
              onClick={() => setShowDateSelection(false)} 
              className="text-gray-500 hover:text-red-500"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
          
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
                  {getMonthName(month)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDateSelection(false)}
              className="bg-gray-500 text-white py-2 px-6 rounded hover:brightness-110 text-sm"
            >
              Back
            </button>
            <button
              onClick={fetchTrialBalanceData}
              className="bg-[#7A0000] text-white py-2 px-6 rounded hover:brightness-110 text-sm"
            >
              View Trial Balance
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Trial Balance Modal Component
  const TrialBalanceModal = () => {
    if (!trialModalOpen || !selectedRegion || !trialData) return null;
    
    const totals = calculateTotals();
    
    return (
      <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
        <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4">
          <div className="p-5 border-b">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">
                  REGION WISE TRIAL BALANCE - ${getMonthName(selectedMonth).toUpperCase()} ${selectedYear}
                </h2>
                <h3 className={`text-sm ${maroon}`}>
                  Region: ${selectedRegion.compId} - ${selectedRegion.CompName}
                </h3>
                <p className="text-xs text-gray-500">Total records: ${trialData.count}</p>
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
                ${trialError.includes("JSON.parse") ? "Data format error" : trialError}
              </div>
            )}
          </div>
          <div className="px-6 py-5 overflow-y-auto flex-grow">
            {trialLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mr-3"></div>
                <span className={`${maroon} text-sm`}>Loading trial balance...</span>
              </div>
            ) : trialData.data.length === 0 ? (
              <div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded text-sm text-center">
                No data found
              </div>
            ) : (
              <div className="w-full overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className={`${maroonBg} text-white`}>
                      <th className="px-2 py-1 text-left sticky left-0 bg-[#7A0000] z-10">Account Code</th>
                      <th className="px-2 py-1 text-left sticky left-0 bg-[#7A0000] z-10">Account Name</th>
                      <th className="px-2 py-1 text-center">Title Flag</th>
                      <th className="px-2 py-1 text-left">Cost Center</th>
                      <th className="px-2 py-1 text-left">Company Name</th>
                      <th className="px-2 py-1 text-left">Department ID</th>
                      <th className="px-2 py-1 text-right">Opening Balance</th>
                      <th className="px-2 py-1 text-right">Debit Amount</th>
                      <th className="px-2 py-1 text-right">Credit Amount</th>
                      <th className="px-2 py-1 text-right">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialData.data.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-2 py-1 font-mono sticky left-0 bg-white">{item.AccountCode.trim()}</td>
                        <td className="px-2 py-1 sticky left-0 bg-white">{item.AccountName.trim()}</td>
                        <td className="px-2 py-1 text-center">{item.TitleFlag}</td>
                        <td className="px-2 py-1">{item.CostCenter.trim()}</td>
                        <td className="px-2 py-1">{item.CompanyName.trim()}</td>
                        <td className="px-2 py-1">{item.DepartmentId}</td>
                        <td className="px-2 py-1 text-right font-mono">{formatNumber(item.OpeningBalance)}</td>
                        <td className="px-2 py-1 text-right font-mono">{formatNumber(item.DebitAmount)}</td>
                        <td className="px-2 py-1 text-right font-mono">{formatNumber(item.CreditAmount)}</td>
                        <td className="px-2 py-1 text-right font-mono font-bold">{formatNumber(item.ClosingBalance)}</td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="font-bold bg-gray-100">
                      <td className="px-2 py-1 sticky left-0 bg-gray-100">TOTAL</td>
                      <td className="px-2 py-1 sticky left-0 bg-gray-100"></td>
                      <td className="px-2 py-1 text-center"></td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1 text-right font-mono">{formatNumber(totals.OpeningBalance)}</td>
                      <td className="px-2 py-1 text-right font-mono">{formatNumber(totals.DebitAmount)}</td>
                      <td className="px-2 py-1 text-right font-mono">{formatNumber(totals.CreditAmount)}</td>
                      <td className="px-2 py-1 text-right font-mono">{formatNumber(totals.ClosingBalance)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="p-5 border-t flex justify-center">
            <button
              onClick={closeTrialModal}
              className={`px-4 py-1.5 text-sm ${maroonBg} text-white rounded hover:brightness-110`} 
            >
              Back To Home
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
      <RegionTable />
      <DateSelectionModal />
      <TrialBalanceModal />
    </div>
  );
};

export default RegionWiseTrial;