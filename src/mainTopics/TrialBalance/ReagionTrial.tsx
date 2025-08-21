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

  // Enhanced CSV export function
  const downloadAsCSV = () => {
    if (!trialBalanceData || trialBalanceData.length === 0) {
      alert("No data available to export");
      return;
    }

    // Calculate totals for categories
    const { categoryTotals, grandTotals } = calculateTotals();
    const currentDate = new Date();
    const timestamp = currentDate.toLocaleDateString('en-GB').replace(/\//g, '-');
    const timeStamp = currentDate.toLocaleTimeString('en-GB', { hour12: false });

    // Helper function to escape CSV values
    const escapeCSVValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      const strValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n') || strValue.includes('\r')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    };

    // Sort data by category (A, E, L, R) to match PDF structure
    const sortedData = [...trialBalanceData].sort((a, b) => {
      const categoryOrder: { [key: string]: number } = { 'A': 1, 'E': 2, 'L': 3, 'R': 4 };
      const aCat = a.AcCd.charAt(0).toUpperCase();
      const bCat = b.AcCd.charAt(0).toUpperCase();
      return (categoryOrder[aCat] || 5) - (categoryOrder[bCat] || 5);
    });

    // Build CSV content array
    const csvLines: string[] = [];
    
    // Header section
    csvLines.push('MONTHLY TRIAL BALANCE REPORT');
    csvLines.push('============================');
    csvLines.push('');
    csvLines.push(`Report Title:,MONTHLY TRIAL BALANCE - ${trialData.month.toUpperCase()}/${trialData.year}`);
    csvLines.push(`Cost Center:,${trialData.costctr}`);
    csvLines.push(`Department:,${escapeCSVValue(trialData.deptName)}`);
    csvLines.push(`Period:,${trialData.month} ${trialData.year}`);
    csvLines.push(`Generated Date:,${timestamp}`);
    csvLines.push(`Generated Time:,${timeStamp}`);
    csvLines.push(`Total Records:,${trialBalanceData.length}`);
    csvLines.push(`Generated By:,${escapeCSVValue(user?.Name || 'System User')}`);
    csvLines.push(`EPF Number:,${epfNo}`);
    csvLines.push('');
    
    // Summary by Category
    csvLines.push('CATEGORY WISE SUMMARY');
    csvLines.push('=====================');
    csvLines.push('');
    csvLines.push([
      'Category',
      'Count',
      'Opening Balance',
      'Debit Amount',
      'Credit Amount',
      'Closing Balance'
    ].map(h => escapeCSVValue(h)).join(','));
    
    // Add category summaries
    const categoryNames = {
      'A': 'Assets',
      'E': 'Expenditure', 
      'L': 'Liabilities',
      'R': 'Revenue'
    };
    
    Object.entries(categoryTotals).forEach(([key, totals]) => {
      if (totals.count > 0) {
        csvLines.push([
          categoryNames[key as keyof typeof categoryNames] || key,
          totals.count.toString(),
          formatNumber(totals.opening),
          formatNumber(totals.debit),
          formatNumber(totals.credit),
          formatNumber(totals.closing)
        ].join(','));
      }
    });
    
    csvLines.push([
      'GRAND TOTAL',
      grandTotals.count.toString(),
      formatNumber(grandTotals.opening),
      formatNumber(grandTotals.debit),
      formatNumber(grandTotals.credit),
      formatNumber(grandTotals.closing)
    ].join(','));
    
    csvLines.push('');
    csvLines.push('DETAILED TRIAL BALANCE');
    csvLines.push('======================');
    csvLines.push('');
    
    // Column headers for detailed data
    const detailHeaders = [
      'S.No',
      'Category',
      'Account Code',
      'Account Description/Name',
      'Title Flag',
      'Opening Balance',
      'Debit Amount',
      'Credit Amount',
      'Closing Balance',
      'Cost Center Name'
    ];
    csvLines.push(detailHeaders.map(h => escapeCSVValue(h)).join(','));
    
    // Process data with category grouping
    let currentCategory = '';
    
    sortedData.forEach((row, index) => {
      const rowCategory = getCategory(row.AcCd);
      const categoryKey = row.AcCd.charAt(0).toUpperCase();
      
      // Add category header if category changes
      if (rowCategory !== currentCategory) {
        currentCategory = rowCategory;
        csvLines.push(''); // Empty line before category
        csvLines.push(`=== ${rowCategory.toUpperCase()} ACCOUNTS ===`);
      }
      
      // Add data row
      const detailRow = [
        (index + 1).toString(),
        rowCategory,
        escapeCSVValue(row.AcCd?.trim() || ''),
        escapeCSVValue(row.GlName?.trim() || ''),
        escapeCSVValue(row.TitleFlag || ''),
        formatNumber(row.OpSbal),
        formatNumber(row.DrSamt),
        formatNumber(row.CrSamt),
        formatNumber(row.ClSbal),
        escapeCSVValue(row.CctName?.trim() || '')
      ];
      csvLines.push(detailRow.join(','));
      
      // Check if this is the last row of current category
      const nextIndex = index + 1;
      const isLastInCategory = nextIndex >= sortedData.length || 
                              getCategory(sortedData[nextIndex].AcCd) !== currentCategory;
      
      // Add category total if this is the last row of the category
      if (isLastInCategory && categoryTotals[categoryKey]) {
        const categoryTotalRow = [
          '',
          `TOTAL ${rowCategory.toUpperCase()}`,
          '',
          `Total for ${rowCategory}`,
          '',
          formatNumber(categoryTotals[categoryKey].opening),
          formatNumber(categoryTotals[categoryKey].debit),
          formatNumber(categoryTotals[categoryKey].credit),
          formatNumber(categoryTotals[categoryKey].closing),
          ''
        ];
        csvLines.push(categoryTotalRow.join(','));
        csvLines.push(''); // Empty row after category total
      }
    });

    // Grand Total section
    csvLines.push('');
    csvLines.push('=== GRAND TOTAL ===');
    const grandTotalRow = [
      '',
      'GRAND TOTAL',
      '',
      'Total for All Categories',
      '',
      formatNumber(grandTotals.opening),
      formatNumber(grandTotals.debit),
      formatNumber(grandTotals.credit),
      formatNumber(grandTotals.closing),
      ''
    ];
    csvLines.push(grandTotalRow.join(','));

    // Footer section
    csvLines.push('');
    csvLines.push('REPORT INFORMATION');
    csvLines.push('==================');
    csvLines.push('');
    csvLines.push(`Export Date:,${timestamp}`);
    csvLines.push(`Export Time:,${timeStamp}`);
    csvLines.push(`System:,CEB Financial System`);
    csvLines.push(`Module:,Trial Balance Management`);
    csvLines.push(`Version:,2025 v1.0`);
    csvLines.push(`Copyright:,CEB@2025 - All Rights Reserved`);
    csvLines.push('');
    csvLines.push('NOTES AND DISCLAIMERS');
    csvLines.push('====================');
    csvLines.push('');
    csvLines.push('Note 1: This is a system generated report.');
    csvLines.push('Note 2: All amounts are in Sri Lankan Rupees (LKR).');
    csvLines.push('Note 3: Negative amounts are shown in parentheses.');
    csvLines.push('Note 4: Opening Balance + Debit - Credit = Closing Balance.');
    csvLines.push('Note 5: Report generated based on data available at the time of export.');
    csvLines.push('');
    csvLines.push('For any queries regarding this report, please contact the Finance Department.');
    
    // Create CSV content
    const csvContent = csvLines.join('\n');
    
    // Create and download file
    const BOM = '\uFEFF'; // UTF-8 BOM for proper Excel display
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TrialBalance_${trialData.costctr}_${trialData.month}_${trialData.year}_${timestamp.replace(/-/g, '')}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Success notification
    console.log('CSV export completed successfully');
  };

  const printPDF = () => {
    if (!trialBalanceData || trialBalanceData.length === 0) return;

    // Calculate totals for the print
    const { categoryTotals, grandTotals } = calculateTotals();

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Sort data by category for consistent display
    const sortedData = [...trialBalanceData].sort((a, b) => {
      const categoryOrder: { [key: string]: number } = { 'A': 1, 'E': 2, 'L': 3, 'R': 4 };
      const aCat = a.AcCd.charAt(0).toUpperCase();
      const bCat = b.AcCd.charAt(0).toUpperCase();
      return (categoryOrder[aCat] || 5) - (categoryOrder[bCat] || 5);
    });

    // Generate table rows HTML
    let tableRowsHTML = '';
    let currentCategory = '';
    
    sortedData.forEach((row, index) => {
      const rowCategory = getCategory(row.AcCd);
      const showCategoryHeader = rowCategory !== currentCategory;
      const nextIndex = index + 1;
      const nextCategory = nextIndex < sortedData.length ? getCategory(sortedData[nextIndex].AcCd) : null;
      const showCategoryTotal = rowCategory !== nextCategory;
      
      // Update current category
      if (showCategoryHeader) {
        currentCategory = rowCategory;
      }
      
      // Category header
      if (showCategoryHeader) {
        tableRowsHTML += `
          <tr class="category-header">
            <td colspan="6" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000; padding: 8px; border: 1px solid #ddd;">${currentCategory.toUpperCase()}</td>
          </tr>
        `;
      }
      
      // Data row
      tableRowsHTML += `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${(row.GlName || '').trim()}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.OpSbal || 0)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.DrSamt || 0)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.CrSamt || 0)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(row.ClSbal || 0)}</td>
        </tr>
      `;
      
      // Category total
      if (showCategoryTotal) {
        const categoryKey = row.AcCd.charAt(0).toUpperCase();
        if (categoryTotals[categoryKey]) {
          tableRowsHTML += `
            <tr class="category-total">
              <td style="padding: 6px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;"></td>
              <td style="padding: 6px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Total ${currentCategory}</td>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(categoryTotals[categoryKey].opening)}</td>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(categoryTotals[categoryKey].debit)}</td>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(categoryTotals[categoryKey].credit)}</td>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(categoryTotals[categoryKey].closing)}</td>
            </tr>
          `;
        }
      }
    });

    // Add Grand Total row at the end of tbody
    tableRowsHTML += `
      <tr style="background-color: #7A0000; color: white; font-weight: bold;">
        <td style="padding: 8px; border: 1px solid #7A0000;"></td>
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
              <th style="width: 8%;">S.No</th>
              <th style="width: 40%;">Description/Name</th>
              <th style="width: 13%;">Opening Balance</th>
              <th style="width: 13%;">Debit Amount</th>
              <th style="width: 13%;">Credit Amount</th>
              <th style="width: 13%;">Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} | CEB@2025 - Financial System</p>
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