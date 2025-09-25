import React, { useEffect, useState } from "react";
import { FaSearch, FaSyncAlt, FaEye, FaTimes } from "react-icons/fa";
import TrialBalanceModal from "../../components/mainTopics/CostCenterTrial/TrialBalanceModal";
import { useUser } from "../../contexts/UserContext";

interface CostCenter {
  compId: string;
  CompName: string;
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

const CostCenterTrial: React.FC = () => {
  // Get user from context
  const { user } = useUser();
  
  // Main state
  const [data, setData] = useState<CostCenter[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filtered, setFiltered] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 9;


  // Selection state
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

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

  // Get EPF Number from user context (Userno field)
  const epfNo = user?.Userno || "";
  
  // Debug log to see what EPF number is being used
  useEffect(() => {
    console.log('Current user:', user);
    console.log('EPF Number being used:', epfNo);
    console.log('User Userno field:', user?.Userno);
  }, [user, epfNo]);

  // Colors
  const maroon = "text-[#7A0000]";
  const maroonBg = "bg-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  // Available years and months
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, ..., 12]

  // Fetch cost centers
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
        
        const txt = await res.text();
        console.log('Raw API response:', txt);
        const parsed = JSON.parse(txt);
        console.log('Parsed API response:', parsed);
        
        // Handle different response structures
        let rawData = [];
        if (Array.isArray(parsed)) {
          rawData = parsed;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          rawData = parsed.data;
        } else if (parsed.result && Array.isArray(parsed.result)) {
          rawData = parsed.result;
        } else if (parsed.CompId) {
          rawData = [parsed];
        }
        
        console.log('Raw data extracted:', rawData);
        
        const final: CostCenter[] = rawData.map((item: any) => ({
          compId: item.CompId || item.compId || item.DeptId || item.deptId || '',
          CompName: item.CompName || item.compName || item.DeptName || item.deptName || '',
        }));
        
        console.log('Final mapped data:', final);
        
