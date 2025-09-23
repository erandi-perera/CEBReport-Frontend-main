import React, { useEffect, useState } from "react";
import { Search, RotateCcw, Eye, Download, Printer } from "lucide-react";
import { useUser } from "../../contexts/UserContext";

interface CostCenter {
  CostCenterId: string;
  CostCenterName: string;
}

interface QuantityOnHandData {
  MatCd: string;
  MatNm: string;
  GrdCd: string;
  MajUom: string;
  Alocated: number;
  QtyOnHand: number;
  UnitPrice: number;
  Value: number;
  CctName: string;
}

const CostCenterQuantityHnad: React.FC = () => {
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

  // Quantity On Hand modal state
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [quantityData, setQuantityData] = useState<QuantityOnHandData[]>([]);
  const [quantityLoading, setQuantityLoading] = useState(false);
  const [quantityError, setQuantityError] = useState<string | null>(null);

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


  // Paginated cost centers
  const paginatedCostCenters = filtered.slice((page - 1) * pageSize, page * pageSize);

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
        
        const final: CostCenter[] = rawData.map((item: any) => ({
          CostCenterId: item.DeptId?.toString() || item.deptId?.toString() || item.CostCenterId?.toString() || "",
          CostCenterName: item.DeptName?.toString().trim() || item.deptName?.toString().trim() || item.CostCenterName?.toString().trim() || "",
        }));
        
        setData(final);
        setFiltered(final);
      } catch (e: any) {
        console.error('API Error:', e);
        setError(e.message.includes("JSON.parse") ? "Invalid data format received from server. Please check if the API is returning valid JSON." : e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [epfNo]);

  // Filter cost centers
  useEffect(() => {
    const f = data.filter(
      (d) =>
        (!searchId || d.CostCenterId.toLowerCase().includes(searchId.toLowerCase())) &&
        (!searchName || d.CostCenterName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFiltered(f);
    setPage(1);
  }, [searchId, searchName, data]);

  // Fetch quantity on hand data
  const fetchQuantityData = async () => {
    if (!selectedCostCenter) return;
    
    setQuantityLoading(true);
    setQuantityError(null);
    try {
      const res = await fetch(`/materials/api/inventoryonhand/${selectedCostCenter.CostCenterId}`);
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
      } else if (parsed.materials && Array.isArray(parsed.materials)) {
        rawData = parsed.materials;
      } else {
        console.log('Unexpected response structure:', parsed);
        rawData = [];
      }
      
      setQuantityData(rawData);
      setQuantityModalOpen(true);
    } catch (error: any) {
      console.error('API Error:', error);
      setQuantityError(error.message.includes("JSON.parse") ? "Invalid data format received from server. Please check if the API is returning valid JSON." : error.message);
    } finally {
      setQuantityLoading(false);
    }
  };

  const handleCostCenterSelect = (costCenter: CostCenter) => {
    setSelectedCostCenter(costCenter);
    fetchQuantityData();
  };

  const closeQuantityModal = () => {
    setQuantityModalOpen(false);
    setQuantityData([]);
    setSelectedCostCenter(null);
  };

  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
  };


  const formatNumber = (num: number | null): string => {
    if (num === null || num === 0) return "0.00";
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(num);
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
    if (!quantityData || quantityData.length === 0) return;
    
    const headers = [
      "Material Code", "Material Name", "Grade Code", "Unit", "Allocated", 
      "Quantity On Hand", "Unit Price", "Value"
    ];
    
    const dataRows = quantityData.map(item => [
      escapeCSVField(item.MatCd?.trim() || ""),
      escapeCSVField(item.MatNm?.trim() || ""),
      escapeCSVField(item.GrdCd?.trim() || ""),
      escapeCSVField(item.MajUom?.trim() || ""),
      escapeCSVField(item.Alocated || 0),
      escapeCSVField(item.QtyOnHand || 0),
      escapeCSVField(formatNumber(item.UnitPrice || 0)),
      escapeCSVField(formatNumber(item.Value || 0))
    ]);
    
    const csvContent = [
      headers.join(","),
      ...dataRows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QuantityOnHand_${selectedCostCenter?.CostCenterId}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print PDF function
  const printPDF = () => {
    if (!quantityData || quantityData.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableRowsHTML = '';
    quantityData.forEach((item) => {
      tableRowsHTML += `
        <tr>
          <td style="padding: 4px 8px; border: 1px solid #333; font-family: monospace; font-size: 11px;">${item.MatCd?.trim() || ""}</td>
          <td style="padding: 4px 8px; border: 1px solid #333; font-size: 11px;">${item.MatNm?.trim() || ""}</td>
          <td style="padding: 4px 8px; border: 1px solid #333; text-align: center; font-size: 11px;">${item.GrdCd?.trim() || ""}</td>
          <td style="padding: 4px 8px; border: 1px solid #333; text-align: center; font-size: 11px;">${item.MajUom?.trim() || ""}</td>
          <td style="padding: 4px 8px; border: 1px solid #333; text-align: right; font-family: monospace; font-size: 11px;">${item.Alocated || 0}</td>
          <td style="padding: 4px 8px; border: 1px solid #333; text-align: right; font-family: monospace; font-size: 11px;">${item.QtyOnHand || 0}</td>
          <td style="padding: 4px 8px; border: 1px solid #333; text-align: right; font-family: monospace; font-size: 11px;">${formatNumber(item.UnitPrice || 0)}</td>
          <td style="padding: 4px 8px; border: 1px solid #333; text-align: right; font-family: monospace; font-size: 11px;">${formatNumber(item.Value || 0)}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quantity On Hand Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 15px;
            font-size: 11px;
            color: #000;
            line-height: 1.2;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 14px;
            margin: 0;
            font-weight: bold;
            text-transform: uppercase;
          }
          .header h2 {
            font-size: 12px;
            margin: 3px 0;
            font-weight: normal;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 11px;
          }
          th {
            background-color: #fff;
            color: #000;
            font-weight: bold;
            text-align: center;
            padding: 6px 8px;
            border: 1px solid #333;
            font-size: 11px;
          }
          .currency-info {
            text-align: left;
            margin-bottom: 10px;
            font-size: 10px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #333;
            padding-top: 10px;
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
          <h1>CEYLON ELECTRICITY BOARD - INVENTORY REPORT - COST CENTRE: ${selectedCostCenter?.CostCenterId} / ${selectedCostCenter?.CostCenterName}</h1>
          <h2>QUANTITY ON HAND REPORT - ${new Date().toLocaleDateString()}</h2>
        </div>
        
        <div class="currency-info">
          <strong>Currency: LKR</strong>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 12%; text-align: left;">MATERIAL CODE</th>
              <th style="width: 30%; text-align: left;">MATERIAL NAME</th>
              <th style="width: 10%; text-align: center;">GRADE CODE</th>
              <th style="width: 10%; text-align: center;">UNIT</th>
              <th style="width: 12%; text-align: center;">ALLOCATED</th>
              <th style="width: 14%; text-align: center;">QUANTITY ON HAND</th>
              <th style="width: 12%; text-align: center;">UNIT PRICE</th>
              <th style="width: 12%; text-align: center;">VALUE</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleDateString()} | CEB Inventory System</p>
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

  // Quantity On Hand Modal Component
  const QuantityOnHandModal = () => {
    if (!quantityModalOpen || !selectedCostCenter) return null;
    
    const totalValue = quantityData.reduce((sum, item) => sum + (item.Value || 0), 0);
    const totalQuantity = quantityData.reduce((sum, item) => sum + (item.QtyOnHand || 0), 0);
    const totalAllocated = quantityData.reduce((sum, item) => sum + (item.Alocated || 0), 0);

    return (
      <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
        <div className="bg-white w-full max-w-7xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4">
          <div className="p-5 border-b">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">
                  CEYLON ELECTRICITY BOARD - INVENTORY REPORT
                </h2>
                <h3 className="text-sm font-semibold text-gray-700">
                  COST CENTRE: {selectedCostCenter.CostCenterId} / {selectedCostCenter.CostCenterName}
                </h3>
                <h4 className={`text-sm ${maroon} font-medium`}>
                  QUANTITY ON HAND REPORT - {new Date().toLocaleDateString()}
                </h4>
                <p className="text-xs text-gray-600 mt-2">Currency: LKR</p>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={downloadAsCSV}
                  className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                >
                  <Download className="w-3 h-3" /> CSV
                </button>
                <button
                  onClick={printPDF}
                  className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
                >
                  <Printer className="w-3 h-3" /> PDF
                </button>
              </div>
            </div>
            {quantityError && (
              <div className="text-red-600 text-xs mt-2 text-center">
                {quantityError}
              </div>
            )}
          </div>
          <div className="px-6 py-5 overflow-y-auto flex-grow">
            {quantityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mr-3"></div>
                <span className={`${maroon} text-sm`}>Loading quantity on hand data...</span>
              </div>
            ) : quantityData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Inventory Data Available</h3>
                <p className="text-gray-500 text-center max-w-md">
                  We couldn't find any quantity on hand records for <strong>{selectedCostCenter.CostCenterName}</strong>.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Try selecting a different month or year, or contact your administrator if you believe this is an error.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto text-xs">
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr className="bg-white border-b border-gray-800">
                      <th className="px-3 py-2 text-left border-r border-gray-800 font-bold">MATERIAL<br/>CODE</th>
                      <th className="px-3 py-2 text-left border-r border-gray-800 font-bold">MATERIAL<br/>NAME</th>
                      <th className="px-3 py-2 text-center border-r border-gray-800 font-bold">GRADE<br/>CODE</th>
                      <th className="px-3 py-2 text-center border-r border-gray-800 font-bold">UNIT</th>
                      <th className="px-3 py-2 text-center border-r border-gray-800 font-bold">ALLOCATED</th>
                      <th className="px-3 py-2 text-center border-r border-gray-800 font-bold">QUANTITY<br/>ON HAND</th>
                      <th className="px-3 py-2 text-center border-r border-gray-800 font-bold">UNIT<br/>PRICE</th>
                      <th className="px-3 py-2 text-center font-bold">VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quantityData.map((item, index) => (
                      <tr key={`item-${index}`} className="border-b border-gray-300">
                        <td className="px-3 py-1 font-mono border-r border-gray-300">{item.MatCd?.trim() || ""}</td>
                        <td className="px-3 py-1 border-r border-gray-300">{item.MatNm?.trim() || ""}</td>
                        <td className="px-3 py-1 text-center border-r border-gray-300">{item.GrdCd?.trim() || ""}</td>
                        <td className="px-3 py-1 text-center border-r border-gray-300">{item.MajUom?.trim() || ""}</td>
                        <td className="px-3 py-1 text-right font-mono border-r border-gray-300">{item.Alocated || 0}</td>
                        <td className="px-3 py-1 text-right font-mono border-r border-gray-300">{item.QtyOnHand || 0}</td>
                        <td className="px-3 py-1 text-right font-mono border-r border-gray-300">{formatNumber(item.UnitPrice || 0)}</td>
                        <td className="px-3 py-1 text-right font-mono">{formatNumber(item.Value || 0)}</td>
                      </tr>
                    ))}
                    {/* Summary Row */}
                    <tr className="bg-gray-100 border-t-2 border-gray-800">
                      <td className="px-3 py-2 font-bold border-r border-gray-300"></td>
                      <td className="px-3 py-2 font-bold border-r border-gray-300">TOTAL</td>
                      <td className="px-3 py-2 text-center border-r border-gray-300"></td>
                      <td className="px-3 py-2 text-center border-r border-gray-300"></td>
                      <td className="px-3 py-2 text-right font-mono font-bold border-r border-gray-300">{totalAllocated}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold border-r border-gray-300">{totalQuantity}</td>
                      <td className="px-3 py-2 text-center border-r border-gray-300"></td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{formatNumber(totalValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="p-5 border-t flex justify-center gap-3">
            <button
              onClick={closeQuantityModal}
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
            Cost Center Quantity On Hand
          </h2>
        </div>
      </div>

      {/* Search Controls */}
      <div className="flex flex-wrap gap-3 justify-end mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            value={searchId}
            placeholder="Search by Cost Center ID"
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
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full table-fixed text-left text-gray-700 text-sm">
                <thead className={`${maroonGrad} text-white sticky top-0`}>
                  <tr>
                    <th className="px-4 py-2 w-1/4">Cost Center ID</th>
                    <th className="px-4 py-2 w-1/2">Cost Center Name</th>
                    <th className="px-4 py-2 w-1/4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCostCenters.map((costCenter, i) => (
                    <tr key={`${costCenter.CostCenterId}-${i}`} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 truncate font-mono">{costCenter.CostCenterId}</td>
                      <td className="px-4 py-2 truncate">{costCenter.CostCenterName}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleCostCenterSelect(costCenter)}
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


      {/* Quantity On Hand Modal */}
      <QuantityOnHandModal />
    </div>
  );
};

export default CostCenterQuantityHnad;
