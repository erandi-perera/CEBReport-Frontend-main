import React, { useEffect, useState } from "react";
import { RegionTable, DateSelectionModal, TrialBalanceModal } from "../../components/mainTopics/RegionTrial/test-import";
import { useUser } from "../../contexts/UserContext";

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

const RegionTrial: React.FC = () => {
  // Get user from context
  const { user } = useUser();
  
  // Main state
  const [data, setData] = useState<Region[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filtered, setFiltered] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Date selection modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  // Trial balance modal state
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [trialData, setTrialData] = useState({
    companyId: "",
    year: new Date().getFullYear(),
    month: "January",
    regionName: ""
  });

  // Trial balance table state
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData[]>([]);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  // Get EPF Number from user context (Userno field)
  const epfNo = user?.Userno || "";
  
  // Colors
  const maroon = "text-[#7A0000]";
  const maroonBg = "bg-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  // Fetch regions
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
        const final: Region[] = rawData.map((item: any) => ({
          compId: item.CompId,
          CompName: item.CompName,
        }));
        setData(final);
        setFiltered(final);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [epfNo]);

  // Filter regions
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

  // Open date selection modal
  const viewDetails = (region: Region) => {
    setSelectedRegion(region);
    setModalOpen(true);
  };

  // Close date selection modal
  const closeDateModal = () => {
    setModalOpen(false);
    setSelectedRegion(null);
  };

  // Handle date selection and fetch trial balance
  const handleDateSelection = (year: number, month: string) => {
    if (!selectedRegion) return;
    
    setTrialData({
      companyId: selectedRegion.compId,
      year,
      month,
      regionName: selectedRegion.CompName
    });
    setTrialModalOpen(true);
    setModalOpen(false);
  };

  // Fetch trial balance data
  const fetchTrialBalanceData = async () => {
    if (!trialData.companyId) return;
    
    setTrialLoading(true);
    setTrialError(null);
    try {
      const monthNum = monthToNumber(trialData.month);
      const apiUrl = `/misapi/api/regionwisetrial?companyId=${trialData.companyId}&month=${monthNum}&year=${trialData.year}`;
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
        throw new Error("Unexpected data format received from server");
      }
      
      setTrialBalanceData(trialBalanceArray);
    } catch (error: any) {
      setTrialError(error.message.includes("JSON.parse") ? "Invalid data format received from server" : error.message);
    } finally {
      setTrialLoading(false);
    }
  };

  useEffect(() => {
    if (trialModalOpen && trialData.companyId && trialData.year && trialData.month) {
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

  const getCategory = (accountCode: string): string => {
    const firstChar = accountCode.charAt(0).toUpperCase();
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
      const firstChar = row.AccountCode.charAt(0).toUpperCase();
      if (categories.includes(firstChar)) {
        categoryTotals[firstChar].opening += row.OpeningBalance || 0;
        categoryTotals[firstChar].debit += row.DebitAmount || 0;
        categoryTotals[firstChar].credit += row.CreditAmount || 0;
        categoryTotals[firstChar].closing += row.ClosingBalance || 0;
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

  const downloadAsCSV = () => {
    if (!trialBalanceData || trialBalanceData.length === 0) return;

    const { categoryTotals, grandTotals } = calculateTotals();

    // Sort data by category (A, E, L, R)
    const sortedData = [...trialBalanceData].sort((a, b) => {
      const categoryOrder: { [key: string]: number } = { 'A': 1, 'E': 2, 'L': 3, 'R': 4 };
      const aCat = a.AccountCode.charAt(0).toUpperCase();
      const bCat = b.AccountCode.charAt(0).toUpperCase();
      return (categoryOrder[aCat] || 5) - (categoryOrder[bCat] || 5);
    });

    // Start with header information
    const csvRows = [
      [`REGION WISE TRIAL BALANCE - ${trialData.month.toUpperCase()}/${trialData.year}`],
      [`Region: ${trialData.regionName}`],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [`Total Records: ${trialBalanceData.length}`],
      [''], // Empty row for spacing
      ['Account Code', 'Account Name', 'Title Flag', 'Cost Center', 'Company Name', 'Department ID', 'Opening Balance', 'Debit Amount', 'Credit Amount', 'Closing Balance']
    ];

    // Process data with category grouping
    let currentCategory = '';
    
    sortedData.forEach((row, index) => {
      const rowCategory = getCategory(row.AccountCode);
      const categoryKey = row.AccountCode.charAt(0).toUpperCase();
      
      // Add category header if category changes
      if (rowCategory !== currentCategory) {
        currentCategory = rowCategory;
        csvRows.push([''], [`=== ${rowCategory.toUpperCase()} ===`]);
      }
      
      // Add data row
      csvRows.push([
        row.AccountCode.trim(),
        row.AccountName.trim(),
        row.TitleFlag,
        row.CostCenter,
        row.CompanyName.trim(),
        row.DepartmentId,
        formatNumber(row.OpeningBalance),
        formatNumber(row.DebitAmount),
        formatNumber(row.CreditAmount),
        formatNumber(row.ClosingBalance)
      ]);
      
      // Check if this is the last row of current category
      const nextIndex = index + 1;
      const isLastInCategory = nextIndex >= sortedData.length || 
                              getCategory(sortedData[nextIndex].AccountCode) !== currentCategory;
      
      // Add category total if this is the last row of the category
      if (isLastInCategory && categoryTotals[categoryKey]) {
        csvRows.push([
          `TOTAL ${rowCategory.toUpperCase()}`,
          '', '', '', '', '',
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
        '', '', '', '', '',
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

    // Convert to CSV format
    const csvContent = csvRows.map(row => {
      return row.map(cell => {
        const cellStr = String(cell || '');
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
    link.download = `RegionTrialBalance_${trialData.regionName}_${trialData.month}_${trialData.year}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    if (!trialBalanceData || trialBalanceData.length === 0) return;

    const { categoryTotals, grandTotals } = calculateTotals();

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate table rows HTML
    let tableRowsHTML = '';
    trialBalanceData.forEach((row, index) => {
      const currentCategory = getCategory(row.AccountCode);
      const prevCategory = index > 0 ? getCategory(trialBalanceData[index - 1].AccountCode) : null;
      const showCategoryHeader = currentCategory !== prevCategory;
      const nextCategory = index < trialBalanceData.length - 1 ? getCategory(trialBalanceData[index + 1].AccountCode) : null;
      const showCategoryTotal = currentCategory !== nextCategory;
      
      // Category header
      if (showCategoryHeader) {
        tableRowsHTML += `
          <tr class="category-header">
            <td colspan="10" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000;">${currentCategory}</td>
          </tr>
        `;
      }
      
      // Data row
      tableRowsHTML += `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.AccountCode.trim()}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.AccountName.trim()}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.TitleFlag}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.CostCenter}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.CompanyName.trim()}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.DepartmentId}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.OpeningBalance)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.DebitAmount)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.CreditAmount)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.ClosingBalance)}</td>
        </tr>
      `;
      
      // Category total
      if (showCategoryTotal) {
        const categoryKey = row.AccountCode.charAt(0).toUpperCase();
        tableRowsHTML += `
          <tr class="category-total">
            <td colspan="6" style="padding: 6px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Total ${currentCategory}</td>
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
        <td colspan="6" style="padding: 8px; border: 1px solid #7A0000;">Grand Total</td>
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
        <title>Region Trial Balance - ${trialData.month}/${trialData.year}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 10px;
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
          <h1>REGION WISE TRIAL BALANCE - ${trialData.month.toUpperCase()}/${trialData.year}</h1>
          <h2>Region: ${trialData.regionName}</h2>
          <div class="header-info">
            Generated on: ${new Date().toLocaleDateString()} | Total Records: ${trialBalanceData.length}
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

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
      {/* Region Table Component */}
      <RegionTable
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
        lastUpdated={new Date()}
        searchId={searchId}
        setSearchId={setSearchId}
        searchName={searchName}
        setSearchName={setSearchName}
        clearFilters={clearFilters}
        epfNo={epfNo}
        user={user}
      />
      
      {/* Date Selection Modal */}
      <DateSelectionModal
        modalOpen={modalOpen}
        closeDateModal={closeDateModal}
        selectedRegion={selectedRegion}
        handleDateSelection={handleDateSelection}
        maroon={maroon}
        maroonBg={maroonBg}
      />
      
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
          setModalOpen(true);
        }}
      />
    </div>
  );
};

export default RegionTrial;