        // If no data found, show test data for debugging
        if (final.length === 0) {
          console.log('No data found, showing test data');
          const testData: CostCenter[] = [
            { compId: 'TEST001', CompName: 'Test Division 1' },
            { compId: 'TEST002', CompName: 'Test Division 2' },
            { compId: 'TEST003', CompName: 'Test Division 3' },
          ];
          setData(testData);
          setFiltered(testData);
        } else {
          setData(final);
          setFiltered(final);
        }
      } catch (e: any) {
        console.error('Error fetching data:', e);
        setError(e.message);
        
        // Show test data even on error for debugging
        const testData: CostCenter[] = [
          { compId: 'ERROR001', CompName: 'Error Test Division 1' },
          { compId: 'ERROR002', CompName: 'Error Test Division 2' },
        ];
        setData(testData);
        setFiltered(testData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [epfNo]);

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

  const paginatedCostCenters = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Handle cost center selection
  const handleCostCenterSelect = (costCenter: CostCenter) => {
    console.log('Cost center selected:', costCenter);
    setSelectedCostCenter(costCenter);
    setShowDateSelection(true);
    console.log('Date selection should be visible now');
  };

  // Fetch trial balance data
  const fetchTrialBalanceData = async () => {
    if (!selectedCostCenter) return;
    
    setTrialLoading(true);
    setTrialError(null);
    try {
      const apiUrl = `/misapi/api/trialbalance/${selectedCostCenter.compId}/${selectedYear}/${selectedMonth}`;
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
      if (Array.isArray(jsonData)) trialBalanceArray = jsonData;
      else if (jsonData.data && Array.isArray(jsonData.data)) trialBalanceArray = jsonData.data;
      else if (jsonData.result && Array.isArray(jsonData.result)) trialBalanceArray = jsonData.result;
      else if (jsonData.AcCd) trialBalanceArray = [jsonData];
      setTrialBalanceData(trialBalanceArray);
      
      // Set trial data for modal
      setTrialData({
        costctr: selectedCostCenter.compId,
        year: selectedYear,
        month: getMonthName(selectedMonth),
        deptName: selectedCostCenter.CompName
      });
      
      setTrialModalOpen(true);
      setShowDateSelection(false);
    } catch (error: any) {
      setTrialError(error.message.includes("JSON.parse") ? "Invalid data format received from server" : error.message);
    } finally {
      setTrialLoading(false);
    }
  };

  // Remove the old useEffect since we now call fetchTrialBalanceData directly

  // Helper functions
  const getMonthName = (monthNum: number): string => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthNum - 1] || "";
  };


  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
  };

  const closeTrialModal = () => {
    setTrialModalOpen(false);
    setTrialBalanceData([]);
    setSelectedCostCenter(null);
  };

  const formatNumber = (num: number): string => {
    // Handle undefined, null, or NaN values
    if (num === undefined || num === null || isNaN(num)) return "-";
    
    // Convert to number if it's a string
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    
    // Handle zero values
    if (numValue === 0) return "-";
    
    // Get absolute value for formatting
    const absValue = Math.abs(numValue);
    const formatted = new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(absValue);
    
    // Return negative values in parentheses, positive as normal
    return numValue < 0 ? `(${formatted})` : formatted;
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
    const categoryTotals: Record<string, { opening: number; debit: number; credit: number; closing: number; count: number; }> = {};
    categories.forEach(cat => { categoryTotals[cat] = { opening: 0, debit: 0, credit: 0, closing: 0, count: 0 }; });
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

  // Improved CSV export function
  const downloadAsCSV = () => {
    if (!trialBalanceData || trialBalanceData.length === 0) return;

    // Calculate totals for categories
    const { categoryTotals, grandTotals } = calculateTotals();

    // Sort data by category (A, E, L, R) to match PDF structure
    const sortedData = [...trialBalanceData].sort((a, b) => {
      const categoryOrder: { [key: string]: number } = { 'A': 1, 'E': 2, 'L': 3, 'R': 4 };
      const aCat = a.AcCd.charAt(0).toUpperCase();
      const bCat = b.AcCd.charAt(0).toUpperCase();
      return (categoryOrder[aCat] || 5) - (categoryOrder[bCat] || 5);
    });

    // Start with header information
    const csvRows = [
      [`MONTHLY TRIAL BALANCE - ${trialData.month.toUpperCase()}/${trialData.year}`],
      [`Cost Center: ${trialData.costctr} - ${trialData.deptName}`],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [`Total Records: ${trialBalanceData.length}`],
      [''], // Empty row for spacing
      ['Description/Name', 'Opening Balance', 'Debit Amount', 'Credit Amount', 'Closing Balance'] // Column headers
    ];

    // Process data with category grouping
    let currentCategory = '';
    
    sortedData.forEach((row, index) => {
      const rowCategory = getCategory(row.AcCd);
      const categoryKey = row.AcCd.charAt(0).toUpperCase();
      
      // Add category header if category changes
      if (rowCategory !== currentCategory) {
        currentCategory = rowCategory;
        csvRows.push([''], [`=== ${rowCategory.toUpperCase()} ===`]); // Category separator
      }
      
      // Add data row
      csvRows.push([
        row.GlName.trim(),
        formatNumber(row.OpSbal),
        formatNumber(row.DrSamt),
        formatNumber(row.CrSamt),
        formatNumber(row.ClSbal)
      ]);
      
      // Check if this is the last row of current category
      const nextIndex = index + 1;
      const isLastInCategory = nextIndex >= sortedData.length || 
                              getCategory(sortedData[nextIndex].AcCd) !== currentCategory;
      
      // Add category total if this is the last row of the category
      if (isLastInCategory && categoryTotals[categoryKey]) {
        csvRows.push([
          `TOTAL ${rowCategory.toUpperCase()}`,
          formatNumber(categoryTotals[categoryKey].opening),
          formatNumber(categoryTotals[categoryKey].debit),
          formatNumber(categoryTotals[categoryKey].credit),
          formatNumber(categoryTotals[categoryKey].closing)
        ]);
        csvRows.push(['']); // Empty row after category total
      }
    });

    // Add grand total
    csvRows.push(
      [''], // Extra spacing before grand total
      ['=== GRAND TOTAL ==='],
      [
        'GRAND TOTAL',
        formatNumber(grandTotals.opening),
        formatNumber(grandTotals.debit),
        formatNumber(grandTotals.credit),
        formatNumber(grandTotals.closing)
      ]
    );

    // Add footer information
    csvRows.push(
      [''],
      [`Report generated on: ${new Date().toLocaleDateString()} | CEB@2025`]
    );

    // Convert to CSV format with proper escaping
    const csvContent = csvRows.map(row => {
      // Handle rows with different lengths and escape commas in content
      return row.map(cell => {
        const cellStr = String(cell || '');
        // If cell contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',');
    }).join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TrialBalance_${trialData.costctr}_${trialData.month}_${trialData.year}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    if (!trialBalanceData || trialBalanceData.length === 0) return;

    // Calculate totals for the print
    const { categoryTotals, grandTotals } = calculateTotals();

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate table rows HTML
    let tableRowsHTML = '';
    trialBalanceData.forEach((row, index) => {
      const currentCategory = getCategory(row.AcCd);
      const prevCategory = index > 0 ? getCategory(trialBalanceData[index - 1].AcCd) : null;
      const showCategoryHeader = currentCategory !== prevCategory;
      const nextCategory = index < trialBalanceData.length - 1 ? getCategory(trialBalanceData[index + 1].AcCd) : null;
      const showCategoryTotal = currentCategory !== nextCategory;
      
      // Category header
      if (showCategoryHeader) {
        tableRowsHTML += `
          <tr class="category-header">
            <td colspan="5" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000;">${currentCategory}</td>
          </tr>
        `;
      }
      
      // Data row
      tableRowsHTML += `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.GlName.trim()}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.OpSbal)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.DrSamt)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.CrSamt)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.ClSbal)}</td>
        </tr>
      `;
      
      // Category total
      if (showCategoryTotal) {
        const categoryKey = row.AcCd.charAt(0).toUpperCase();
        tableRowsHTML += `
          <tr class="category-total">
            <td style="padding: 6px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Total ${currentCategory}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(categoryTotals[categoryKey].opening)}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(categoryTotals[categoryKey].debit)}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(categoryTotals[categoryKey].credit)}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(categoryTotals[categoryKey].closing)}</td>
          </tr>
        `;
      }
    });

    // Add Grand Total row at the end of tbody
    tableRowsHTML += `
      <tr style="background-color: #7A0000; color: white; font-weight: bold;">
        <td style="padding: 8px; border: 1px solid #7A0000;">Grand Total</td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">${formatNumber(grandTotals.opening)}</td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">${formatNumber(grandTotals.debit)}</td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">${formatNumber(grandTotals.credit)}</td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">${formatNumber(grandTotals.closing)}</td>
      </tr>
    `;

    // Create the HTML content for printing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trial Balance - ${trialData.month}/${trialData.year}</title>
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
          <h1>MONTHLY TRIAL BALANCE - ${trialData.month.toUpperCase()}/${trialData.year}</h1>
          <h2>Cost Center: ${trialData.costctr} - ${trialData.deptName}</h2>
          <div class="header-info">
            Generated on: ${new Date().toLocaleDateString()} | Total Records: ${trialBalanceData.length}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 40%;">Description/Name</th>
              <th style="width: 15%;">Opening Balance</th>
              <th style="width: 15%;">Debit Amount</th>
              <th style="width: 15%;">Credit Amount</th>
              <th style="width: 15%;">Closing Balance</th>
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

  // Date Selection Modal
  const DateSelectionModal = () => {
    console.log('DateSelectionModal render - selectedCostCenter:', selectedCostCenter, 'showDateSelection:', showDateSelection);
    if (!selectedCostCenter || !showDateSelection) return null;

    return (
      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-end z-[9999] p-4 backdrop-blur-sm">
        <div className="bg-white w-80 rounded-lg shadow-2xl border border-gray-200 relative max-h-[60vh] overflow-y-auto mr-8">
          {/* Header with Work In Progress style */}
          <div className="flex items-center w-full p-4 border-b border-gray-200 relative">
            <div className="flex-shrink-0 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-5 w-5 text-[#800000] transition-transform duration-300 rotate-180">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"></path>
              </svg>
            </div>
            <div className="text-sm text-[#800000] tracking-wide">Select Period - {selectedCostCenter.CompName}</div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#800000]/20 rounded-l-full"></div>
            <button
              onClick={() => setShowDateSelection(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4">
         
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 max-h-32 overflow-y-auto mb-3">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`text-xs py-0.5 px-1 rounded cursor-pointer border transition-colors duration-150
                  ${selectedYear === year
                    ? "bg-[#7A0000] text-white border-[#7A0000]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
              {months.map((month) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`text-xs py-1 px-1 rounded cursor-pointer border transition-colors duration-150
                  ${selectedMonth === month
                    ? "bg-[#7A0000] text-white border-[#7A0000]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {getMonthName(month)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowDateSelection(false)}
              className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={fetchTrialBalanceData}
              disabled={trialLoading}
              className={`px-2 py-1 text-xs ${maroonBg} text-white rounded hover:brightness-110 disabled:opacity-50`}
            >
              {trialLoading ? "Loading..." : "View"}
            </button>
          </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className={`text-xl font-bold ${maroon}`}>
            Cost Center Trial Balance
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
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
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading cost centers...</p>
        </div>
      )}


      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-gray-600 bg-gray-100 p-4 rounded">No cost centers found.</div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full table-fixed text-left text-gray-700 text-sm">
                <thead className={`${maroonGrad} text-white sticky top-0`}>
                  <tr>
                    <th className="px-4 py-2 w-1/4">Cost Center Code</th>
                    <th className="px-4 py-2 w-1/2">Cost Center Name</th>
                    <th className="px-4 py-2 w-1/4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCostCenters.map((costCenter, i) => (
                    <tr key={`${costCenter.compId}-${i}`} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 truncate font-mono">{costCenter.compId}</td>
                      <td className="px-4 py-2 truncate">{costCenter.CompName}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleCostCenterSelect(costCenter)}
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

      {/* Date Selection Modal */}
      <DateSelectionModal />

      {/* Trial Balance Modal */}
      <TrialBalanceModal
        trialModalOpen={trialModalOpen}
        closeTrialModal={closeTrialModal}
        trialData={trialData}
        trialBalanceData={trialBalanceData}
        trialLoading={trialLoading}
        trialError={trialError}
        maroon={maroon}
        maroonBg={maroonBg}
        formatNumber={formatNumber}
        getCategory={getCategory}
        calculateTotals={calculateTotals}
        downloadAsCSV={downloadAsCSV}
        printPDF={printPDF}
        goBack={() => {
          setTrialModalOpen(false);
          setShowDateSelection(true);
        }}
      />
    </div>
  );
};

export default CostCenterTrial;