import React, { useEffect, useState } from "react";
import { Search, RotateCcw, Eye, X, Download, Printer, ChevronLeft } from "lucide-react";
import { useUser } from "../../contexts/UserContext";

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
  AreaNum: string;
  CctName: string;
  FormattedActual: string;
  IsIncome: boolean;
  IsExpenditure: boolean;
}

const ProvinceExpenditure: React.FC = () => {
  // Get user from context
  const { user } = useUser();
  
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

  // Paginated companies
  const paginatedCompanies = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Fetch companies
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
        const res = await fetch(`/misapi/api/incomeexpenditure/Usercompanies/${epfNo}/60`);
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
  }, [epfNo]);

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

  // Fetch province income & expenditure data
  const fetchProvinceIncomeExpenditureData = async () => {
    if (!selectedCompany) return;
    
    setIncomeExpLoading(true);
    setIncomeExpError(null);
    try {
      const apiUrl = `/misapi/api/provinceincomeexpenditure/${selectedCompany.compId}/${selectedYear}/${selectedMonth}`;
      
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
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthNum - 1] || "";
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return "0.00";
    if (num === 0) return "0.00";
    
    const absNum = Math.abs(num);
    const formatted = new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(absNum);
    
    // Return negative values in parentheses, positive values as is
    return num < 0 ? `(${formatted})` : formatted;
  };

  // Group data by area for tabular display like the trial balance
  const groupDataByArea = () => {
    const grouped: { [key: string]: IncomeExpenditureData[] } = {};
    const areas = new Set<string>();
    
    incomeExpData.forEach(item => {
      const key = `${item.TitleCd}-${item.Account}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
      areas.add(item.AreaNum);
    });
    
    return { grouped, areas: Array.from(areas).sort() };
  };

  // Calculate totals for each area and grand totals
  const calculateTotals = () => {
    const { grouped, areas } = groupDataByArea();
    
    const incomeKeys = Object.keys(grouped).filter(key => grouped[key][0].CatFlag === "I");
    const expenditureKeys = Object.keys(grouped).filter(key => grouped[key][0].CatFlag === "E" || grouped[key][0].CatFlag === "X");
    
    const incomeTotalsByArea: { [area: string]: number } = {};
    const expenditureTotalsByArea: { [area: string]: number } = {};
    
    areas.forEach(area => {
      incomeTotalsByArea[area] = 0;
      expenditureTotalsByArea[area] = 0;
    });
    
    // Calculate income totals
    incomeKeys.forEach(key => {
      const items = grouped[key];
      items.forEach(item => {
        incomeTotalsByArea[item.AreaNum] += item.Actual;
      });
    });
    
    // Calculate expenditure totals
    expenditureKeys.forEach(key => {
      const items = grouped[key];
      items.forEach(item => {
        expenditureTotalsByArea[item.AreaNum] += item.Actual;
      });
    });
    
    const totalIncomeGrand = Object.values(incomeTotalsByArea).reduce((sum, val) => sum + val, 0);
    const totalExpenditureGrand = Object.values(expenditureTotalsByArea).reduce((sum, val) => sum + val, 0);
    const netTotalGrand = totalIncomeGrand - totalExpenditureGrand;
    
    const netTotalsByArea: { [area: string]: number } = {};
    areas.forEach(area => {
      netTotalsByArea[area] = incomeTotalsByArea[area] - expenditureTotalsByArea[area];
    });
    
    return {
      incomeTotalsByArea,
      expenditureTotalsByArea,
      netTotalsByArea,
      totalIncomeGrand,
      totalExpenditureGrand,
      netTotalGrand,
      areas
    };
  };

  // Escape CSV field function
  const escapeCSVField = (field: string | number): string => {
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return '"' + stringField.replace(/"/g, '""') + '"';
    }
    return stringField;
  };

  // Download as CSV function
  const downloadAsCSV = () => {
    if (!incomeExpData || incomeExpData.length === 0) return;
    
    const { grouped, areas } = groupDataByArea();
    const totals = calculateTotals();
    
    const headers = [
      "Account Code", "Description", "Type", ...areas.map(area => `Area ${area}`), "Total"
    ];
    
    const dataRows: string[][] = [];
    
    // Income section
    const incomeKeys = Object.keys(grouped).filter(key => grouped[key][0].CatFlag === "I");
    if (incomeKeys.length > 0) {
      dataRows.push(["", "INCOME", "", ...areas.map(() => ""), ""]);
      
      incomeKeys.forEach(key => {
        const items = grouped[key];
        const firstItem = items[0];
        const row = [
          escapeCSVField(firstItem.Account.trim()),
          escapeCSVField(firstItem.CatName.trim()),
          escapeCSVField("INCOME"),
        ];
        
        areas.forEach(area => {
          const areaItem = items.find(item => item.AreaNum === area);
          row.push(escapeCSVField(formatNumber(areaItem?.Actual || 0)));
        });
        
        const total = items.reduce((sum, item) => sum + item.Actual, 0);
        row.push(escapeCSVField(formatNumber(total)));
        dataRows.push(row);
      });
      
      // Total Income row
      const totalIncomeRow = ["", "TOTAL INCOME", "", 
        ...areas.map(area => escapeCSVField(formatNumber(totals.incomeTotalsByArea[area]))),
        escapeCSVField(formatNumber(totals.totalIncomeGrand))
      ];
      dataRows.push(totalIncomeRow);
    }
    
    // Expenditure section
    const expenditureKeys = Object.keys(grouped).filter(key => grouped[key][0].CatFlag === "E" || grouped[key][0].CatFlag === "X");
    if (expenditureKeys.length > 0) {
      dataRows.push(["", "EXPENDITURES", "", ...areas.map(() => ""), ""]);
      
      expenditureKeys.forEach(key => {
        const items = grouped[key];
        const firstItem = items[0];
        const row = [
          escapeCSVField(firstItem.Account.trim()),
          escapeCSVField(firstItem.CatName.trim()),
          escapeCSVField("EXPENDITURE"),
        ];
        
        areas.forEach(area => {
          const areaItem = items.find(item => item.AreaNum === area);
          row.push(escapeCSVField(formatNumber(areaItem?.Actual || 0)));
        });
        
        const total = items.reduce((sum, item) => sum + item.Actual, 0);
        row.push(escapeCSVField(formatNumber(total)));
        dataRows.push(row);
      });
      
      // Total Expenditure row
      const totalExpenditureRow = ["", "TOTAL EXPENDITURE", "", 
        ...areas.map(area => escapeCSVField(formatNumber(totals.expenditureTotalsByArea[area]))),
        escapeCSVField(formatNumber(totals.totalExpenditureGrand))
      ];
      dataRows.push(totalExpenditureRow);
    }
    
    // Net Total row
    const netTotalRow = ["", "NET TOTAL", "", 
      ...areas.map(area => escapeCSVField(formatNumber(totals.netTotalsByArea[area]))),
      escapeCSVField(formatNumber(totals.netTotalGrand))
    ];
    dataRows.push(netTotalRow);
    
    const csvContent = [
      headers.join(","),
      ...dataRows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ProvinceIncomeExpenditure_${selectedCompany?.compId}_${getMonthName(selectedMonth)}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print PDF function
  const printPDF = () => {
    if (!incomeExpData || incomeExpData.length === 0) return;

    const { grouped, areas } = groupDataByArea();
    const totals = calculateTotals();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableRowsHTML = '';
    
    // Group by income/expenditure
    const incomeKeys = Object.keys(grouped).filter(key => grouped[key][0].CatFlag === "I");
    const expenditureKeys = Object.keys(grouped).filter(key => grouped[key][0].CatFlag === "E" || grouped[key][0].CatFlag === "X");

    // Income section
    if (incomeKeys.length > 0) {
      tableRowsHTML += `
        <tr class="category-header">
          <td colspan="${3 + areas.length}" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000;">INCOME</td>
        </tr>
      `;
      
      incomeKeys.forEach(key => {
        const items = grouped[key];
        const firstItem = items[0];
        tableRowsHTML += `
          <tr>
            <td style="padding: 4px; border: 1px solid #ddd; font-family: monospace; font-size: 10px;">${firstItem.Account.trim()}</td>
            <td style="padding: 4px; border: 1px solid #ddd; font-size: 10px;">${firstItem.CatName.trim()}</td>
        `;
        
        areas.forEach(area => {
          const areaItem = items.find(item => item.AreaNum === area);
          tableRowsHTML += `
            <td style="padding: 4px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-size: 10px;">
              ${formatNumber(areaItem?.Actual || 0)}
            </td>
          `;
        });
        
        const total = items.reduce((sum, item) => sum + item.Actual, 0);
        tableRowsHTML += `
            <td style="padding: 4px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold; font-size: 10px;">
              ${formatNumber(total)}
            </td>
          </tr>
        `;
      });
      
      // Total Income row
      tableRowsHTML += `
        <tr style="background-color: #f0f0f0; font-weight: bold;">
          <td style="padding: 4px; border: 1px solid #ddd; font-size: 10px;"></td>
          <td style="padding: 4px; border: 1px solid #ddd; font-size: 10px; font-weight: bold;">TOTAL INCOME</td>
      `;
      areas.forEach(area => {
        tableRowsHTML += `
          <td style="padding: 4px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold; font-size: 10px;">
            ${formatNumber(totals.incomeTotalsByArea[area])}
          </td>
        `;
      });
      tableRowsHTML += `
          <td style="padding: 4px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold; font-size: 10px;">
            ${formatNumber(totals.totalIncomeGrand)}
          </td>
        </tr>
      `;
    }
    
    // Expenditure section
    if (expenditureKeys.length > 0) {
      tableRowsHTML += `
        <tr class="category-header">
          <td colspan="${3 + areas.length}" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000;">EXPENDITURES</td>
        </tr>
      `;
      
      expenditureKeys.forEach(key => {
        const items = grouped[key];
        const firstItem = items[0];
        tableRowsHTML += `
          <tr>
            <td style="padding: 4px; border: 1px solid #ddd; font-family: monospace; font-size: 10px;">${firstItem.Account.trim()}</td>
            <td style="padding: 4px; border: 1px solid #ddd; font-size: 10px;">${firstItem.CatName.trim()}</td>
        `;
        
        areas.forEach(area => {
          const areaItem = items.find(item => item.AreaNum === area);
          tableRowsHTML += `
            <td style="padding: 4px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-size: 10px;">
              ${formatNumber(areaItem?.Actual || 0)}
            </td>
          `;
        });
        
        const total = items.reduce((sum, item) => sum + item.Actual, 0);
        tableRowsHTML += `
            <td style="padding: 4px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold; font-size: 10px;">
              ${formatNumber(total)}
            </td>
          </tr>
        `;
      });
      
      // Total Expenditure row
      tableRowsHTML += `
        <tr style="background-color: #f0f0f0; font-weight: bold;">
          <td style="padding: 4px; border: 1px solid #ddd; font-size: 10px;"></td>
          <td style="padding: 4px; border: 1px solid #ddd; font-size: 10px; font-weight: bold;">TOTAL EXPENDITURE</td>
      `;
      areas.forEach(area => {
        tableRowsHTML += `
          <td style="padding: 4px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold; font-size: 10px;">
            ${formatNumber(totals.expenditureTotalsByArea[area])}
          </td>
        `;
      });
      tableRowsHTML += `
          <td style="padding: 4px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold; font-size: 10px;">
            ${formatNumber(totals.totalExpenditureGrand)}
          </td>
        </tr>
      `;
    }
    
    // Net Total row
    tableRowsHTML += `
      <tr style="background-color: #e0e0e0; font-weight: bold; border-top: 2px solid #7A0000;">
        <td style="padding: 4px; border: 1px solid #ddd; font-size: 10px;"></td>
        <td style="padding: 4px; border: 1px solid #ddd; font-size: 10px; font-weight: bold;">NET TOTAL</td>
    `;
    areas.forEach(area => {
      tableRowsHTML += `
        <td style="padding: 4px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold; font-size: 10px;">
          ${formatNumber(totals.netTotalsByArea[area])}
        </td>
      `;
    });
    tableRowsHTML += `
        <td style="padding: 4px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold; font-size: 10px;">
          ${formatNumber(totals.netTotalGrand)}
        </td>
      </tr>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Consolidated Income & Expenditure Provincial Statement - ${getMonthName(selectedMonth)} ${selectedYear}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 15px;
            font-size: 10px;
            color: #333;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #7A0000;
            padding-bottom: 10px;
          }
          
          .header h1 {
            color: #7A0000;
            font-size: 14px;
            margin: 0;
            font-weight: bold;
          }
          
          .header h2 {
            color: #7A0000;
            font-size: 12px;
            margin: 5px 0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9px;
          }
          
          th {
            background-color: #7A0000;
            color: white;
            font-weight: bold;
            text-align: center;
            padding: 6px 4px;
            border: 1px solid #7A0000;
            font-size: 9px;
          }
          
          td {
            padding: 3px 4px;
            border: 1px solid #ddd;
            font-size: 9px;
          }
          
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8px;
            color: #666;
          }
          
          @media print {
            body { margin: 0; font-size: 8px; }
            table { font-size: 8px; }
            th, td { padding: 2px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CONSOLIDATED INCOME & EXPENDITURE PROVINCIAL STATEMENT</h1>
          <h1>PERIOD ENDED ${getMonthName(selectedMonth).toUpperCase()} ${selectedYear}</h1>
          <h2>ProvinceCompany: ${selectedCompany?.compId} - ${selectedCompany?.CompName}</h2>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">Account</th>
              <th style="width: 25%;">Description</th>
              ${areas.map(area => `<th style="width: ${Math.floor(60/areas.length)}%;">Area ${area}</th>`).join('')}
              <th style="width: 10%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Prepared By: _________________ | Checked By: _________________ | Accountant: _________________</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
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

  // Income & Expenditure Modal Component with improved table layout like trial balance
  const IncomeExpenditureModal = () => {
    if (!incomeExpModalOpen || !selectedCompany) return null;
    
    const { grouped, areas } = groupDataByArea();
    const totals = calculateTotals();
    
    // Separate income and expenditure
    const incomeKeys = Object.keys(grouped).filter(key => grouped[key][0].CatFlag === "I");
    const expenditureKeys = Object.keys(grouped).filter(key => grouped[key][0].CatFlag === "E" || grouped[key][0].CatFlag === "X");

    return (
      <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
        <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4">
          <div className="p-5 border-b">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">
                  CONSOLIDATED INCOME & EXPENDITURE PROVINCIAL STATEMENT
                </h2>
                <h3 className="text-base font-bold text-gray-800">
                  PERIOD ENDED {getMonthName(selectedMonth).toUpperCase()} {selectedYear}
                </h3>
                <h3 className={`text-sm ${maroon}`}>
                  ProvinceCompany: {selectedCompany.compId} - {selectedCompany.CompName}
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
                <span className={`${maroon} text-sm`}>Loading province income & expenditure data...</span>
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
                  We couldn't find any province income or expenditure records for <strong>{selectedCompany.CompName}</strong> in {getMonthName(selectedMonth)} {selectedYear}.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className={`${maroonBg} text-white`}>
                      <th className="px-2 py-1 text-left sticky left-0 bg-[#7A0000] z-10 min-w-[100px]">Account</th>
                      <th className="px-2 py-1 text-left sticky left-0 bg-[#7A0000] z-10 min-w-[200px]">Description</th>
                      {areas.map(area => (
                        <th key={area} className="px-2 py-1 text-right min-w-[100px]">
                          Area {area}
                        </th>
                      ))}
                      <th className="px-2 py-1 text-right font-bold min-w-[100px]">COMPANY TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Income Section */}
                    {incomeKeys.length > 0 && (
                      <>
                        <tr className="bg-gray-100 border-t border-b border-gray-300">
                          <td colSpan={areas.length + 3} className="px-2 py-1 font-medium text-center text-[#7A0000]">
                            INCOME
                          </td>
                        </tr>
                        {incomeKeys.map((key, index) => {
                          const items = grouped[key];
                          const firstItem = items[0];
                          const accountTotal = items.reduce((sum, item) => sum + item.Actual, 0);
                          
                          return (
                            <tr key={`income-${index}`} className="border-b hover:bg-gray-50">
                              <td className="px-2 py-1 font-mono sticky left-0 bg-white">
                                {firstItem.Account.trim()}
                              </td>
                              <td className="px-2 py-1 sticky left-0 bg-white">
                                {firstItem.CatName.trim()}
                              </td>
                              {areas.map(area => {
                                const areaItem = items.find(item => item.AreaNum === area);
                                return (
                                  <td key={area} className="px-2 py-1 text-right font-mono">
                                    {formatNumber(areaItem?.Actual || 0)}
                                  </td>
                                );
                              })}
                              <td className="px-2 py-1 text-right font-mono">
                                {formatNumber(accountTotal)}
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* Total Income Row */}
                        <tr className="bg-gray-200 border-t-2 border-gray-400">
                          <td className="px-2 py-1 font-mono sticky left-0 bg-gray-200"></td>
                          <td className="px-2 py-1 font-bold sticky left-0 bg-gray-200">
                            TOTAL INCOME
                          </td>
                          {areas.map(area => (
                            <td key={area} className="px-2 py-1 text-right font-mono font-bold">
                              {formatNumber(totals.incomeTotalsByArea[area])}
                            </td>
                          ))}
                          <td className="px-2 py-1 text-right font-mono font-bold">
                            {formatNumber(totals.totalIncomeGrand)}
                          </td>
                        </tr>
                      </>
                    )}
                    
                    {/* Expenditure Section */}
                    {expenditureKeys.length > 0 && (
                      <>
                        <tr className="bg-gray-100 border-t border-b border-gray-300">
                          <td colSpan={areas.length + 3} className="px-2 py-1 font-medium text-center text-[#7A0000]">
                            EXPENDITURES
                          </td>
                        </tr>
                        {expenditureKeys.map((key, index) => {
                          const items = grouped[key];
                          const firstItem = items[0];
                          const accountTotal = items.reduce((sum, item) => sum + item.Actual, 0);
                          
                          return (
                            <tr key={`exp-${index}`} className="border-b hover:bg-gray-50">
                              <td className="px-2 py-1 font-mono sticky left-0 bg-white">
                                {firstItem.Account.trim()}
                              </td>
                              <td className="px-2 py-1 sticky left-0 bg-white">
                                {firstItem.CatName.trim()}
                              </td>
                              {areas.map(area => {
                                const areaItem = items.find(item => item.AreaNum === area);
                                return (
                                  <td key={area} className="px-2 py-1 text-right font-mono">
                                    {formatNumber(areaItem?.Actual || 0)}
                                  </td>
                                );
                              })}
                              <td className="px-2 py-1 text-right font-mono">
                                {formatNumber(accountTotal)}
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* Total Expenditure Row */}
                        <tr className="bg-gray-200 border-t-2 border-gray-400">
                          <td className="px-2 py-1 font-mono sticky left-0 bg-gray-200"></td>
                          <td className="px-2 py-1 font-bold sticky left-0 bg-gray-200">
                            TOTAL EXPENDITURE
                          </td>
                          {areas.map(area => (
                            <td key={area} className="px-2 py-1 text-right font-mono font-bold">
                              {formatNumber(totals.expenditureTotalsByArea[area])}
                            </td>
                          ))}
                          <td className="px-2 py-1 text-right font-mono font-bold">
                            {formatNumber(totals.totalExpenditureGrand)}
                          </td>
                        </tr>
                      </>
                    )}
                    
                    {/* Net Total Row */}
                    <tr className="bg-yellow-100 border-t-4 border-[#7A0000]">
                      <td className="px-2 py-1 font-mono sticky left-0 bg-yellow-100"></td>
                      <td className="px-2 py-1 font-bold sticky left-0 bg-yellow-100 text-[#7A0000]">
                        NET TOTAL
                      </td>
                      {areas.map(area => (
                        <td key={area} className="px-2 py-1 text-right font-mono font-bold text-[#7A0000]">
                          {formatNumber(totals.netTotalsByArea[area])}
                        </td>
                      ))}
                      <td className="px-2 py-1 text-right font-mono font-bold text-[#7A0000] text-lg">
                        {formatNumber(totals.netTotalGrand)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="mt-6 text-xs">
                  <div className="grid grid-cols-3 gap-4 border-t pt-4">
                    <div>
                      <strong>Prepared By:</strong> _________________
                    </div>
                    <div>
                      <strong>Checked By:</strong> _________________
                    </div>
                    <div>
                      <strong>Accountant:</strong> _________________
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <strong>Date:</strong> {new Date().toLocaleDateString()}
                  </div>
                </div>
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
        <div>
          <h2 className={`text-xl font-bold ${maroon}`}>
            Province Expenditure - Company Details
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
            placeholder="Search by Code"
            onChange={(e) => setSearchId(e.target.value)}
            className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
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
        <div className="text-gray-600 bg-gray-100 p-4 rounded">No companies found.</div>
      )}

      {/* Table */}
      {!loading && !error && epfNo && filtered.length > 0 && (
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
      {selectedCompany && showDateSelection && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 relative max-h-[90vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${maroon}`}>
                Select Period for Province Expenditure - {selectedCompany.CompName}
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
                onClick={fetchProvinceIncomeExpenditureData}
                className="bg-[#7A0000] text-white py-2 px-6 rounded hover:brightness-110 text-sm"
              >
                View Province Expenditure
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

export default ProvinceExpenditure;