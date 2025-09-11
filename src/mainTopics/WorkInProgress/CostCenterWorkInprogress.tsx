import { useEffect, useState, useRef } from "react";
import { Search, RotateCcw, Eye, ChevronLeft, Download, FileText } from "lucide-react";
import { useUser } from "../../contexts/UserContext";

interface Department {
  DeptId: string;
  DeptName: string;
}

interface WorkInProgressData {
  AssignmentYear: string;
  ProjectNo: string;
  CategoryCode: string;
  Description: string;
  FundSource: string;
  WipYear: string;
  WipMonth: string;
  PivNo: string;
  GrandTotal: number;
  PaidDate: string;
  SoftCloseDate: string;
  EstimatedCost: number;
  Status: string;
  ResourceType: string;
  CommittedCost: number;
  CctName: string;
  // Committed costs for each category
  CommittedLabourCost?: number;
  CommittedMaterialCost?: number;
  CommittedOtherCost?: number;
  // Legacy fields for backward compatibility
  LabourCost?: number;
  MaterialCost?: number;
  OtherCost?: number;
  Variance?: number;
  TotalCost?: number;
}

const CostCenterWorkInprogress = () => {
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
  const [showWorkInProgress, setShowWorkInProgress] = useState(false);
  const [workInProgressData, setWorkInProgressData] = useState<WorkInProgressData[]>([]);
  const [workInProgressLoading, setWorkInProgressLoading] = useState(false);
  const [workInProgressError, setWorkInProgressError] = useState<string | null>(null);

  // Ref for print functionality
  const printRef = useRef<HTMLDivElement>(null);

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

  // Paginated departments
  const paginatedDepartments = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Fetch departments - Same API as CostCenterIncomeExpenditure
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

  // Filter departments
  useEffect(() => {
    const f = data.filter(
      (d) =>
        (!searchId || d.DeptId.toLowerCase().includes(searchId.toLowerCase())) &&
        (!searchName || d.DeptName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFiltered(f);
    setPage(1);
  }, [searchId, searchName, data]);

  // Fetch work in progress data
  const fetchWorkInProgressData = async (deptId: string) => {
    setWorkInProgressLoading(true);
    setWorkInProgressError(null);
    try {
      const apiUrl = `/misapi/api/costcenterworkinprogress/${deptId}`;
      
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
      
      // Process the response and map to our interface
      let rawData = [];
      if (Array.isArray(jsonData)) {
        rawData = jsonData;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        rawData = jsonData.data;
      } else if (jsonData.result && Array.isArray(jsonData.result)) {
        rawData = jsonData.result;
      } else if (jsonData.workInProgress && Array.isArray(jsonData.workInProgress)) {
        rawData = jsonData.workInProgress;
      } else {
        console.log('Unexpected response structure:', jsonData);
        rawData = [];
      }
      
      // Map the API response to our WorkInProgressData interface
      const mappedData: WorkInProgressData[] = rawData.map((item: any) => ({
        AssignmentYear: item.AssignmentYear?.toString() || item.assignmentYear?.toString() || "",
        ProjectNo: item.ProjectNo?.toString() || item.projectNo?.toString() || "",
        CategoryCode: item.CategoryCode?.toString() || item.categoryCode?.toString() || "",
        Description: item.Description?.toString() || item.description?.toString() || "",
        FundSource: item.FundSource?.toString() || item.fundSource?.toString() || "",
        WipYear: item.WipYear?.toString() || item.wipYear?.toString() || "",
        WipMonth: item.WipMonth?.toString() || item.wipMonth?.toString() || "",
        PivNo: item.PivNo?.toString() || item.pivNo?.toString() || "",
        GrandTotal: parseFloat(item.GrandTotal || item.grandTotal || 0),
        PaidDate: item.PaidDate?.toString() || item.paidDate?.toString() || "",
        SoftCloseDate: item.SoftCloseDate?.toString() || item.softCloseDate?.toString() || "",
        EstimatedCost: parseFloat(item.EstimatedCost || item.estimatedCost || 0),
        Status: item.Status?.toString() || item.status?.toString() || "",
        ResourceType: item.ResourceType?.toString() || item.resourceType?.toString() || "",
        CommittedCost: parseFloat(item.CommittedCost || item.committedCost || 0),
        CctName: item.CctName?.toString() || item.cctName?.toString() || "",
        // Committed costs for each category - try different field name variations
        CommittedLabourCost: parseFloat(item.CommittedLabourCost || item.committedLabourCost || item.LabourCost || item.labourCost || item.LAB || item.lab || 0),
        CommittedMaterialCost: parseFloat(item.CommittedMaterialCost || item.committedMaterialCost || item.MaterialCost || item.materialCost || item.MAT || item.mat || 0),
        CommittedOtherCost: parseFloat(item.CommittedOtherCost || item.committedOtherCost || item.OtherCost || item.otherCost || item.OTHER || item.other || 0),
        // Legacy fields for backward compatibility
        LabourCost: parseFloat(item.LabourCost || item.labourCost || 0),
        MaterialCost: parseFloat(item.MaterialCost || item.materialCost || 0),
        OtherCost: parseFloat(item.OtherCost || item.otherCost || 0),
        Variance: parseFloat(item.Variance || item.variance || 0),
        TotalCost: parseFloat(item.TotalCost || item.totalCost || 0),
      }));
      
      setWorkInProgressData(mappedData);
      setShowWorkInProgress(true);
    } catch (error: any) {
      setWorkInProgressError(error.message.includes("JSON.parse") ? "Invalid data format received from server" : error.message);
    } finally {
      setWorkInProgressLoading(false);
    }
  };

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    fetchWorkInProgressData(department.DeptId);
  };

  const closeWorkInProgressModal = () => {
    setShowWorkInProgress(false);
    setWorkInProgressData([]);
    setSelectedDepartment(null);
  };

  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
  };

  // CSV Export function
  const downloadAsCSV = () => {
    if (!workInProgressData.length || !selectedDepartment) return;

    // Create consolidated data (same logic as in the table)
    const consolidatedMap = new Map<string, WorkInProgressData>();
    
    workInProgressData.forEach((item) => {
      const key = `${item.ProjectNo?.trim()}-${item.CategoryCode?.trim()}`;
      
      if (consolidatedMap.has(key)) {
        const existing = consolidatedMap.get(key)!;
        const resourceType = item.ResourceType?.trim().toUpperCase();
        const committedCost = item.CommittedCost || 0;
        
        if (resourceType === 'LAB' || resourceType === 'LABOUR') {
          existing.CommittedLabourCost = (existing.CommittedLabourCost || 0) + committedCost;
        } else if (resourceType === 'MAT' || resourceType === 'MATERIAL') {
          existing.CommittedMaterialCost = (existing.CommittedMaterialCost || 0) + committedCost;
        } else if (resourceType === 'OTHER') {
          existing.CommittedOtherCost = (existing.CommittedOtherCost || 0) + committedCost;
        }
      } else {
        const resourceType = item.ResourceType?.trim().toUpperCase();
        const committedCost = item.CommittedCost || 0;
        
        const consolidatedItem: WorkInProgressData = {
          ...item,
          CommittedLabourCost: 0,
          CommittedMaterialCost: 0,
          CommittedOtherCost: 0,
        };
        
        if (resourceType === 'LAB' || resourceType === 'LABOUR') {
          consolidatedItem.CommittedLabourCost = committedCost;
        } else if (resourceType === 'MAT' || resourceType === 'MATERIAL') {
          consolidatedItem.CommittedMaterialCost = committedCost;
        } else if (resourceType === 'OTHER') {
          consolidatedItem.CommittedOtherCost = committedCost;
        }
        
        consolidatedMap.set(key, consolidatedItem);
      }
    });

    const sortedData = Array.from(consolidatedMap.values()).sort((a, b) => {
      const yearCompare = (b.AssignmentYear || '').localeCompare(a.AssignmentYear || '');
      if (yearCompare !== 0) return yearCompare;
      return (a.ProjectNo || '').localeCompare(b.ProjectNo || '');
    });

    // Create CSV headers
    const headers = [
      "Year",
      "Project No./Code", 
      "Category Code",
      "Fund Source",
      "WIP Year",
      "Estimated Cost",
      "Description",
      "Status",
      "LAB",
      "MAT", 
      "OTHER",
      "Total",
      "Variance"
    ];

    // Create CSV rows
    const csvRows = [
      headers,
      ...sortedData.map((item) => {
        const labCost = item.CommittedLabourCost || item.LabourCost || 0;
        const matCost = item.CommittedMaterialCost || item.MaterialCost || 0;
        const otherCost = item.CommittedOtherCost || item.OtherCost || 0;
        const total = labCost + matCost + otherCost;
        const variance = (item.EstimatedCost || 0) - total;

        return [
          item.AssignmentYear || "",
          item.ProjectNo || "",
          item.CategoryCode || "",
          item.FundSource || "",
          item.WipYear || "0",
          (item.EstimatedCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          `"${(item.Description || "").replace(/"/g, '""')}"`, // Escape quotes in description
          item.Status || "",
          labCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          matCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          otherCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ];
      })
    ];

    // Create CSV content
    const csvContent = csvRows.map(row => row.join(",")).join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WorkInProgress_${selectedDepartment.DeptId}_${selectedDepartment.DeptName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF Export function
  const printPDF = () => {
    if (!printRef.current || !selectedDepartment) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Create consolidated data (same logic as in the table)
    const consolidatedMap = new Map<string, WorkInProgressData>();
    
    workInProgressData.forEach((item) => {
      const key = `${item.ProjectNo?.trim()}-${item.CategoryCode?.trim()}`;
      
      if (consolidatedMap.has(key)) {
        const existing = consolidatedMap.get(key)!;
        const resourceType = item.ResourceType?.trim().toUpperCase();
        const committedCost = item.CommittedCost || 0;
        
        if (resourceType === 'LAB' || resourceType === 'LABOUR') {
          existing.CommittedLabourCost = (existing.CommittedLabourCost || 0) + committedCost;
        } else if (resourceType === 'MAT' || resourceType === 'MATERIAL') {
          existing.CommittedMaterialCost = (existing.CommittedMaterialCost || 0) + committedCost;
        } else if (resourceType === 'OTHER') {
          existing.CommittedOtherCost = (existing.CommittedOtherCost || 0) + committedCost;
        }
      } else {
        const resourceType = item.ResourceType?.trim().toUpperCase();
        const committedCost = item.CommittedCost || 0;
        
        const consolidatedItem: WorkInProgressData = {
          ...item,
          CommittedLabourCost: 0,
          CommittedMaterialCost: 0,
          CommittedOtherCost: 0,
        };
        
        if (resourceType === 'LAB' || resourceType === 'LABOUR') {
          consolidatedItem.CommittedLabourCost = committedCost;
        } else if (resourceType === 'MAT' || resourceType === 'MATERIAL') {
          consolidatedItem.CommittedMaterialCost = committedCost;
        } else if (resourceType === 'OTHER') {
          consolidatedItem.CommittedOtherCost = committedCost;
        }
        
        consolidatedMap.set(key, consolidatedItem);
      }
    });

    const sortedData = Array.from(consolidatedMap.values()).sort((a, b) => {
      const yearCompare = (b.AssignmentYear || '').localeCompare(a.AssignmentYear || '');
      if (yearCompare !== 0) return yearCompare;
      return (a.ProjectNo || '').localeCompare(b.ProjectNo || '');
    });

    // Generate table rows HTML
    let tableRowsHTML = '';
    sortedData.forEach((item) => {
      const labCost = item.CommittedLabourCost || item.LabourCost || 0;
      const matCost = item.CommittedMaterialCost || item.MaterialCost || 0;
      const otherCost = item.CommittedOtherCost || item.OtherCost || 0;
      const total = labCost + matCost + otherCost;
      const variance = (item.EstimatedCost || 0) - total;

      tableRowsHTML += `
        <tr>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px;">${item.AssignmentYear || ""}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px; font-family: monospace;">${item.ProjectNo || ""}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px;">${item.CategoryCode || ""}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px;">${item.FundSource || ""}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px; text-align: center;">${item.WipYear || "0"}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px; text-align: right; font-family: monospace;">${(item.EstimatedCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 8px; max-width: 150px; word-wrap: break-word;">${item.Description || ""}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px; text-align: center;">${item.Status || ""}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px; text-align: right; font-family: monospace;">${labCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px; text-align: right; font-family: monospace;">${matCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px; text-align: right; font-family: monospace;">${otherCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px; text-align: right; font-family: monospace; font-weight: bold;">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 2px 4px; border: 1px solid #ddd; font-size: 9px; text-align: right; font-family: monospace; color: ${variance < 0 ? '#dc2626' : variance > 0 ? '#16a34a' : '#6b7280'};">${variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title></title>
          <style>
            body { font-family: Arial; font-size: 10px; margin: 10mm; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 4px; border: 1px solid #ddd; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .header { font-weight: bold; margin-bottom: 8px; color: #7A0000; font-size: 16px; text-align: center; }
            .subheader { margin-bottom: 12px; font-size: 12px; text-align: center; font-weight: 600; }
            .department-info { margin-bottom: 15px; font-size: 11px; text-align: center; }
            .currency { text-align: right; font-size: 8px; color: #666; margin-bottom: 5px; }
            th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              @page {
                margin: 0.5in;
                @top-left { content: ""; }
                @top-right { content: ""; }
                @bottom-left { content: ""; }
                @bottom-right { content: ""; }
                @bottom-center { content: ""; }
              }
            }
          </style>
        </head>
        <body>
          <div class="header">COST CENTER WORK IN PROGRESS REPORT</div>
          <div class="subheader">CEB - Ceylon Electricity Board</div>
          <div class="department-info">Department: ${selectedDepartment.DeptName} (${selectedDepartment.DeptId})</div>
          <div class="currency">Currency: LKR</div>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Project No./Code</th>
                <th>Category Code</th>
                <th>Fund Source</th>
                <th>WIP Year</th>
                <th>Estimated Cost</th>
                <th>Description</th>
                <th>Status</th>
                <th>LAB</th>
                <th>MAT</th>
                <th>OTHER</th>
                <th>Total</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHTML}
            </tbody>
          </table>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Work In Progress Modal Component
  const WorkInProgressModal = () => {
    if (!showWorkInProgress || !selectedDepartment) return null;
    
    return (
      <div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
        <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4">
          <div className="p-5 border-b">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">
                  WORK IN PROGRESS - {selectedDepartment.DeptName}
                </h2>
                <h3 className={`text-sm ${maroon}`}>
                  Department: {selectedDepartment.DeptId}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadAsCSV}
                  disabled={workInProgressData.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3 h-3" />
                  CSV
                </button>
                <button
                  onClick={printPDF}
                  disabled={workInProgressData.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-3 h-3" />
                  PDF
                </button>
              </div>
            </div>
            {workInProgressError && (
              <div className="text-red-600 text-xs mt-2 text-center">
                {workInProgressError.includes("JSON.parse") ? "Data format error" : workInProgressError}
              </div>
            )}
          </div>
          <div className="px-6 py-5 overflow-y-auto flex-grow">
            {workInProgressLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mr-3"></div>
                <span className={`${maroon} text-sm`}>Loading work in progress data...</span>
              </div>
            ) : workInProgressData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Work In Progress Data Available</h3>
                <p className="text-gray-500 text-center max-w-md">
                  We couldn't find any work in progress records for <strong>{selectedDepartment.DeptName}</strong>.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Contact your administrator if you believe this is an error.
                </p>
              </div>
            ) : (
              <div ref={printRef} className="w-full overflow-x-auto text-xs">
                {/* Deduplicate and consolidate data by ProjectNo + CategoryCode */}
                {(() => {
                  // Create a map to consolidate duplicate rows
                  const consolidatedMap = new Map<string, WorkInProgressData>();
                  
                  workInProgressData.forEach((item) => {
                    const key = `${item.ProjectNo?.trim()}-${item.CategoryCode?.trim()}`;
                    
                    if (consolidatedMap.has(key)) {
                      // Merge with existing row
                      const existing = consolidatedMap.get(key)!;
                      
                      // Add committed cost based on ResourceType
                      const resourceType = item.ResourceType?.trim().toUpperCase();
                      const committedCost = item.CommittedCost || 0;
                      
                      if (resourceType === 'LAB' || resourceType === 'LABOUR') {
                        existing.CommittedLabourCost = (existing.CommittedLabourCost || 0) + committedCost;
                      } else if (resourceType === 'MAT' || resourceType === 'MATERIAL') {
                        existing.CommittedMaterialCost = (existing.CommittedMaterialCost || 0) + committedCost;
                      } else if (resourceType === 'OTHER') {
                        existing.CommittedOtherCost = (existing.CommittedOtherCost || 0) + committedCost;
                      }
                    } else {
                      // Create new consolidated row
                      const resourceType = item.ResourceType?.trim().toUpperCase();
                      const committedCost = item.CommittedCost || 0;
                      
                      const consolidatedItem: WorkInProgressData = {
                        ...item,
                        CommittedLabourCost: 0,
                        CommittedMaterialCost: 0,
                        CommittedOtherCost: 0,
                      };
                      
                      // Set the appropriate committed cost based on ResourceType
                      if (resourceType === 'LAB' || resourceType === 'LABOUR') {
                        consolidatedItem.CommittedLabourCost = committedCost;
                      } else if (resourceType === 'MAT' || resourceType === 'MATERIAL') {
                        consolidatedItem.CommittedMaterialCost = committedCost;
                      } else if (resourceType === 'OTHER') {
                        consolidatedItem.CommittedOtherCost = committedCost;
                      }
                      
                      consolidatedMap.set(key, consolidatedItem);
                    }
                  });
                  
                  // Convert map to array and sort by AssignmentYear (descending) then by ProjectNo
                  const sortedData = Array.from(consolidatedMap.values()).sort((a, b) => {
                    const yearCompare = (b.AssignmentYear || '').localeCompare(a.AssignmentYear || '');
                    if (yearCompare !== 0) return yearCompare;
                    return (a.ProjectNo || '').localeCompare(b.ProjectNo || '');
                  });

                  return (
                    <div className="border border-gray-200 rounded-lg">
                      {/* Currency indicator */}
                      <div className="flex justify-end p-2 bg-gray-50 border-b">
                        <span className="text-xs font-semibold text-gray-600">Currency: LKR</span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100 text-gray-700">
                              <th className="px-2 py-1 text-left border-r">Year</th>
                              <th className="px-2 py-1 text-left border-r">Project No./Code</th>
                              <th className="px-2 py-1 text-left border-r">Category Code</th>
                              <th className="px-2 py-1 text-left border-r">Fund Source</th>
                              <th className="px-2 py-1 text-center border-r">WIP Year</th>
                              <th className="px-2 py-1 text-right border-r">Estimated Cost</th>
                              <th className="px-2 py-1 text-left border-r">Description</th>
                              <th className="px-2 py-1 text-center border-r">Status</th>
                              <th className="px-2 py-1 text-right border-r">LAB</th>
                              <th className="px-2 py-1 text-right border-r">MAT</th>
                              <th className="px-2 py-1 text-right border-r">OTHER</th>
                              <th className="px-2 py-1 text-right border-r">Total</th>
                              <th className="px-2 py-1 text-right">Variance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedData.map((item, index) => {
                              // Use committed costs for LAB, MAT, OTHER
                              const labCost = item.CommittedLabourCost || item.LabourCost || 0;
                              const matCost = item.CommittedMaterialCost || item.MaterialCost || 0;
                              const otherCost = item.CommittedOtherCost || item.OtherCost || 0;
                              
                              // Calculate Total = Committed LAB + Committed MAT + Committed OTHER
                              const total = labCost + matCost + otherCost;
                              
                              // Calculate Variance = Estimated Cost - Total (Committed Costs)
                              const variance = (item.EstimatedCost || 0) - total;
                              
                              return (
                                <tr key={`${item.ProjectNo}-${index}`} className="border-b hover:bg-gray-50">
                                  <td className="px-2 py-1 text-xs border-r font-medium">{item.AssignmentYear}</td>
                                  <td className="px-2 py-1 font-mono text-xs border-r">{item.ProjectNo}</td>
                                  <td className="px-2 py-1 text-xs border-r">{item.CategoryCode}</td>
                                  <td className="px-2 py-1 text-xs border-r">{item.FundSource}</td>
                                  <td className="px-2 py-1 text-center text-xs border-r">{item.WipYear || '0'}</td>
                                  <td className="px-2 py-1 text-right font-mono text-xs border-r">
                                    {(item.EstimatedCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 text-xs border-r max-w-xs" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                                    <div className="whitespace-normal break-words">
                                      {item.Description}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1 text-center border-r">
                                    <span className={`px-1 py-0.5 rounded text-xs ${
                                      item.Status === 'Open' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {item.Status}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1 text-right font-mono text-xs border-r">
                                    {labCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 text-right font-mono text-xs border-r">
                                    {matCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 text-right font-mono text-xs border-r">
                                    {otherCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 text-right font-mono text-xs border-r font-semibold">
                                    {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 text-right font-mono text-xs">
                                    <span className={variance < 0 ? 'text-red-600' : variance > 0 ? 'text-green-600' : 'text-gray-600'}>
                                      {variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="p-5 border-t flex justify-center gap-3">
            <button
              onClick={() => {
                setShowWorkInProgress(false);
              }}
              className="flex items-center gap-2 px-4 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Department List
            </button>
            <button
              onClick={closeWorkInProgressModal}
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
            Cost Center Work In Progress
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

      {/* Work In Progress Modal */}
      <WorkInProgressModal />
    </div>
  );
};
export default CostCenterWorkInprogress;
