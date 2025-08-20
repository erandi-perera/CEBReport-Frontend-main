import React, { useEffect, useState } from "react";
import { Search, RotateCcw, Eye, X, Download, Printer, ChevronLeft } from "lucide-react";

interface Company {
  compId: string;
  CompName: string;
}

interface IncomeExpenditureData {
  TitleCd: string;
  Account: string;
  Actual: number;
  CatName: string;
  MaxRev: string;
  CatCode: string;
  CatFlag: string;
  CompName: string;
  CostCtr: string;
}

const RegionExpenditure: React.FC = () => {
  // Main state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
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

  // Income/Expenditure modal state
  const [incomeExpModalOpen, setIncomeExpModalOpen] = useState(false);
  const [incomeExpData, setIncomeExpData] = useState<IncomeExpenditureData[]>([]);
  const [incomeExpLoading, setIncomeExpLoading] = useState(false);
  const [incomeExpError, setIncomeExpError] = useState<string | null>(null);

  // Colors
  const maroon = "text-[#7A0000]";
  const maroonBg = "bg-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  // Available years and months
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 13 }, (_, i) => i + 1); // 1-13 for 13th period

  // Paginated companies
  const paginatedCompanies = filteredCompanies.slice((page - 1) * pageSize, page * pageSize);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const res = await fetch("/misapi/api/trialbalance/companies/level/70");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        
        const parsed = await res.json();
        
        let rawData = [];
        if (Array.isArray(parsed)) {
          rawData = parsed;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          rawData = parsed.data;
        } else {
          console.log('Unexpected response structure:', parsed);
          rawData = [];
        }
        
        const companiesData: Company[] = rawData.map((item: any) => ({
          compId: item.CompId,
          CompName: item.CompName,
        }));
        
        setCompanies(companiesData);
        setFilteredCompanies(companiesData);
        setLastUpdated(new Date());
      } catch (e: any) {
        console.error('API Error:', e);
        setError(e.message.includes("JSON.parse") ? "Invalid data format received from server. Please check if the API is returning valid JSON." : e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // Filter companies
  useEffect(() => {
    const filtered = companies.filter(
      (c) =>
        (!searchId || c.compId.toLowerCase().includes(searchId.toLowerCase())) &&
        (!searchName || c.CompName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFilteredCompanies(filtered);
    setPage(1);
  }, [searchId, searchName, companies]);

  // Fetch income & expenditure data
  const fetchIncomeExpenditureData = async () => {
    if (!selectedCompany) return;
    
    setIncomeExpLoading(true);
    setIncomeExpError(null);
    try {
      const apiUrl = `/misapi/api/incomeexpenditureregion/${selectedCompany.compId}/${selectedYear}/${selectedMonth}`;
      
      const response = await fetch(apiUrl, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
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
      let dataArray: IncomeExpenditureData[] = [];

      if (Array.isArray(jsonData)) {
        dataArray = jsonData;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        dataArray = jsonData.data;
      } else if (jsonData.result && Array.isArray(jsonData.result)) {
        dataArray = jsonData.result;
      } else if (jsonData.TitleCd) {
        dataArray = [jsonData];
      }

      setIncomeExpData(dataArray);
      setIncomeExpModalOpen(true);
      setShowDateSelection(false);
    } catch (error: any) {
      setIncomeExpError(error.message.includes("JSON.parse") ? "Invalid data format received from server" : error.message);
    } finally {
      setIncomeExpLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setShowDateSelection(true);
  };

  const closeIncomeExpModal = () => {
    setIncomeExpModalOpen(false);
    setIncomeExpData([]);
    setSelectedCompany(null);
  };

  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
  };

  const getMonthName = (monthNum: number): string => {
    if (monthNum === 13) return "13th Period";
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthNum - 1] || "";
  };

  // Updated formatNumber function
  const formatNumber = (num: number): string => {
    if (isNaN(num)) return "0.00";
    const formatted = new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(Math.abs(num));
    return num < 0 ? `(${formatted})` : formatted;
  };

  // Calculate totals by category
  const calculateTotals = () => {
    const incomeTotal = incomeExpData
      .filter(item => item.CatFlag === 'I')
      .reduce((sum, item) => sum + (item.Actual || 0), 0);
    
    const expenditureTotal = incomeExpData
      .filter(item => item.CatFlag === 'E')
      .reduce((sum, item) => sum + (item.Actual || 0), 0);

    return { incomeTotal, expenditureTotal, netTotal: incomeTotal - expenditureTotal };
  };

  // Escape CSV field function
  const escapeCSVField = (field: string | number): string => {
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return '"' + stringField.replace(/"/g, '""') + '"';
    }
    return stringField;
  };

  // Download as CSV
  const downloadAsCSV = () => {
    if (!incomeExpData || incomeExpData.length === 0) return;
    
    const headers = [
      "Title Code", "Account", "Category Name", "Category Code", 
      "Actual Amount", "Company Name", "Cost Center"
    ];
    
    const dataRows = incomeExpData.map(item => [
      escapeCSVField(item.TitleCd?.trim() || ""),
      escapeCSVField(item.Account?.trim() || ""),
      escapeCSVField(item.CatName?.trim() || ""),
      escapeCSVField(item.CatCode?.trim() || ""),
      escapeCSVField(formatNumber(item.Actual)),
      escapeCSVField(item.CompName?.trim() || ""),
      escapeCSVField(item.CostCtr?.trim() || "")
    ]);
    
    const { incomeTotal, expenditureTotal, netTotal } = calculateTotals();
    
    const summaryRows = [];
    summaryRows.push(["", "", "", "", "", "", ""]);
    summaryRows.push(["", "", "", "TOTAL INCOME", escapeCSVField(formatNumber(incomeTotal)), "", ""]);
    summaryRows.push(["", "", "", "TOTAL EXPENDITURE", escapeCSVField(formatNumber(expenditureTotal)), "", ""]);
    summaryRows.push(["", "", "", "NET TOTAL", escapeCSVField(formatNumber(netTotal)), "", ""]);
    
    const csvContent = [
      headers.join(","),
      ...dataRows.map(row => row.join(",")),
      ...summaryRows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `IncomeExpenditure_${selectedCompany?.compId}_${getMonthName(selectedMonth)}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print PDF
  const printPDF = () => {
    if (!incomeExpData || incomeExpData.length === 0) return;

    const { incomeTotal, expenditureTotal, netTotal } = calculateTotals();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const incomeData = incomeExpData.filter(item => item.CatFlag === 'I');
    const expenditureData = incomeExpData.filter(item => item.CatFlag === 'E');

    const generateTableRows = (data: IncomeExpenditureData[]) => {
      return data.map(row => `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.Account?.trim() || ''}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.CatName?.trim() || ''}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.Actual)}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.CatCode?.trim() || ''}</td>
        </tr>
      `).join('');
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Income & Expenditure Report - ${getMonthName(selectedMonth)}/${selectedYear}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7A0000; padding-bottom: 15px; }
          .header h1 { color: #7A0000; font-size: 18px; margin: 0; font-weight: bold; }
          .header h2 { color: #7A0000; font-size: 14px; margin: 5px 0; }
          .header-info { margin-top: 10px; font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #7A0000; color: white; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #7A0000; }
          .section-header { background-color: #f5f5f5; color: #7A0000; font-weight: bold; text-align: center; padding: 8px; }
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .net-total { background-color: #7A0000; color: white; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
          @media print { body { margin: 0; } .header { page-break-inside: avoid; } table { page-break-inside: auto; } tr { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INCOME & EXPENDITURE REPORT - ${getMonthName(selectedMonth).toUpperCase()}/${selectedYear}</h1>
          <h2>Company: ${selectedCompany?.compId} - ${selectedCompany?.CompName?.trim()}</h2>
          <div class="header-info">
            Generated on: ${new Date().toLocaleDateString()} | Total Records: ${incomeExpData.length}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Account</th>
              <th style="width: 45%;">Category Name</th>
              <th style="width: 20%;">Actual Amount</th>
              <th style="width: 20%;">Category Code</th>
            </tr>
          </thead>
          <tbody>
            ${incomeData.length > 0 ? `
              <tr class="section-header">
                <td colspan="4">INCOME</td>
              </tr>
              ${generateTableRows(incomeData)}
              <tr class="total-row">
                <td colspan="2" style="padding: 8px; border: 1px solid #ddd;">Total Income</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(incomeTotal)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;"></td>
              </tr>
            ` : ''}
            
            ${expenditureData.length > 0 ? `
              <tr class="section-header">
                <td colspan="4">EXPENDITURE</td>
              </tr>
              ${generateTableRows(expenditureData)}
              <tr class="total-row">
                <td colspan="2" style="padding: 8px; border: 1px solid #ddd;">Total Expenditure</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(expenditureTotal)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;"></td>
              </tr>
            ` : ''}
            
            <tr class="net-total">
              <td colspan="2" style="padding: 8px; border: 1px solid #7A0000;">NET TOTAL</td>
              <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">${formatNumber(netTotal)}</td>
              <td style="padding: 8px; border: 1px solid #7A0000;"></td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleDateString()} | CEB@2025</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  // Income & Expenditure Modal Component
  const IncomeExpenditureModal = () => {
    if (!incomeExpModalOpen || !selectedCompany) return null;
    
    const incomeData = incomeExpData.filter(item => item.CatFlag === 'I');
    const expenditureData = incomeExpData.filter(item => item.CatFlag === 'E');
    const { incomeTotal, expenditureTotal, netTotal } = calculateTotals();

    return (
      <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
        <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4">
          <div className="p-5 border-b">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">
                  REGION INCOME & EXPENDITURE - {getMonthName(selectedMonth).toUpperCase()} {selectedYear}
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
                  <Download className="w-3 h-3" /> Export CSV
                </button>
                <button
                  onClick={printPDF}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 text-xs"
                >
                  <Printer className="w-3 h-3" /> Print PDF
                </button>
              </div>
            </div>
            {incomeExpError && (
              <div className="text-red-600 text-xs mt-2 text-center">
                {incomeExpError.includes("JSON.parse") ? "Data format error" : incomeExpError}
              </div>
            )}
          </div>
          <div className="px-6 py-5 overflow-y-auto flex-grow">
            {incomeExpLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mr-3"></div>
                <span className={`${maroon} text-sm`}>Loading income & expenditure data...</span>
              </div>
            ) : incomeExpData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Financial Data Available</h3>
                <p className="text-gray-500 text-center max-w-md">
                  We couldn't find any income or expenditure records for <strong>{selectedCompany.CompName}</strong> in {getMonthName(selectedMonth)} {selectedYear}.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Try selecting a different month or year, or contact your administrator if you believe this is an error.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className={`${maroonBg} text-white`}>
                      <th className="px-2 py-1 text-left">Title Code</th>
                      <th className="px-2 py-1 text-left">Account</th>
                      <th className="px-2 py-1 text-left">Category Name</th>
                      <th className="px-2 py-1 text-left">Category Code</th>
                      <th className="px-2 py-1 text-right">Actual Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Income Section */}
                    {incomeData.length > 0 && (
                      <>
                        <tr className="category-header">
                          <td colSpan={5} className="text-center font-bold bg-gray-100 text-[#7A0000]">
                            INCOME
                          </td>
                        </tr>
                        {incomeData.map((item, index) => (
                          <tr key={`income-${index}`} className="border-b hover:bg-gray-50">
                            <td className="px-2 py-1 font-mono">{item.TitleCd?.trim()}</td>
                            <td className="px-2 py-1 font-mono">{item.Account?.trim()}</td>
                            <td className="px-2 py-1">{item.CatName?.trim()}</td>
                            <td className="px-2 py-1 font-mono">{item.CatCode?.trim()}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(item.Actual)}</td>
                          </tr>
                        ))}
                        <tr className="category-total">
                          <td colSpan={4} className="px-2 py-1 font-bold bg-gray-100">TOTAL INCOME</td>
                          <td className="px-2 py-1 text-right font-mono bg-gray-100">
                            {formatNumber(incomeTotal)}
                          </td>
                        </tr>
                      </>
                    )}
                    
                    {/* Expenditure Section */}
                    {expenditureData.length > 0 && (
                      <>
                        <tr className="category-header">
                          <td colSpan={5} className="text-center font-bold bg-gray-100 text-[#7A0000]">
                            EXPENDITURE
                          </td>
                        </tr>
                        {expenditureData.map((item, index) => (
                          <tr key={`exp-${index}`} className="border-b hover:bg-gray-50">
                            <td className="px-2 py-1 font-mono">{item.TitleCd?.trim()}</td>
                            <td className="px-2 py-1 font-mono">{item.Account?.trim()}</td>
                            <td className="px-2 py-1">{item.CatName?.trim()}</td>
                            <td className="px-2 py-1 font-mono">{item.CatCode?.trim()}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(item.Actual)}</td>
                          </tr>
                        ))}
                        <tr className="category-total">
                          <td colSpan={4} className="px-2 py-1 font-bold bg-gray-100">TOTAL EXPENDITURE</td>
                          <td className="px-2 py-1 text-right font-mono bg-gray-100">
                            {formatNumber(expenditureTotal)}
                          </td>
                        </tr>
                      </>
                    )}
                    
                    {/* Net Total */}
                    <tr className="border-t-2 border-gray-800 bg-gray-200 font-bold">
                      <td colSpan={4} className="px-2 py-1">NET TOTAL</td>
                      <td className="px-2 py-1 text-right font-mono">
                        {formatNumber(netTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="p-5 border-t flex justify-center gap-3">
            <button
              onClick={() => {
                setIncomeExpModalOpen(false);
                setShowDateSelection(true);
              }}
              className="flex items-center gap-2 px-4 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Date Selection
            </button>
            <button
              onClick={closeIncomeExpModal}
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
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${maroon}`}>
          Region Income & Expenditure
          <span className="ml-2 text-xs text-gray-500">(Total: {filteredCompanies.length})</span>
        </h2>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400">Last updated: {lastUpdated.toLocaleString()}</p>
        )}
      </div>

      {/* Search Controls */}
      <div className="flex flex-wrap gap-3 justify-end mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            value={searchId}
            placeholder="Search by Company ID"
            onChange={(e) => setSearchId(e.target.value)}
            className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
            autoComplete="off"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            value={searchName}
            placeholder="Search by Company Name"
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
            autoComplete="off"
          />
        </div>
        {(searchId || searchName) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading companies...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && filteredCompanies.length === 0 && (
        <div className="text-gray-600 bg-gray-100 p-4 rounded">No companies found.</div>
      )}

      {/* Table */}
      {!loading && !error && filteredCompanies.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full table-fixed text-left text-gray-700 text-sm">
                <thead className={`${maroonGrad} text-white sticky top-0`}>
                  <tr>
                    <th className="px-4 py-2 w-1/4">Company ID</th>
                    <th className="px-4 py-2 w-1/2">Company Name</th>
                    <th className="px-4 py-2 w-1/4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.map((company, i) => (
                    <tr key={`${company.compId}-${i}`} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 truncate font-mono">{company.compId}</td>
                      <td className="px-4 py-2 truncate">{company.CompName}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleCompanySelect(company)}
                          className={`px-3 py-1 ${maroonGrad} text-white rounded-md text-xs font-medium hover:brightness-110 transition shadow`}
                        >
                          <Eye className="inline-block mr-1 w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-3 mt-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {Math.ceil(filteredCompanies.length / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(filteredCompanies.length / pageSize), p + 1))}
              disabled={page >= Math.ceil(filteredCompanies.length / pageSize)}
              className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Date Selection Modal */}
      {selectedCompany && showDateSelection && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 relative max-h-[90vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${maroon}`}>
                Select Period for {selectedCompany.CompName}
              </h3>
              <button 
                onClick={() => setShowDateSelection(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="w-5 h-5" />
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
                onClick={() => {
                  setSelectedCompany(null);
                  setShowDateSelection(false);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Companies
              </button>
              <button
                onClick={fetchIncomeExpenditureData}
                className="flex items-center gap-2 px-4 py-2 bg-[#7A0000] text-white rounded hover:brightness-110 text-sm"
              >
                View Income & Expenditure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Income & Expenditure Modal */}
      <IncomeExpenditureModal />
    </div>
  );
};

export default RegionExpenditure;