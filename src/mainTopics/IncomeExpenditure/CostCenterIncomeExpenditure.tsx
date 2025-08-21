import React, { useEffect, useState } from "react";
import { Search, RotateCcw, Eye, X, Download, Printer } from "lucide-react";
import { useUser } from "../../contexts/UserContext";

interface Department {
  DeptId: string;
  DeptName: string;
}

interface IncomeExpenditureData {
  CatFlag: string;
  TitleCode: string;
  CatCode: string;
  AcCd: string;
  CatName: string;
  TotalBudget: number;
  Clbal: number;
  Varience: number;
  CctName: string;
}

const CostCenterIncomeExpenditure: React.FC = () => {
  // Get user from context
  const { user } = useUser();
  
  // Main state
  const [data, setData] = useState<Department[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filtered, setFiltered] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  // Selection state
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // Income & Expenditure modal state
  const [incomeExpModalOpen, setIncomeExpModalOpen] = useState(false);
  const [incomeExpData, setIncomeExpData] = useState<IncomeExpenditureData[]>([]);
  const [incomeExpLoading, setIncomeExpLoading] = useState(false);
  const [incomeExpError, setIncomeExpError] = useState<string | null>(null);

  // Get EPF Number from user context (Userno field)
  const epfNo = user?.Userno || "";
  
  // Debug log to see what EPF number is being used
  useEffect(() => {
    console.log('Current user:', user);
    console.log('EPF Number being used:', epfNo);
  }, [user, epfNo]);

  // Colors
  const maroon = "text-[#7A0000]";
  const maroonBg = "bg-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  // Available years and months
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Paginated departments
  const paginatedDepartments = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Fetch departments
  useEffect(() => {
    const fetchData = async () => {
      // Don't fetch if no EPF number
      if (!epfNo) {
        setError("No EPF number available. Please login again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/misapi/api/incomeexpenditure/departments/${epfNo}`);
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
        } else if (parsed.result && Array.isArray(parsed.result)) {
          rawData = parsed.result;
        } else if (parsed.departments && Array.isArray(parsed.departments)) {
          rawData = parsed.departments;
        } else {
          console.log('Unexpected response structure:', parsed);
          rawData = [];
        }
        
        const final: Department[] = rawData.map((item: any) => ({
          DeptId: item.DeptId?.toString() || item.deptId?.toString() || "",
          DeptName: item.DeptName?.toString().trim() || item.deptName?.toString().trim() || "",
        }));
        
        setData(final);
        setFiltered(final);
        setLastUpdated(new Date());
      } catch (e: any) {
        console.error('API Error:', e);
        setError(e.message.includes("JSON.parse") ? "Invalid data format received from server. Please check if the API is returning valid JSON." : e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [epfNo]);

  // Filter departments - simplified without debouncing
  useEffect(() => {
    const f = data.filter(
      (d) =>
        (!searchId || d.DeptId.toLowerCase().includes(searchId.toLowerCase())) &&
        (!searchName || d.DeptName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFiltered(f);
    setPage(1);
  }, [searchId, searchName, data]);

  // Fetch income & expenditure data
  const fetchIncomeExpenditureData = async () => {
    if (!selectedDepartment) return;
    
    setIncomeExpLoading(true);
    setIncomeExpError(null);
    try {
      const apiUrl = `/misapi/api/incomeexpenditure/${selectedDepartment.DeptId}/${selectedYear}/${selectedMonth}`;
      
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
      let incomeExpArray: IncomeExpenditureData[] = [];
      
      if (Array.isArray(jsonData)) {
        incomeExpArray = jsonData;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        incomeExpArray = jsonData.data;
      } else if (jsonData.result && Array.isArray(jsonData.result)) {
        incomeExpArray = jsonData.result;
      } else {
        incomeExpArray = [jsonData];
      }
      
      setIncomeExpData(incomeExpArray);
      setIncomeExpModalOpen(true);
      setShowDateSelection(false);
    } catch (error: any) {
      setIncomeExpError(error.message.includes("JSON.parse") ? "Invalid data format received from server" : error.message);
    } finally {
      setIncomeExpLoading(false);
    }
  };

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    setShowDateSelection(true);
  };

  const closeIncomeExpModal = () => {
    setIncomeExpModalOpen(false);
    setIncomeExpData([]);
    setSelectedDepartment(null);
  };

  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
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

  // Escape CSV field function
  const escapeCSVField = (field: string | number): string => {
    const stringField = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return '"' + stringField.replace(/"/g, '""') + '"';
    }
    return stringField;
  };

  // Improved Download as CSV function
  const downloadAsCSV = () => {
    if (!incomeExpData || incomeExpData.length === 0) return;
    
    // Create headers
    const headers = [
      "Category Flag", "Title Code", "Category Code", "Account Code", 
      "Category Name", "Total Budget", "Closing Balance", "Variance"
    ];
    
    // Create data rows with proper CSV formatting
    const dataRows = incomeExpData.map(item => [
      escapeCSVField(item.CatFlag),
      escapeCSVField(item.TitleCode.trim()),
      escapeCSVField(item.CatCode.trim()),
      escapeCSVField(item.AcCd.trim()),
      escapeCSVField(item.CatName.trim()),
      escapeCSVField(formatNumber(item.TotalBudget)),
      escapeCSVField(formatNumber(item.Clbal)),
      escapeCSVField(formatNumber(item.Varience))
    ]);
    
    // Add summary rows
    const incomeData = incomeExpData.filter(item => item.CatFlag === "I");
    const expenditureData = incomeExpData.filter(item => item.CatFlag === "X");
    
    const summaryRows = [];
    
    // Add empty row separator
    summaryRows.push(["", "", "", "", "", "", "", ""]);
    
    // Income total
    if (incomeData.length > 0) {
      summaryRows.push([
        "", "", "", "", 
        "TOTAL INCOME",
        escapeCSVField(formatNumber(incomeData.reduce((sum, item) => sum + item.TotalBudget, 0))),
        escapeCSVField(formatNumber(incomeData.reduce((sum, item) => sum + item.Clbal, 0))),
        escapeCSVField(formatNumber(incomeData.reduce((sum, item) => sum + item.Varience, 0)))
      ]);
    }
    
    // Expenditure total
    if (expenditureData.length > 0) {
      summaryRows.push([
        "", "", "", "", 
        "TOTAL EXPENDITURES",
        escapeCSVField(formatNumber(expenditureData.reduce((sum, item) => sum + item.TotalBudget, 0))),
        escapeCSVField(formatNumber(expenditureData.reduce((sum, item) => sum + item.Clbal, 0))),
        escapeCSVField(formatNumber(expenditureData.reduce((sum, item) => sum + item.Varience, 0)))
      ]);
    }
    
    // Net total
    summaryRows.push([
      "", "", "", "", 
      "NET TOTAL",
      escapeCSVField(formatNumber(
        incomeData.reduce((sum, item) => sum + item.TotalBudget, 0) +
        expenditureData.reduce((sum, item) => sum + item.TotalBudget, 0)
      )),
      escapeCSVField(formatNumber(
        incomeData.reduce((sum, item) => sum + item.Clbal, 0) + 
        expenditureData.reduce((sum, item) => sum + item.Clbal, 0)
      )),
      escapeCSVField(formatNumber(
        incomeData.reduce((sum, item) => sum + item.Varience, 0) +
        expenditureData.reduce((sum, item) => sum + item.Varience, 0)
      ))
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...dataRows.map(row => row.join(",")),
      ...summaryRows.map(row => row.join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `IncomeExpenditure_${selectedDepartment?.DeptId}_${getMonthName(selectedMonth)}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print PDF function
  const printPDF = () => {
    if (!incomeExpData || incomeExpData.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate table rows HTML
    let tableRowsHTML = '';
    
    // Income section
    const incomeData = incomeExpData.filter(item => item.CatFlag === "I");
    if (incomeData.length > 0) {
      tableRowsHTML += `
        <tr class="category-header">
          <td colspan="8" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000;">INCOME</td>
        </tr>
      `;
      
      incomeData.forEach((item) => {
        tableRowsHTML += `
          <tr>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${item.CatFlag}</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${item.TitleCode.trim()}</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${item.CatCode.trim()}</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${item.AcCd.trim()}</td>
            <td style="padding: 6px; border: 1px solid #ddd;">${item.CatName.trim()}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(item.TotalBudget)}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(item.Clbal)}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(item.Varience)}</td>
          </tr>
        `;
      });
      
      // Income total
      const incomeTotal = incomeData.reduce((sum, item) => sum + item.Clbal, 0);
      tableRowsHTML += `
        <tr class="category-total">
          <td colspan="5" style="padding: 6px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">TOTAL INCOME</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">
            ${formatNumber(incomeData.reduce((sum, item) => sum + item.TotalBudget, 0))}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">
            ${formatNumber(incomeTotal)}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">
            ${formatNumber(incomeData.reduce((sum, item) => sum + item.Varience, 0))}
          </td>
        </tr>
      `;
    }
    
    // Expenditure section
    const expenditureData = incomeExpData.filter(item => item.CatFlag === "X");
    if (expenditureData.length > 0) {
      tableRowsHTML += `
        <tr class="category-header">
          <td colspan="8" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000;">EXPENDITURES</td>
        </tr>
      `;
      
      expenditureData.forEach((item) => {
        tableRowsHTML += `
          <tr>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${item.CatFlag}</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${item.TitleCode.trim()}</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${item.CatCode.trim()}</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${item.AcCd.trim()}</td>
            <td style="padding: 6px; border: 1px solid #ddd;">${item.CatName.trim()}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(item.TotalBudget)}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(item.Clbal)}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(item.Varience)}</td>
          </tr>
        `;
      });
      
      // Expenditure total
      const expenditureTotal = expenditureData.reduce((sum, item) => sum + item.Clbal, 0);
      tableRowsHTML += `
        <tr class="category-total">
          <td colspan="5" style="padding: 6px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">TOTAL EXPENDITURES</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">
            ${formatNumber(expenditureData.reduce((sum, item) => sum + item.TotalBudget, 0))}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">
            ${formatNumber(expenditureTotal)}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">
            ${formatNumber(expenditureData.reduce((sum, item) => sum + item.Varience, 0))}
          </td>
        </tr>
      `;
    }
    
    // Net total
    const netTotal = (incomeData.reduce((sum, item) => sum + item.Clbal, 0) + 
                    expenditureData.reduce((sum, item) => sum + item.Clbal, 0));
    tableRowsHTML += `
      <tr style="background-color: #7A0000; color: white; font-weight: bold;">
        <td colspan="5" style="padding: 8px; border: 1px solid #7A0000;">NET TOTAL</td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">
          ${formatNumber(
            incomeData.reduce((sum, item) => sum + item.TotalBudget, 0) +
            expenditureData.reduce((sum, item) => sum + item.TotalBudget, 0)
          )}
        </td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">
          ${formatNumber(netTotal)}
        </td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">
          ${formatNumber(
            incomeData.reduce((sum, item) => sum + item.Varience, 0) +
            expenditureData.reduce((sum, item) => sum + item.Varience, 0)
          )}
        </td>
      </tr>
    `;

    // Create the HTML content for printing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Income & Expenditure - ${getMonthName(selectedMonth)} ${selectedYear}</title>
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
          <h1>COST CENTER INCOME & EXPENDITURE - ${getMonthName(selectedMonth).toUpperCase()} ${selectedYear}</h1>
          <h2>Department: ${selectedDepartment?.DeptId} - ${selectedDepartment?.DeptName}</h2>
          <div class="header-info">
            Generated on: ${new Date().toLocaleDateString()} | Total Records: ${incomeExpData.length}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">Flag</th>
              <th style="width: 10%;">Title Code</th>
              <th style="width: 10%;">Category Code</th>
              <th style="width: 10%;">Account Code</th>
              <th style="width: 25%;">Category Name</th>
              <th style="width: 10%;">Budget</th>
              <th style="width: 15%;">Closing Balance</th>
              <th style="width: 15%;">Variance</th>
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

  // Income & Expenditure Modal Component
  const IncomeExpenditureModal = () => {
    if (!incomeExpModalOpen || !selectedDepartment) return null;
    
    // Separate income and expenditure data
    const incomeData = incomeExpData.filter(item => item.CatFlag === "I");
    const expenditureData = incomeExpData.filter(item => item.CatFlag === "X");
    
    // Calculate totals
    const incomeTotal = incomeData.reduce((sum, item) => sum + item.Clbal, 0);
    const expenditureTotal = expenditureData.reduce((sum, item) => sum + item.Clbal, 0);
    const netTotal = incomeTotal + expenditureTotal;

    return (
      <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
        <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4">
          <div className="p-5 border-b">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">
                  COST CENTER INCOME & EXPENDITURE - {getMonthName(selectedMonth).toUpperCase()} {selectedYear}
                </h2>
                <h3 className={`text-sm ${maroon}`}>
                  Department: {selectedDepartment.DeptId} - {selectedDepartment.DeptName}
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
                  We couldn't find any income or expenditure records for <strong>{selectedDepartment.DeptName}</strong> in {getMonthName(selectedMonth)} {selectedYear}.
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
                      <th className="px-2 py-1 text-center">Flag</th>
                      <th className="px-2 py-1 text-left">Title Code</th>
                      <th className="px-2 py-1 text-left">Category Code</th>
                      <th className="px-2 py-1 text-left">Account Code</th>
                      <th className="px-2 py-1 text-left">Category Name</th>
                      <th className="px-2 py-1 text-right">Budget</th>
                      <th className="px-2 py-1 text-right">Closing</th>
                      <th className="px-2 py-1 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Income Section */}
                    {incomeData.length > 0 && (
                      <>
                        <tr className="category-header">
                          <td colSpan={8} className="text-center font-bold bg-gray-100 text-[#7A0000]">
                            INCOME
                          </td>
                        </tr>
                        {incomeData.map((item, index) => (
                          <tr key={`income-${index}`} className="border-b hover:bg-gray-50">
                            <td className="px-2 py-1 text-center">{item.CatFlag}</td>
                            <td className="px-2 py-1 font-mono">{item.TitleCode.trim()}</td>
                            <td className="px-2 py-1 font-mono">{item.CatCode.trim()}</td>
                            <td className="px-2 py-1 font-mono">{item.AcCd.trim()}</td>
                            <td className="px-2 py-1">{item.CatName.trim()}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(item.TotalBudget)}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(item.Clbal)}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(item.Varience)}</td>
                          </tr>
                        ))}
                        <tr className="category-total">
                          <td colSpan={5} className="px-2 py-1 font-bold bg-gray-100">TOTAL INCOME</td>
                          <td className="px-2 py-1 text-right font-mono bg-gray-100">
                            {formatNumber(incomeData.reduce((sum, item) => sum + item.TotalBudget, 0))}
                          </td>
                          <td className="px-2 py-1 text-right font-mono bg-gray-100">
                            {formatNumber(incomeTotal)}
                          </td>
                          <td className="px-2 py-1 text-right font-mono bg-gray-100">
                            {formatNumber(incomeData.reduce((sum, item) => sum + item.Varience, 0))}
                          </td>
                        </tr>
                      </>
                    )}
                    
                    {/* Expenditure Section */}
                    {expenditureData.length > 0 && (
                      <>
                        <tr className="category-header">
                          <td colSpan={8} className="text-center font-bold bg-gray-100 text-[#7A0000]">
                            EXPENDITURES
                          </td>
                        </tr>
                        {expenditureData.map((item, index) => (
                          <tr key={`exp-${index}`} className="border-b hover:bg-gray-50">
                            <td className="px-2 py-1 text-center">{item.CatFlag}</td>
                            <td className="px-2 py-1 font-mono">{item.TitleCode.trim()}</td>
                            <td className="px-2 py-1 font-mono">{item.CatCode.trim()}</td>
                            <td className="px-2 py-1 font-mono">{item.AcCd.trim()}</td>
                            <td className="px-2 py-1">{item.CatName.trim()}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(item.TotalBudget)}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(item.Clbal)}</td>
                            <td className="px-2 py-1 text-right font-mono">{formatNumber(item.Varience)}</td>
                          </tr>
                        ))}
                        <tr className="category-total">
                          <td colSpan={5} className="px-2 py-1 font-bold bg-gray-100">TOTAL EXPENDITURES</td>
                          <td className="px-2 py-1 text-right font-mono bg-gray-100">
                            {formatNumber(expenditureData.reduce((sum, item) => sum + item.TotalBudget, 0))}
                          </td>
                          <td className="px-2 py-1 text-right font-mono bg-gray-100">
                            {formatNumber(expenditureTotal)}
                          </td>
                          <td className="px-2 py-1 text-right font-mono bg-gray-100">
                            {formatNumber(expenditureData.reduce((sum, item) => sum + item.Varience, 0))}
                          </td>
                        </tr>
                      </>
                    )}
                    
                    {/* Net Total */}
                    <tr className="border-t-2 border-gray-800 bg-gray-200 font-bold">
                      <td colSpan={5} className="px-2 py-1">NET TOTAL</td>
                      <td className="px-2 py-1 text-right font-mono">
                        {formatNumber(
                          incomeData.reduce((sum, item) => sum + item.TotalBudget, 0) +
                          expenditureData.reduce((sum, item) => sum + item.TotalBudget, 0)
                        )}
                      </td>
                      <td className="px-2 py-1 text-right font-mono">
                        {formatNumber(netTotal)}
                      </td>
                      <td className="px-2 py-1 text-right font-mono">
                        {formatNumber(
                          incomeData.reduce((sum, item) => sum + item.Varience, 0) +
                          expenditureData.reduce((sum, item) => sum + item.Varience, 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="p-5 border-t flex justify-center">
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
        <div>
          <h2 className={`text-xl font-bold ${maroon}`}>
            Cost Center Income & Expenditure
            <span className="ml-2 text-xs text-gray-500">(Total: {filtered.length})</span>
          </h2>
          {epfNo && (
            <div className="text-xs text-gray-600 mt-1 space-y-1">
              <p>
                EPF Number: <span className="font-mono font-medium">{epfNo}</span>
              </p>
              {user?.Name && (
                <p>
                  User: <span className="font-medium">{user.Name}</span>
                </p>
              )}
            </div>
          )}
        </div>
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
            placeholder="Search by Dept ID"
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
            placeholder="Search by Name"
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
          <p className="mt-2 text-gray-600">Loading departments...</p>
        </div>
      )}

      {/* No EPF Number State */}
      {!loading && !epfNo && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Authentication Required</h3>
          <p className="text-gray-500 text-center max-w-md">
            No EPF number available. Please <strong>login again</strong> to access this feature.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && epfNo && filtered.length === 0 && (
        <div className="text-gray-600 bg-gray-100 p-4 rounded">No departments found.</div>
      )}

      {/* Table */}
      {!loading && !error && epfNo && filtered.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full table-fixed text-left text-gray-700 text-sm">
                <thead className={`${maroonGrad} text-white sticky top-0`}>
                  <tr>
                    <th className="px-4 py-2 w-1/4">Department ID</th>
                    <th className="px-4 py-2 w-1/2">Department Name</th>
                    <th className="px-4 py-2 w-1/4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDepartments.map((department, i) => (
                    <tr key={`${department.DeptId}-${i}`} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 truncate font-mono">{department.DeptId}</td>
                      <td className="px-4 py-2 truncate">{department.DeptName}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDepartmentSelect(department)}
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

      {/* Date Selection Modal */}
      {selectedDepartment && showDateSelection && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 relative max-h-[90vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${maroon}`}>
                Select Period for {selectedDepartment.DeptName}
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
                onClick={() => setShowDateSelection(false)}
                className="bg-gray-500 text-white py-2 px-6 rounded hover:brightness-110 text-sm"
              >
                Back
              </button>
              <button
                onClick={fetchIncomeExpenditureData}
                className="bg-[#7A0000] text-white py-2 px-6 rounded hover:brightness-110 text-sm"
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

export default CostCenterIncomeExpenditure;