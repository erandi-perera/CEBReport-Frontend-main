import React, { useEffect, useState } from "react";
import CostCenterTable from "../../components/mainTopics/CostCenterTrial/CostCenterTable";
import DepartmentModal from "../../components/mainTopics/CostCenterTrial/DepartmentModal";
import TrialBalanceModal from "../../components/mainTopics/CostCenterTrial/TrialBalanceModal";
import { useUser } from "../../contexts/UserContext";

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

  // Get EPF Number from user context (Userno field)
  const epfNo = user?.Userno || "";
  
  // Debug log to see what EPF number is being used
  useEffect(() => {
    console.log('Current user:', user);
    console.log('EPF Number being used:', epfNo);
    
    // Test formatNumber function with various values
    console.log('Testing formatNumber:');
    console.log('formatNumber(-5000):', formatNumber(-5000));
    console.log('formatNumber(-2500.75):', formatNumber(-2500.75));
    console.log('formatNumber(1500.50):', formatNumber(1500.50));
    console.log('formatNumber(0):', formatNumber(0));
  }, [user, epfNo]);

  // Colors
  const maroon = "text-[#7A0000]";
  const maroonBg = "bg-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

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
        const res = await fetch(`/misapi/api/incomeexpenditure/Usercompanies/${epfNo}/70`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
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
    } catch (error: any) {
      setTrialError(error.message.includes("JSON.parse") ? "Invalid data format received from server" : error.message);
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

  const formatNumber = (num: number): string => {
    // Handle undefined, null, or NaN values
    if (num === undefined || num === null || isNaN(num)) return "0.00";
    
    // Convert to number if it's a string
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    
    // Handle zero values
    if (numValue === 0) return "0.00";
    
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

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
      <CostCenterTable
        filtered={filtered}
        paginated={paginated}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        maroon={maroon}
        maroonGrad={maroonGrad}
        viewDetails={viewDetails}
        loading={loading}
        error={error}
        lastUpdated={lastUpdated}
        searchId={searchId}
        setSearchId={setSearchId}
        searchName={searchName}
        setSearchName={setSearchName}
        clearFilters={clearFilters}
        epfNo={epfNo}
        user={user}
      />
      <DepartmentModal
        modalOpen={modalOpen}
        closeDepartmentModal={closeDepartmentModal}
        selectedCompName={selectedCompName}
        departments={departments}
        deptLoading={deptLoading}
        handleSelection={handleSelection}
        maroon={maroon}
        maroonBg={maroonBg}
      />
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
          setModalOpen(true);
        }}
      />
    </div>
  );
};

export default CostCenterTrial;