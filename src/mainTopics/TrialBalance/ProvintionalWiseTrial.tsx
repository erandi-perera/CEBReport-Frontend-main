import React, { useEffect, useState } from "react";
import { FaSearch, FaSyncAlt, FaEye, FaDownload, FaPrint, FaTimes } from "react-icons/fa";

interface Company {
  compId: string;
  CompName: string;
}

interface TrialBalanceData {
  AccountCode: string;
  AccountName: string;
  TitleFlag: string;
  CostCenter: string;
  CompanyName: string;
  OpeningBalance: number;
  DebitAmount: number;
  CreditAmount: number;
  ClosingBalance: number;
}

const ProvintionalWiseTrial: React.FC = () => {
  // Main state
  const [data, setData] = useState<Company[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filtered, setFiltered] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  // Selection state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // Trial balance modal state
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData[]>([]);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  // Colors
  const maroon = "text-[#7A0000]";
  const maroonBg = "bg-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  // Available years and months
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, ..., 12]

  // Paginated companies
  const paginatedCompanies = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Fetch companies
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/misapi/api/trialbalance/companies/level/60");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const txt = await res.text();
        const parsed = JSON.parse(txt);
        const rawData = Array.isArray(parsed) ? parsed : parsed.data || [];
        
        const final: Company[] = rawData.map((item: any) => ({
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

  // Filter companies
  useEffect(() => {
    const f = data.filter(
      (c) =>
        (!searchId || c.compId.toLowerCase().includes(searchId.toLowerCase())) &&
        (!searchName || c.CompName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFiltered(f);
    setPage(1);
  }, [searchId, searchName, data]);

  // View date selection for selected company
  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setShowDateSelection(true);
  };

  // Fetch trial balance data
  const fetchTrialBalanceData = async () => {
    if (!selectedCompany) return;
    
    setTrialLoading(true);
    setTrialError(null);
    try {
      const apiUrl = `/misapi/api/trialbalance?companyId=${selectedCompany.compId}&month=${selectedMonth}&year=${selectedYear}`;
      
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
      
      const jsonData = await response.json();
      let trialBalanceArray: TrialBalanceData[] = [];
      
      if (Array.isArray(jsonData)) {
        trialBalanceArray = jsonData;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        trialBalanceArray = jsonData.data;
      } else if (jsonData.result && Array.isArray(jsonData.result)) {
        trialBalanceArray = jsonData.result;
      } else {
        trialBalanceArray = [jsonData];
      }
      
      // Sort by AccountCode in ascending order
      trialBalanceArray.sort((a, b) => a.AccountCode.localeCompare(b.AccountCode));
      
      setTrialBalanceData(trialBalanceArray);
      setTrialModalOpen(true);
      setShowDateSelection(false);
    } catch (error: any) {
      setTrialError(error.message.includes("JSON.parse") ? "Invalid data format received from server" : error.message);
    } finally {
      setTrialLoading(false);
    }
  };

  // Process trial balance data into consolidated format with totals
  const getConsolidatedData = () => {
    const grouped: Record<string, {
      AccountCode: string;
      AccountName: string;
      TitleFlag: string;
      balances: Record<string, number>;
    }> = {};

    trialBalanceData.forEach((entry) => {
      const accountCode = entry.AccountCode.trim();
      const accountName = entry.AccountName.trim();
      const key = `${accountCode}_${accountName}`;
      const costCenter = entry.CostCenter.replace("CC -", "").trim();

      if (!grouped[key]) {
        grouped[key] = {
          AccountCode: accountCode,
          AccountName: accountName,
          TitleFlag: entry.TitleFlag,
          balances: {},
        };
      }

      grouped[key].balances[costCenter] = entry.ClosingBalance || 0;
    });

    // Get unique cost centers and sort them
    const costCenters = Array.from(
      new Set(trialBalanceData.map((e) => e.CostCenter.replace("CC -", "").trim()))
    ).sort();

    // Calculate totals for each row and separate assets and expenditures
    const assetsRows: any[] = [];
    const expenditureRows: any[] = [];
    const otherRows: any[] = [];

    Object.values(grouped).forEach((row) => {
      const total = costCenters.reduce(
        (sum, cc) => sum + (row.balances[cc] || 0),
        0
      );
      
      const rowData = { ...row, total };
      
      // Categorize rows based on TitleFlag or AccountCode pattern
      if (row.TitleFlag === 'A' || row.AccountCode.startsWith('1')) {
        assetsRows.push(rowData);
      } else if (row.TitleFlag === 'E' || row.AccountCode.startsWith('4') || row.AccountCode.startsWith('5')) {
        expenditureRows.push(rowData);
      } else {
        otherRows.push(rowData);
      }
    });

    // Calculate totals for assets and expenditures
    const assetsTotal = assetsRows.reduce((sum, row) => sum + row.total, 0);
    const expenditureTotal = expenditureRows.reduce((sum, row) => sum + row.total, 0);
    const grandTotal = assetsTotal + expenditureTotal + otherRows.reduce((sum, row) => sum + row.total, 0);

    return { 
      costCenters, 
      rows: [...assetsRows, ...expenditureRows, ...otherRows],
      assetsTotal,
      expenditureTotal,
      grandTotal
    };
  };

  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
  };

  const closeTrialModal = () => {
    setTrialModalOpen(false);
    setTrialBalanceData([]);
    setSelectedCompany(null);
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
    if (!trialBalanceData || trialBalanceData.length === 0) return;
    
    const { costCenters, rows } = getConsolidatedData();
    
    // Create headers
    const headers = ["Account Code", "Account Name", ...costCenters, "Total"];
    
    // Create data rows
    const dataRows = rows.map(row => [
      row.AccountCode,
      row.AccountName,
      ...costCenters.map(cc => formatNumber(row.balances[cc] || 0)),
      formatNumber(row.total)
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...dataRows.map(row => row.join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TrialBalance_${selectedCompany?.compId}_${getMonthName(selectedMonth)}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print PDF function
  const printPDF = () => {
    if (!trialBalanceData || trialBalanceData.length === 0) return;

    const { costCenters, rows, assetsTotal, expenditureTotal, grandTotal } = getConsolidatedData();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate table rows HTML
    let tableRowsHTML = '';
    
    // Assets section
    tableRowsHTML += `
      <tr class="category-header">
        <td colspan="${costCenters.length + 3}" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000;">ASSETS</td>
      </tr>
    `;
    
    const assetsRows = rows.filter(row => row.TitleFlag === 'A' || row.AccountCode.startsWith('1'));
    assetsRows.forEach(row => {
      tableRowsHTML += `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${row.AccountCode}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.AccountName}</td>
          ${costCenters.map(cc => `
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.balances[cc] || 0)}</td>
          `).join('')}
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold;">${formatNumber(row.total)}</td>
        </tr>
      `;
    });
    
    // Assets total
    tableRowsHTML += `
      <tr class="category-total">
        <td colspan="2" style="padding: 6px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">TOTAL ASSETS</td>
        ${costCenters.map(cc => `
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">
            ${formatNumber(assetsRows.reduce((sum, row) => sum + (row.balances[cc] || 0), 0))}
          </td>
        `).join('')}
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">
          ${formatNumber(assetsTotal)}
        </td>
      </tr>
    `;
    
    // Expenditure section
    tableRowsHTML += `
      <tr class="category-header">
        <td colspan="${costCenters.length + 3}" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000;">EXPENDITURES</td>
      </tr>
    `;
    
    const expenditureRows = rows.filter(row => row.TitleFlag === 'E' || row.AccountCode.startsWith('4') || row.AccountCode.startsWith('5'));
    expenditureRows.forEach(row => {
      tableRowsHTML += `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${row.AccountCode}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.AccountName}</td>
          ${costCenters.map(cc => `
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.balances[cc] || 0)}</td>
          `).join('')}
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold;">${formatNumber(row.total)}</td>
        </tr>
      `;
    });
    
    // Expenditure total
    tableRowsHTML += `
      <tr class="category-total">
        <td colspan="2" style="padding: 6px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">TOTAL EXPENDITURES</td>
        ${costCenters.map(cc => `
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">
            ${formatNumber(expenditureRows.reduce((sum, row) => sum + (row.balances[cc] || 0), 0))}
          </td>
        `).join('')}
        <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">
          ${formatNumber(expenditureTotal)}
        </td>
      </tr>
    `;
    
    // Other rows
    const otherRows = rows.filter(row => 
      !(row.TitleFlag === 'A' || row.AccountCode.startsWith('1')) && 
      !(row.TitleFlag === 'E' || row.AccountCode.startsWith('4') || row.AccountCode.startsWith('5'))
    );
    
    if (otherRows.length > 0) {
      tableRowsHTML += `
        <tr class="category-header">
          <td colspan="${costCenters.length + 3}" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000;">OTHER ACCOUNTS</td>
        </tr>
      `;
      
      otherRows.forEach(row => {
        tableRowsHTML += `
          <tr>
            <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${row.AccountCode}</td>
            <td style="padding: 6px; border: 1px solid #ddd;">${row.AccountName}</td>
            ${costCenters.map(cc => `
              <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.balances[cc] || 0)}</td>
            `).join('')}
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold;">${formatNumber(row.total)}</td>
          </tr>
        `;
      });
    }
    
    // Grand total
    tableRowsHTML += `
      <tr style="background-color: #7A0000; color: white; font-weight: bold;">
        <td colspan="2" style="padding: 8px; border: 1px solid #7A0000;">GRAND TOTAL</td>
        ${costCenters.map(cc => `
          <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">
            ${formatNumber(rows.reduce((sum, row) => sum + (row.balances[cc] || 0), 0))}
          </td>
        `).join('')}
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">
          ${formatNumber(grandTotal)}
        </td>
      </tr>
    `;

    // Create the HTML content for printing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trial Balance - ${getMonthName(selectedMonth)} ${selectedYear}</title>
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
          
          .category-header td {
            text-align: center;
            font-weight: bold;
            background-color: #f5f5f5;
            color: #7A0000;
          }
          
          .category-total td {
            background-color: #f9f9f9;
            font-weight: bold;
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
          <h1>MONTHLY TRIAL BALANCE - ${getMonthName(selectedMonth).toUpperCase()} ${selectedYear}</h1>
          <h2>Company: ${selectedCompany?.compId} - ${selectedCompany?.CompName}</h2>
          <div class="header-info">
            Generated on: ${new Date().toLocaleDateString()} | Total Records: ${trialBalanceData.length}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Account Code</th>
              <th style="width: 30%;">Account Name</th>
              ${costCenters.map(cc => `
                <th style="width: 15%;">${cc}</th>
              `).join('')}
              <th style="width: 15%;">Total</th>
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

  // Company Table Component
  const CompanyTable = () => (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${maroon}`}>
          Company Details
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
          <p className="mt-2 text-gray-600">Loading companies...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-gray-600 bg-gray-100 p-4 rounded">No companies found.</div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full table-fixed text-left text-gray-700 text-sm">
                <thead className={`${maroonGrad} text-white sticky top-0`}>
                  <tr>
                    <th className="px-4 py-2 w-1/4">Company Code</th>
                    <th className="px-4 py-2 w-1/2">Company Name</th>
                    <th className="px-4 py-2 w-1/4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.map((company, i) => (
                    <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 truncate">{company.compId}</td>
                      <td className="px-4 py-2 truncate">{company.CompName}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleCompanySelect(company)}
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
              Page {page} of {Math.ceil(filtered.length / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / pageSize), p + 1))}
              disabled={page >= Math.ceil(filtered.length / pageSize)}
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
    if (!selectedCompany || !showDateSelection) return null;

    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 relative max-h-[90vh] overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${maroon}`}>
              Select Period for {selectedCompany.CompName}
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

  // Trial Balance Modal Component with enhanced features
  const TrialBalanceModal = () => {
    if (!trialModalOpen || !selectedCompany) return null;
    
    const { costCenters, rows, assetsTotal, expenditureTotal, grandTotal } = getConsolidatedData();
    
    // Find the index where assets end and expenditures begin
    const assetsEndIndex = rows.findIndex(row => 
      !(row.TitleFlag === 'A' || row.AccountCode.startsWith('1'))
    );
    const expendituresEndIndex = rows.findIndex(row => 
      !(row.TitleFlag === 'E' || row.AccountCode.startsWith('4') || row.AccountCode.startsWith('5'))
    );

    return (
      <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
        <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4">
          <div className="p-5 border-b">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">
                  MONTHLY TRIAL BALANCE - {getMonthName(selectedMonth).toUpperCase()} {selectedYear}
                </h2>
                <h3 className={`text-sm ${maroon}`}>
                  Company: {selectedCompany.compId} - {selectedCompany.CompName}
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
          <div className="px-6 py-5 overflow-y-auto flex-grow">
            {trialLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mr-3"></div>
                <span className={`${maroon} text-sm`}>Loading trial balance...</span>
              </div>
            ) : trialBalanceData.length === 0 ? (
              <div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded text-sm text-center">
                No data found
              </div>
            ) : (
              <div className="w-full overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className={`${maroonBg} text-white`}>
                      <th className="px-2 py-1 text-left sticky left-0 bg-[#7A0000] z-10">Account</th>
                      <th className="px-2 py-1 text-left sticky left-0 bg-[#7A0000] z-10">Description</th>
                      {costCenters.map((cc) => (
                        <th key={cc} className="px-2 py-1 text-right min-w-[100px]">{cc}</th>
                      ))}
                      <th className="px-2 py-1 text-right font-bold min-w-[100px]">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      // Check if we need to add a total row after assets or expenditures
                      const showAssetsTotal = index === assetsEndIndex - 1 && assetsEndIndex !== -1;
                      const showExpenditureTotal = index === expendituresEndIndex - 1 && expendituresEndIndex !== -1;
                      
                      return (
                        <>
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="px-2 py-1 font-mono sticky left-0 bg-white">{row.AccountCode}</td>
                            <td className="px-2 py-1 sticky left-0 bg-white">{row.AccountName}</td>
                            {costCenters.map((cc) => (
                              <td key={cc} className="px-2 py-1 text-right font-mono">
                                {formatNumber(row.balances[cc] || null)}
                              </td>
                            ))}
                            <td className="px-2 py-1 text-right font-mono">
                              {formatNumber(row.total)}
                            </td>
                          </tr>
                          
                          {/* Assets Total Row */}
                          {showAssetsTotal && (
                            <tr key={`assets-total-${index}`} className="border-b bg-gray-100 font-bold">
                              <td className="px-2 py-1 sticky left-0 bg-gray-100"></td>
                              <td className="px-2 py-1 sticky left-0 bg-gray-100">TOTAL ASSETS</td>
                              {costCenters.map((cc) => (
                                <td key={cc} className="px-2 py-1 text-right font-mono">
                                  {formatNumber(
                                    rows.slice(0, index + 1)
                                      .filter(r => r.TitleFlag === 'A' || r.AccountCode.startsWith('1'))
                                      .reduce((sum, r) => sum + (r.balances[cc] || 0), 0)
                                  )}
                                </td>
                              ))}
                              <td className="px-2 py-1 text-right font-mono">
                                {formatNumber(assetsTotal)}
                              </td>
                            </tr>
                          )}
                          
                          {/* Expenditure Total Row */}
                          {showExpenditureTotal && (
                            <tr key={`expenditure-total-${index}`} className="border-b bg-gray-100 font-bold">
                              <td className="px-2 py-1 sticky left-0 bg-gray-100"></td>
                              <td className="px-2 py-1 sticky left-0 bg-gray-100">TOTAL EXPENDITURE</td>
                              {costCenters.map((cc) => (
                                <td key={cc} className="px-2 py-1 text-right font-mono">
                                  {formatNumber(
                                    rows.slice(assetsEndIndex, index + 1)
                                      .filter(r => r.TitleFlag === 'E' || r.AccountCode.startsWith('4') || r.AccountCode.startsWith('5'))
                                      .reduce((sum, r) => sum + (r.balances[cc] || 0), 0)
                                  )}
                                </td>
                              ))}
                              <td className="px-2 py-1 text-right font-mono">
                                {formatNumber(expenditureTotal)}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                    
                    {/* Grand Total Row */}
                    <tr className="border-t-2 border-gray-800 bg-gray-200 font-bold">
                      <td className="px-2 py-1 sticky left-0 bg-gray-200"></td>
                      <td className="px-2 py-1 sticky left-0 bg-gray-200">GRAND TOTAL</td>
                      {costCenters.map((cc) => (
                        <td key={cc} className="px-2 py-1 text-right font-mono">
                          {formatNumber(
                            rows.reduce((sum, row) => sum + (row.balances[cc] || 0), 0)
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-1 text-right font-mono">
                        {formatNumber(grandTotal)}
                      </td>
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
      <CompanyTable />
      <DateSelectionModal />
      <TrialBalanceModal />
    </div>
  );
};

export default ProvintionalWiseTrial;